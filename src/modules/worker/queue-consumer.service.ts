import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as amqp from 'amqplib';
import { ProductSearch } from '../../shared/domain/entities/product-search.entity';
import { SearchResult } from '../../shared/domain/entities/search-result.entity';
import { SearchStatus } from '../../shared/domain/enums/search-status.enum';
import { PlaywrightService, ProductSearchData, ProductResult } from './playwright.service';
import { RabbitMQConfigService } from '../../config/rabbitmq.config';

@Injectable()
export class QueueConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueConsumerService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private isProcessing = false;

  constructor(
    @InjectRepository(ProductSearch)
    private readonly productSearchRepository: Repository<ProductSearch>,
    
    @InjectRepository(SearchResult)
    private readonly searchResultRepository: Repository<SearchResult>,
    
    private readonly playwrightService: PlaywrightService,
    @Inject('RabbitMQConfigService')
    private readonly rabbitMQConfig: RabbitMQConfigService,
  ) {}

  /**
   * Inicializa o consumer quando o módulo é carregado
   */
  public async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Inicializando Queue Consumer...');
      this.logger.log('Configuração RabbitMQ:', this.rabbitMQConfig.config);
      await this.initializeConnection();
      await this.startConsuming();
      this.logger.log('Queue Consumer inicializado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao inicializar Queue Consumer:', error);
      // Não vamos mais lançar o erro para evitar que o módulo falhe
      this.logger.error('Queue Consumer falhou na inicialização, mas o módulo continuará funcionando');
    }
  }

  /**
   * Limpa recursos quando o módulo é destruído
   */
  public async onModuleDestroy(): Promise<void> {
    try {
      this.logger.log('Finalizando Queue Consumer...');
      await this.closeConnection();
      await this.playwrightService.closeBrowser();
      this.logger.log('Queue Consumer finalizado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao finalizar Queue Consumer:', error);
    }
  }

  /**
   * Inicializa conexão com RabbitMQ
   */
  private async initializeConnection(): Promise<void> {
    try {
      const config = this.rabbitMQConfig.config;
      
      this.connection = await amqp.connect(config.url) as any;
      this.channel = await (this.connection as any).createChannel();
      
      // Configurar QoS para processar uma mensagem por vez
      await (this.channel as any).prefetch(1);
      
      // Garantir que a fila existe
      await (this.channel as any).assertQueue(config.queueName, this.rabbitMQConfig.queueOptions);
      
      this.logger.log('Conexão com RabbitMQ estabelecida');
      
      // Configurar handlers de eventos
      (this.connection as any).on('error', this.handleConnectionError.bind(this));
      (this.connection as any).on('close', this.handleConnectionClose.bind(this));
      
    } catch (error) {
      this.logger.error('Erro ao conectar com RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Inicia o consumo de mensagens
   */
  private async startConsuming(): Promise<void> {
    if (!this.channel) {
      throw new Error('Canal não disponível');
    }

    try {
      const config = this.rabbitMQConfig.config;
      
      this.logger.log(`Iniciando consumo da fila: ${config.queueName}`);
      
      await this.channel.consume(config.queueName, async (msg) => {
        if (msg) {
          await this.processMessage(msg);
        }
      });
      
      this.logger.log('Consumer iniciado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao iniciar consumer:', error);
      throw error;
    }
  }

  /**
   * Processa uma mensagem da fila
   */
  private async processMessage(msg: amqp.ConsumeMessage): Promise<void> {
    if (this.isProcessing) {
      // Rejeitar mensagem se já estiver processando
      this.channel?.nack(msg, false, true);
      return;
    }

    this.isProcessing = true;
    
    try {
      const messageContent = JSON.parse(msg.content.toString());
      this.logger.log(`Processando mensagem: ${messageContent.searchId}`);
      
      // Validar mensagem
      if (!this.isValidMessage(messageContent)) {
        this.logger.warn(`Mensagem inválida rejeitada: ${JSON.stringify(messageContent)}`);
        this.channel?.ack(msg);
        return;
      }

      // Atualizar status para PROCESSING
      await this.updateSearchStatus(messageContent.searchId, SearchStatus.PROCESSING);
      
      // Executar busca com Playwright
      const searchData: ProductSearchData = {
        searchId: messageContent.searchId,
        productName: messageContent.productName,
        maxResults: messageContent.maxResults || 50,
        category: messageContent.category,
        priceRange: messageContent.priceRange,
      };

      const results = await this.playwrightService.searchProducts(searchData);
      
      // Salvar resultados no banco
      await this.saveSearchResults(messageContent.searchId, results);
      
      // Atualizar status para COMPLETED
      await this.updateSearchStatus(messageContent.searchId, SearchStatus.COMPLETED);
      
      this.logger.log(`Mensagem processada com sucesso: ${messageContent.searchId}`);
      
      // Confirmar processamento
      this.channel?.ack(msg);
      
    } catch (error) {
      this.logger.error('Erro ao processar mensagem:', error);
      
      // Atualizar status para FAILED
      try {
        const messageContent = JSON.parse(msg.content.toString());
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.updateSearchStatus(
          messageContent.searchId, 
          SearchStatus.FAILED, 
          errorMessage
        );
      } catch (updateError) {
        this.logger.error('Erro ao atualizar status para FAILED:', updateError);
      }
      
      // Rejeitar mensagem (não reenviar para a fila)
      this.channel?.nack(msg, false, false);
      
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Valida se a mensagem tem o formato correto
   */
  private isValidMessage(message: any): boolean {
    return (
      message &&
      typeof message.searchId === 'string' &&
      typeof message.productName === 'string' &&
      message.productName.trim().length > 0
    );
  }

  /**
   * Atualiza o status de uma busca
   */
  private async updateSearchStatus(
    searchId: string, 
    status: SearchStatus, 
    errorMessage?: string
  ): Promise<void> {
    try {
      const search = await this.productSearchRepository.findOne({
        where: { id: searchId }
      });

      if (!search) {
        this.logger.warn(`Busca não encontrada: ${searchId}`);
        return;
      }

      if (status === SearchStatus.PROCESSING) {
        search.markAsProcessing();
      } else if (status === SearchStatus.COMPLETED) {
        search.markAsCompleted();
      } else if (status === SearchStatus.FAILED && errorMessage) {
        search.markAsFailed(errorMessage);
      }

      await this.productSearchRepository.save(search);
      this.logger.log(`Status atualizado para ${status}: ${searchId}`);
      
    } catch (error) {
      this.logger.error(`Erro ao atualizar status: ${searchId}`, error);
    }
  }

  /**
   * Salva os resultados da busca no banco
   */
  private async saveSearchResults(searchId: string, results: ProductResult[]): Promise<void> {
    try {
      if (results.length === 0) {
        this.logger.log(`Nenhum resultado para salvar: ${searchId}`);
        return;
      }

      const searchResults = results.map(result => {
        const searchResult = new SearchResult();
        searchResult.searchId = searchId;
        searchResult.title = result.title;
        
        // Converter preços para números, garantindo que sejam válidos
        searchResult.price = result.price !== undefined && result.price !== null ? Number(result.price) : undefined;
        searchResult.originalPrice = result.originalPrice !== undefined && result.originalPrice !== null ? Number(result.originalPrice) : undefined;
        searchResult.discountPercentage = result.discountPercentage !== undefined && result.discountPercentage !== null ? Number(result.discountPercentage) : undefined;
        
        searchResult.sellerName = result.sellerName;
        
        // Converter avaliação para número
        searchResult.sellerRating = result.sellerRating !== undefined && result.sellerRating !== null ? Number(result.sellerRating) : undefined;
        
        searchResult.freeShipping = result.freeShipping;
        searchResult.condition = result.condition;
        searchResult.imageUrl = result.imageUrl;
        searchResult.productUrl = result.productUrl;
        
        // Log para debug
        this.logger.debug(`Mapeando resultado: ${result.title.substring(0, 50)}...`);
        this.logger.debug(`  Preço: ${result.price} -> ${searchResult.price}`);
        this.logger.debug(`  Preço Original: ${result.originalPrice} -> ${searchResult.originalPrice}`);
        this.logger.debug(`  Desconto: ${result.discountPercentage} -> ${searchResult.discountPercentage}`);
        this.logger.debug(`  Avaliação: ${result.sellerRating} -> ${searchResult.sellerRating}`);
        
        return searchResult;
      });

      await this.searchResultRepository.save(searchResults);
      this.logger.log(`${searchResults.length} resultados salvos para: ${searchId}`);
      
    } catch (error) {
      this.logger.error(`Erro ao salvar resultados: ${searchId}`, error);
      throw error;
    }
  }

  /**
   * Handler para erros de conexão
   */
  private handleConnectionError(error: Error): void {
    this.logger.error('Erro na conexão RabbitMQ:', error);
    this.reconnect();
  }

  /**
   * Handler para fechamento de conexão
   */
  private handleConnectionClose(): void {
    this.logger.warn('Conexão RabbitMQ fechada');
    this.reconnect();
  }

  /**
   * Reconecta ao RabbitMQ
   */
  private async reconnect(): Promise<void> {
    try {
      this.logger.log('Tentando reconectar ao RabbitMQ...');
      
      await this.closeConnection();
      await new Promise(resolve => setTimeout(resolve, 5000)); // Aguardar 5 segundos
      
      await this.initializeConnection();
      await this.startConsuming();
      
      this.logger.log('Reconexão ao RabbitMQ bem-sucedida');
    } catch (error) {
      this.logger.error('Erro na reconexão ao RabbitMQ:', error);
      // Tentar novamente em 30 segundos
      setTimeout(() => this.reconnect(), 30000);
    }
  }

  /**
   * Fecha a conexão com RabbitMQ
   */
  private async closeConnection(): Promise<void> {
    try {
      if (this.channel) {
        await (this.channel as any).close();
        this.channel = null;
      }
      
      if (this.connection) {
        await (this.connection as any).close();
        this.connection = null;
      }
      
      this.logger.log('Conexão RabbitMQ fechada');
    } catch (error) {
      this.logger.error('Erro ao fechar conexão RabbitMQ:', error);
    }
  }

  /**
   * Verifica se o consumer está ativo
   */
  public isActive(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  /**
   * Obtém estatísticas do consumer
   */
  public getStats(): { isActive: boolean; isProcessing: boolean } {
    return {
      isActive: this.isActive(),
      isProcessing: this.isProcessing,
    };
  }
}
