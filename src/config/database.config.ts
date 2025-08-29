import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: configService.get<string>('NODE_ENV') === 'development',
  logging: configService.get<string>('NODE_ENV') === 'development',
  ssl:
    configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
  retryAttempts: 10,
  retryDelay: 3000,
  extra: {
    max: 20,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    query_timeout: 30000,
    statement_timeout: 30000,
  },
  connectTimeoutMS: 10000,
});
