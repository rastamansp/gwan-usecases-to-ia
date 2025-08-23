import { Injectable, Logger } from '@nestjs/common';
import { PlaywrightService } from './playwright.service';
import { QueueConsumerService } from './queue-consumer.service';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private readonly playwrightService: PlaywrightService,
    private readonly queueConsumerService: QueueConsumerService,
  ) {}

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
   * Executa uma busca de teste diretamente (para debugging)
   */
  public async executeTestSearch(productName: string, maxResults: number = 5): Promise<any> {
    try {
      this.logger.log(`Executando busca de teste: ${productName}`);
      
      const results = await this.playwrightService.searchProducts({
        searchId: 'test-' + Date.now(),
        productName,
        maxResults,
      });
      
      this.logger.log(`Busca de teste concluída: ${results.length} resultados`);
      return results;
      
    } catch (error) {
      this.logger.error(`Erro na busca de teste: ${productName}`, error);
      throw error;
    }
  }

  /**
   * Testa navegação básica do Playwright
   */
  public async testBasicNavigation(): Promise<any> {
    try {
      this.logger.log('Executando teste de navegação básica...');
      
      const result = await this.playwrightService.testBasicNavigation();
      
      this.logger.log('Teste de navegação básica concluído com sucesso');
      return result;
      
    } catch (error) {
      this.logger.error('Erro no teste de navegação básica:', error);
      throw error;
    }
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
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        details: stats,
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }
}
