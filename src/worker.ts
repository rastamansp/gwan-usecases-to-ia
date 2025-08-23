import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WorkerStandaloneModule } from './modules/worker/worker-standalone.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(WorkerStandaloneModule);

  // Configurar prefixo global da API
  app.setGlobalPrefix('api');

  // Configuração do Swagger para o Worker
  const config = new DocumentBuilder()
    .setTitle('Worker API - Product Search Automation')
    .setDescription('API do Worker para automação de busca de produtos usando Playwright')
    .setVersion('1.0')
    .addTag('worker', 'Endpoints para gerenciamento do worker e execução de buscas')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);
  
  console.log(`🚀 Worker iniciado na porta ${port}`);
  console.log(`📊 Ambiente: ${configService.get<string>('NODE_ENV', 'development')}`);
  console.log(`⚙️ Worker disponível em: http://localhost:${port}/api/worker`);
  console.log(`📚 Documentação Swagger: http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('❌ Erro ao iniciar worker:', error);
  process.exit(1);
});
