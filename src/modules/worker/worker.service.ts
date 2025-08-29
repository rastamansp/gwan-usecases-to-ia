import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PlaywrightService, ProductSearchData, ProductResult } from './playwright.service';
import { QueueConsumerService } from './queue-consumer.service';

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerService.name);
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isInitializing = false;

  constructor(
    private readonly playwrightService: PlaywrightService,
    private readonly queueConsumerService: QueueConsumerService,
  ) {}

  /**
   * Inicializa o worker automaticamente quando o módulo é carregado
   */
  async onModuleInit() {
    this.logger.log('🚀 Inicializando Worker Service...');

    try {
      // Inicializar Playwright automaticamente
      await this.ensurePlaywrightActive();

      // Iniciar health checks automáticos
      this.startHealthChecks();

      this.logger.log('✅ Worker Service inicializado com sucesso');
    } catch (error) {
      this.logger.error('❌ Erro ao inicializar Worker Service:', error);
      // Tentar novamente em 5 segundos
      setTimeout(() => this.onModuleInit(), 5000);
    }
  }

  /**
   * Limpa recursos quando o módulo é destruído
   */
  async onModuleDestroy() {
    this.logger.log('🛑 Finalizando Worker Service...');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    try {
      await this.playwrightService.closeBrowser();
      this.logger.log('✅ Worker Service finalizado com sucesso');
    } catch (error) {
      this.logger.error('❌ Erro ao finalizar Worker Service:', error);
    }
  }

  /**
   * Garante que o Playwright esteja ativo, inicializando se necessário
   */
  private async ensurePlaywrightActive(): Promise<void> {
    if (this.isInitializing) {
      this.logger.log('⏳ Playwright já está sendo inicializado, aguardando...');
      return;
    }

    if (this.playwrightService.isBrowserActive()) {
      this.logger.log('✅ Playwright já está ativo');
      return;
    }

    this.isInitializing = true;
    this.logger.log('🔧 Playwright não está ativo, inicializando...');

    try {
      await this.playwrightService.initializeBrowser();
      this.logger.log('✅ Playwright inicializado com sucesso');
    } catch (error) {
      this.logger.error('❌ Erro ao inicializar Playwright:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Inicia health checks automáticos
   */
  private startHealthChecks(): void {
    this.logger.log('🔍 Iniciando health checks automáticos...');

    // Verificar a cada 30 segundos
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        this.logger.error('❌ Erro durante health check automático:', error);
      }
    }, 30000); // 30 segundos
  }

  /**
   * Executa health check e recupera automaticamente se necessário
   */
  private async performHealthCheck(): Promise<void> {
    const status = this.getStatus();

    if (!status.playwright.isActive) {
      this.logger.warn('⚠️ Playwright detectado como inativo, tentando recuperar...');

      try {
        await this.autoRecoverPlaywright();
      } catch (error) {
        this.logger.error('❌ Falha na recuperação automática do Playwright:', error);
      }
    }
  }

  /**
   * Recupera automaticamente o Playwright
   */
  private async autoRecoverPlaywright(): Promise<void> {
    this.logger.log('🔄 Iniciando recuperação automática do Playwright...');

    try {
      // Fechar navegador se existir (mesmo que esteja em estado inconsistente)
      await this.playwrightService.closeBrowser();

      // Aguardar um pouco antes de reinicializar
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Inicializar novamente
      await this.playwrightService.initializeBrowser();

      this.logger.log('✅ Playwright recuperado automaticamente com sucesso');
    } catch (error) {
      this.logger.error('❌ Falha na recuperação automática:', error);
      throw error;
    }
  }

  /**
   * Fecha o navegador Playwright
   */
  public async closeBrowser(): Promise<void> {
    try {
      await this.playwrightService.closeBrowser();
      this.logger.log('✅ Navegador fechado com sucesso');
    } catch (error) {
      this.logger.error('❌ Erro ao fechar navegador:', error);
    }
  }

  /**
   * Executa uma operação garantindo que o Playwright esteja ativo
   */
  private async executeWithPlaywright<T>(operation: () => Promise<T>): Promise<T> {
    try {
      // Verificar se o Playwright está ativo
      if (!this.playwrightService.isBrowserActive()) {
        this.logger.warn('⚠️ Playwright não está ativo, tentando recuperar...');
        await this.ensurePlaywrightActive();
      }

      // Executar a operação
      return await operation();
    } catch (error) {
      this.logger.error('❌ Erro durante execução com Playwright:', error);

      // Tentar recuperar e executar novamente uma vez
      try {
        this.logger.log('🔄 Tentando recuperar e executar novamente...');
        await this.autoRecoverPlaywright();
        return await operation();
      } catch (recoveryError) {
        this.logger.error('❌ Falha na recuperação e re-execução:', recoveryError);
        throw recoveryError;
      }
    }
  }

  /**
   * Obtém o status geral do worker
   */
  public getStatus(): {
    playwright: { isActive: boolean };
    queueConsumer: { isActive: boolean; isProcessing: boolean };
    overall: { isHealthy: boolean };
  } {
    const playwrightStatus = {
      isActive: this.playwrightService.isBrowserActive(),
    };

    const queueConsumerStats = this.queueConsumerService.getStats();

    const overallStatus = {
      isHealthy: playwrightStatus.isActive && queueConsumerStats.isActive,
    };

    return {
      playwright: playwrightStatus,
      queueConsumer: queueConsumerStats,
      overall: overallStatus,
    };
  }

  /**
   * Executa busca de produtos usando o PlaywrightService ativo
   */
  public async searchProducts(searchData: ProductSearchData): Promise<ProductResult[]> {
    try {
      // Garantir que o Playwright esteja ativo
      await this.ensurePlaywrightActive();

      // Executar busca usando o PlaywrightService
      const results = await this.playwrightService.searchProducts(searchData);

      this.logger.log(
        `✅ Busca executada com sucesso: ${searchData.productName} - ${results.length} produtos encontrados`,
      );

      return results;
    } catch (error) {
      this.logger.error(`❌ Erro ao executar busca: ${searchData.productName}`, error);
      throw error;
    }
  }

  /**
   * Executa uma busca de teste diretamente (para debugging)
   */
  public async executeTestSearch(productName: string, maxResults: number = 5): Promise<any> {
    try {
      this.logger.log(`Executando busca de teste: ${productName}`);

      const results = await this.searchProducts({
        searchId: 'test-' + Date.now(),
        productName,
        maxResults,
      });

      this.logger.log(`Busca de teste concluída: ${results.length} resultados`);

      return {
        statusCode: 200,
        message: 'Busca de teste executada com sucesso',
        data: {
          productName,
          maxResults,
          resultsCount: results.length,
          results,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`❌ Erro na busca de teste: ${productName}`, error);
      throw error;
    }
  }

  /**
   * Testa navegação básica do Playwright
   */
  public async testBasicNavigation(): Promise<any> {
    return this.executeWithPlaywright(async () => {
      this.logger.log('Executando teste de navegação básica...');

      const result = await this.playwrightService.testBasicNavigation();

      this.logger.log('Teste de navegação básica concluído com sucesso');
      return result;
    });
  }

  /**
   * Reinicia o navegador Playwright
   */
  public async restartBrowser(): Promise<void> {
    try {
      this.logger.log('Reiniciando navegador Playwright...');

      await this.playwrightService.closeBrowser();
      await this.playwrightService.initializeBrowser();

      this.logger.log('Navegador Playwright reiniciado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao reiniciar navegador:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas detalhadas do worker
   */
  public getDetailedStats(): {
    timestamp: string;
    status: any;
    uptime: string;
    memory: any;
  } {
    const status = this.getStatus();

    return {
      timestamp: new Date().toISOString(),
      status,
      uptime: process.uptime().toString(),
      memory: process.memoryUsage(),
    };
  }

  /**
   * Verifica se o worker está funcionando corretamente
   */
  public async healthCheck(): Promise<any> {
    try {
      const stats = this.getStatus();
      const isHealthy = stats.overall.isHealthy;

      // Se não estiver saudável, tentar recuperar automaticamente
      if (!isHealthy && !this.isInitializing) {
        this.logger.warn('⚠️ Worker não está saudável, tentando recuperação automática...');

        try {
          await this.ensurePlaywrightActive();

          // Verificar novamente após recuperação
          const newStats = this.getStatus();
          const newIsHealthy = newStats.overall.isHealthy;

          if (newIsHealthy) {
            this.logger.log('✅ Worker recuperado automaticamente');
          }

          return {
            status: newIsHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            details: newStats,
            recovered: newIsHealthy && !isHealthy,
          };
        } catch (recoveryError) {
          this.logger.error(
            '❌ Falha na recuperação automática durante health check:',
            recoveryError,
          );
        }
      }

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        details: stats,
        recovered: false,
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Força a recuperação manual do Playwright
   */
  public async forceRecovery(): Promise<any> {
    this.logger.log('🔄 Forçando recuperação manual do Playwright...');

    try {
      await this.autoRecoverPlaywright();

      const status = this.getStatus();

      return {
        statusCode: 200,
        message: 'Recuperação forçada executada com sucesso',
        recovered: status.overall.isHealthy,
        timestamp: new Date().toISOString(),
        details: status,
      };
    } catch (error) {
      this.logger.error('❌ Falha na recuperação forçada:', error);

      return {
        statusCode: 500,
        message: 'Falha na recuperação forçada',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Obtém informações detalhadas sobre o estado do Playwright
   */
  public getPlaywrightStatus(): {
    isActive: boolean;
    isInitializing: boolean;
    lastHealthCheck: string;
    autoRecoveryEnabled: boolean;
  } {
    return {
      isActive: this.playwrightService.isBrowserActive(),
      isInitializing: this.isInitializing,
      lastHealthCheck: new Date().toISOString(),
      autoRecoveryEnabled: this.healthCheckInterval !== null,
    };
  }
}
