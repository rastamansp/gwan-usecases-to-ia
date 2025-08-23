import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerService } from './worker.service';
import { PlaywrightService } from './playwright.service';
import { QueueConsumerService } from './queue-consumer.service';
import { WorkerController } from './worker.controller';
import { ProductSearch } from '../../shared/domain/entities/product-search.entity';
import { SearchResult } from '../../shared/domain/entities/search-result.entity';
import { RabbitMQConfigService } from '../../config/rabbitmq.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductSearch, SearchResult]),
  ],
  controllers: [WorkerController],
  providers: [
    WorkerService,
    PlaywrightService,
    QueueConsumerService,
    RabbitMQConfigService,
    {
      provide: 'RabbitMQConfigService',
      useClass: RabbitMQConfigService,
    },
  ],
  exports: [WorkerService],
})
export class WorkerModule {}
