import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchProductController } from './search-product.controller';
import { ExecuteProductSearchUseCase } from '../../shared/application/use-cases/execute-product-search.use-case';
import { ProductRepository } from '../../shared/infrastructure/repositories/product.repository';
import { RabbitMQQueueService } from '../../shared/infrastructure/services/rabbitmq-queue.service';
import { WinstonLoggerService } from '../../shared/infrastructure/services/winston-logger.service';
import { RabbitMQConfigService } from '../../config/rabbitmq.config';
import { ProductSearch } from '../../shared/domain/entities/product-search.entity';
import { SearchResult } from '../../shared/domain/entities/search-result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductSearch, SearchResult])],
  controllers: [SearchProductController],
  providers: [
    // Use Cases
    ExecuteProductSearchUseCase,

    // Services
    RabbitMQConfigService,
    RabbitMQQueueService,
    WinstonLoggerService,

    // Repositories
    ProductRepository,

    // Providers com tokens de injeção
    {
      provide: 'IProductRepository',
      useClass: ProductRepository,
    },
    {
      provide: 'IQueueService',
      useClass: RabbitMQQueueService,
    },
    {
      provide: 'ILogger',
      useClass: WinstonLoggerService,
    },
  ],
  exports: [ExecuteProductSearchUseCase],
})
export class SearchProductModule {}
