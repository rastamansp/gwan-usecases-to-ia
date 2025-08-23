import { Injectable, Inject } from '@nestjs/common';
import { ExecuteSearchCommand } from '../commands/execute-search.command';
import { IProductRepository } from '../../infrastructure/interfaces/product-repository.interface';
import { IQueueService } from '../../infrastructure/interfaces/queue-service.interface';
import { ILogger } from '../../infrastructure/interfaces/logger.interface';
import { ProductSearch } from '../../domain/entities/product-search.entity';
import { SearchStatus } from '../../domain/enums/search-status.enum';

export interface ExecuteSearchResult {
  searchId: string;
  productName: string;
  status: SearchStatus;
  createdAt: Date;
}

@Injectable()
export class ExecuteProductSearchUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    
    @Inject('IQueueService')
    private readonly queueService: IQueueService,
    
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  public async execute(command: ExecuteSearchCommand): Promise<ExecuteSearchResult> {
    try {
      this.logger.info('Iniciando execução da busca de produto', {
        searchId: command.searchId,
        productName: command.productName,
        timestamp: command.timestamp.toISOString(),
      });

      // 1. Validação
      await this.validateCommand(command);
      
      // 2. Execução da lógica de negócio
      const result = await this.processSearch(command);
      
      // 3. Persistência
      await this.saveResult(result);
      
      // 4. Notificação via fila
      await this.notifyCompletion(command);
      
      this.logger.info('Busca executada com sucesso', { 
        searchId: result.searchId,
        productName: result.productName,
      });

      return result;
    } catch (error) {
      this.logger.error('Erro ao executar busca', { 
        command, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  private async validateCommand(command: ExecuteSearchCommand): Promise<void> {
    if (!command.productName || command.productName.trim().length === 0) {
      throw new Error('Nome do produto é obrigatório');
    }

    // Validação mais robusta do maxResults
    const maxResults = command.maxResults || 50;
    if (maxResults < 1 || maxResults > 100) {
      throw new Error('Máximo de resultados deve estar entre 1 e 100');
    }

    if (!command.isValidPriceRange()) {
      throw new Error('Faixa de preço inválida: valor mínimo deve ser menor que o máximo');
    }
  }

  private async processSearch(command: ExecuteSearchCommand): Promise<ExecuteSearchResult> {
    // Criar entidade de busca
    const productSearch = new ProductSearch();
    productSearch.productName = command.productName;
    productSearch.maxResults = command.maxResults;
    productSearch.category = command.category;
    productSearch.priceMin = command.priceRange?.min;
    productSearch.priceMax = command.priceRange?.max;
    productSearch.status = SearchStatus.QUEUED;

    return {
      searchId: command.searchId,
      productName: productSearch.productName,
      status: productSearch.status,
      createdAt: new Date(),
    };
  }

  private async saveResult(result: ExecuteSearchResult): Promise<void> {
    // Criar entidade para persistência
    const productSearch = new ProductSearch();
    productSearch.id = result.searchId;
    productSearch.productName = result.productName;
    productSearch.status = result.status;
    productSearch.maxResults = 50; // Valor padrão
    productSearch.createdAt = result.createdAt;

    // Salvar no banco
    await this.productRepository.save(productSearch);
    this.logger.info('Resultado salvo no banco', { result });
  }

  private async notifyCompletion(command: ExecuteSearchCommand): Promise<void> {
    const message = {
      searchId: command.searchId,
      productName: command.productName,
      maxResults: command.maxResults,
      category: command.category,
      priceRange: command.priceRange,
      timestamp: command.timestamp.toISOString(),
      priority: 1,
    };

    await this.queueService.sendMessage('search-product', message);
    
    this.logger.info('Mensagem enviada para fila', { 
      searchId: command.searchId,
      queueName: 'search-product',
    });
  }
}
