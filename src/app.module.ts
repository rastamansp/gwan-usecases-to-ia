import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfig } from './config/app.config';
import { getDatabaseResilientConfig } from './config/database-resilient.config';
import { ProductSearch } from './shared/domain/entities/product-search.entity';
import { SearchResult } from './shared/domain/entities/search-result.entity';
import { SearchProductModule } from './modules/search-product/search-product.module';
import { WorkerModule } from './modules/worker/worker.module';

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
    SearchProductModule,
    WorkerModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppConfig],
})
export class AppModule {}
