import { World, setWorldConstructor } from '@cucumber/cucumber';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';

export class CustomWorld extends World {
  public moduleFixture?: TestingModule;
  public app?: INestApplication;
  public testData: Record<string, any> = {};
  public searchId?: string;
  public response?: any;

  async initializeApp(): Promise<void> {
    this.moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = this.moduleFixture.createNestApplication();

    // Configurar pipes de validação como na aplicação principal
    const { ValidationPipe } = require('@nestjs/common');
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Configurar prefixo global da API como na aplicação principal
    this.app.setGlobalPrefix('api');

    await this.app.init();
  }

  async cleanupApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  setTestData(key: string, value: any): void {
    if (!this.testData) {
      this.testData = {};
    }
    this.testData[key] = value;
  }

  getTestData(key: string): any {
    return this.testData?.[key];
  }

  setSearchId(id: string): void {
    this.searchId = id;
  }

  getSearchId(): string | undefined {
    return this.searchId;
  }

  setResponse(response: any): void {
    this.response = response;
  }

  getResponse(): any {
    return this.response;
  }
}

setWorldConstructor(CustomWorld);
