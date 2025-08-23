import { ConfigService } from '@nestjs/config';

export interface TestConfig {
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  rabbitmq: {
    host: string;
    port: number;
    username: string;
    password: string;
    vhost: string;
  };
  app: {
    port: number;
    host: string;
  };
  playwright: {
    headless: boolean;
    slowMo: number;
    timeout: number;
  };
}

export class TestConfigService {
  private static instance: TestConfigService;
  private config: TestConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): TestConfigService {
    if (!TestConfigService.instance) {
      TestConfigService.instance = new TestConfigService();
    }
    return TestConfigService.instance;
  }

  private loadConfig(): TestConfig {
    return {
      database: {
        host: process.env.TEST_DATABASE_HOST || 'localhost',
        port: parseInt(process.env.TEST_DATABASE_PORT || '5432'),
        username: process.env.TEST_DATABASE_USERNAME || 'postgres',
        password: process.env.TEST_DATABASE_PASSWORD || 'postgres',
        database: process.env.TEST_DATABASE_NAME || 'test_db',
      },
      rabbitmq: {
        host: process.env.TEST_RABBITMQ_HOST || 'localhost',
        port: parseInt(process.env.TEST_RABBITMQ_PORT || '5672'),
        username: process.env.TEST_RABBITMQ_USERNAME || 'guest',
        password: process.env.TEST_RABBITMQ_PASSWORD || 'guest',
        vhost: process.env.TEST_RABBITMQ_VHOST || '/',
      },
      app: {
        port: parseInt(process.env.TEST_APP_PORT || '3001'),
        host: process.env.TEST_APP_HOST || 'localhost',
      },
      playwright: {
        headless: process.env.TEST_PLAYWRIGHT_HEADLESS !== 'false',
        slowMo: parseInt(process.env.TEST_PLAYWRIGHT_SLOWMO || '0'),
        timeout: parseInt(process.env.TEST_PLAYWRIGHT_TIMEOUT || '30000'),
      },
    };
  }

  public getConfig(): TestConfig {
    return this.config;
  }

  public getDatabaseUrl(): string {
    const db = this.config.database;
    return `postgresql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`;
  }

  public getRabbitMQUrl(): string {
    const rmq = this.config.rabbitmq;
    return `amqp://${rmq.username}:${rmq.password}@${rmq.host}:${rmq.port}${rmq.vhost}`;
  }

  public getAppUrl(): string {
    const app = this.config.app;
    return `http://${app.host}:${app.port}`;
  }

  public isTestEnvironment(): boolean {
    return process.env.NODE_ENV === 'test';
  }

  public shouldUseTestDatabase(): boolean {
    return this.isTestEnvironment() || process.env.USE_TEST_DB === 'true';
  }

  public getTestTimeout(): number {
    return parseInt(process.env.TEST_TIMEOUT || '30000');
  }

  public getRetryAttempts(): number {
    return parseInt(process.env.TEST_RETRY_ATTEMPTS || '3');
  }

  public getRetryDelay(): number {
    return parseInt(process.env.TEST_RETRY_DELAY || '1000');
  }
}

export const testConfig = TestConfigService.getInstance();
