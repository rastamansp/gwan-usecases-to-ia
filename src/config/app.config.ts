import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfig {
  constructor(private readonly configService: ConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get appName(): string {
    return this.configService.get<string>('APP_NAME', 'Product Search Automation');
  }

  get databaseUrl(): string {
    const url = this.configService.get<string>('DATABASE_URL');
    if (!url) {
      throw new Error('DATABASE_URL não configurada');
    }
    return url;
  }

  get rabbitMqUrl(): string {
    const url = this.configService.get<string>('RABBITMQ_URL');
    if (!url) {
      throw new Error('RABBITMQ_URL não configurada');
    }
    return url;
  }

  get rabbitMqQueueSearchProduct(): string {
    return this.configService.get<string>('RABBITMQ_QUEUE_SEARCH_PRODUCT', 'search-product');
  }

  get playwrightBrowserPath(): string {
    return this.configService.get<string>('PLAYWRIGHT_BROWSER_PATH', '/usr/bin/chromium');
  }

  get playwrightHeadless(): boolean {
    return this.configService.get<boolean>('PLAYWRIGHT_HEADLESS', true);
  }

  get playwrightTimeout(): number {
    return this.configService.get<number>('PLAYWRIGHT_TIMEOUT', 30000);
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
