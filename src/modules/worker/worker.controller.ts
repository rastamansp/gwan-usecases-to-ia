import { Controller, Get, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { WorkerService } from './worker.service';

@ApiTags('worker')
@Controller('worker')
export class WorkerController {
  constructor(
    private readonly workerService: WorkerService,
  ) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar saúde do worker',
    description: 'Retorna o status de saúde do worker e seus componentes'
  })
  @ApiResponse({
    status: 200,
    description: 'Status de saúde do worker'
  })
  public async getHealth(): Promise<any> {
    return await this.workerService.healthCheck();
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obter status do worker',
    description: 'Retorna o status atual do worker e informações de operação'
  })
  @ApiResponse({
    status: 200,
    description: 'Status atual do worker'
  })
  public getStatus(): any {
    return this.workerService.getStatus();
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obter estatísticas detalhadas',
    description: 'Retorna estatísticas de performance e métricas do worker'
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas do worker'
  })
  public getStats(): any {
    return this.workerService.getDetailedStats();
  }

  @Post('restart-browser')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reiniciar navegador Playwright',
    description: 'Reinicia o navegador Playwright para resolver problemas de estabilidade'
  })
  @ApiResponse({
    status: 200,
    description: 'Navegador reiniciado com sucesso'
  })
  @ApiResponse({
    status: 500,
    description: 'Erro ao reiniciar navegador'
  })
  public async restartBrowser(): Promise<any> {
    try {
      await this.workerService.restartBrowser();
      return {
        statusCode: 200,
        message: 'Navegador reiniciado com sucesso',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Erro ao reiniciar navegador',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('test-search/:productName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Executar busca de teste',
    description: 'Executa uma busca de teste para validar o funcionamento do worker'
  })
  @ApiParam({
    name: 'productName',
    description: 'Nome do produto para teste',
    example: 'PS5'
  })
  @ApiResponse({
    status: 200,
    description: 'Busca de teste executada com sucesso'
  })
  @ApiResponse({
    status: 500,
    description: 'Erro na execução da busca de teste'
  })
  public async executeTestSearch(
    @Param('productName') productName: string,
  ): Promise<any> {
    try {
      const results = await this.workerService.executeTestSearch(productName, 5);
      return {
        statusCode: 200,
        message: 'Busca de teste executada com sucesso',
        data: {
          productName,
          resultsCount: results.length,
          results,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Erro na busca de teste',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('test-navigation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Testar navegação básica do Playwright',
    description: 'Testa se o Playwright consegue navegar para o Mercado Livre e encontrar elementos básicos'
  })
  @ApiResponse({
    status: 200,
    description: 'Teste de navegação executado com sucesso'
  })
  @ApiResponse({
    status: 500,
    description: 'Erro no teste de navegação'
  })
  public async testNavigation(): Promise<any> {
    try {
      const result = await this.workerService.testBasicNavigation();
      return {
        statusCode: 200,
        message: 'Teste de navegação executado com sucesso',
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Erro no teste de navegação',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
