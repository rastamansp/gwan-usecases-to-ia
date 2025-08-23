import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração global de validação
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuração de CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Prefixo global da API
  app.setGlobalPrefix('api');

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Product Search Automation API')
    .setDescription('API para automação de busca de produtos usando Playwright')
    .setVersion('1.0')
    .addTag('search-product', 'Endpoints para busca de produtos')
    .addTag('worker', 'Endpoints para gerenciamento do worker')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const appConfig = app.get(AppConfig);
  const port = appConfig.port;

  await app.listen(port);

  console.log(`🚀 ${appConfig.appName} rodando na porta ${port}`);
  console.log(`📊 Ambiente: ${appConfig.nodeEnv}`);
  console.log(`🌐 API disponível em: http://localhost:${port}/api`);
  console.log(`📚 Documentação Swagger: http://localhost:${port}/api/docs`);
}
bootstrap();
