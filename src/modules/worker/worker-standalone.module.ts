import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerService } from './worker.service';
import { PlaywrightService } from './playwright.service';
import { QueueConsumerService } from './queue-consumer.service';
import { WorkerController } from './worker.controller';
import { ProductSearch } from '../../shared/domain/entities/product-search.entity';
import { SearchResult } from '../../shared/domain/entities/search-result.entity';
import { RabbitMQConfigService } from '../../config/rabbitmq.config';
import { AppConfig } from '../../config/app.config';
import { getDatabaseResilientConfig } from '../../config/database-resilient.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => getDatabaseResilientConfig(configService),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([ProductSearch, SearchResult]),
  ],
  controllers: [WorkerController],
  providers: [
    WorkerService,
    PlaywrightService,
    QueueConsumerService,
    RabbitMQConfigService,
    AppConfig,
    {
      provide: 'RabbitMQConfigService',
      useClass: RabbitMQConfigService,
    },
  ],
  exports: [WorkerService],
})
export class WorkerStandaloneModule {}
