import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseResilientConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const databaseUrl = configService.get<string>('DATABASE_URL');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL não configurada. Verifique o arquivo .env');
  }

  // Configurações base
  const baseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    url: databaseUrl,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
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
  };

  // Configurações específicas para desenvolvimento
  if (nodeEnv === 'development') {
    return {
      ...baseConfig,
      synchronize: true,
      logging: ['error', 'warn'],
      ssl: false,
    };
  }

  // Configurações específicas para produção
  if (nodeEnv === 'production') {
    return {
      ...baseConfig,
      synchronize: false,
      logging: false,
      ssl: { rejectUnauthorized: false },
    };
  }

  // Configuração padrão
  return {
    ...baseConfig,
    synchronize: false,
    logging: false,
    ssl: false,
  };
};
