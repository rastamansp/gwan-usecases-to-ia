import { CustomWorld } from './world';
import axios, { AxiosResponse } from 'axios';

export class BDDTestUtils {
  /**
   * Executa uma requisição HTTP para a aplicação
   */
  static async executeRequest(
    world: CustomWorld,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<AxiosResponse> {
    if (!world.app) {
      throw new Error('Aplicação não inicializada');
    }

    // Usar a aplicação em teste ao invés de fazer requisições HTTP externas
    // Isso resolve problemas de configuração e contexto
    const request = require('supertest');

    try {
      let testRequest = request(world.app.getHttpServer())[method.toLowerCase()](endpoint);

      // Configurar headers
      testRequest = testRequest.set('Content-Type', 'application/json');
      if (headers) {
        Object.keys(headers).forEach(key => {
          testRequest = testRequest.set(key, headers[key]);
        });
      }

      // Enviar dados se for POST/PUT/PATCH
      if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
        testRequest = testRequest.send(data);
      } else if (data && method === 'GET') {
        testRequest = testRequest.query(data);
      }

      const response = await testRequest;

      // Converter para formato esperado
      const mockResponse = {
        status: response.status,
        body: response.body,
        headers: response.headers,
      };

      return mockResponse as any;
    } catch (error: any) {
      // Para supertest, o erro já contém a resposta
      if (error.status) {
        const mockResponse = {
          status: error.status,
          body: error.response?.body || error.body,
          headers: error.response?.headers || {},
        };
        return mockResponse as any;
      }
      throw error;
    }
  }

  /**
   * Valida se uma resposta HTTP tem o status esperado
   */
  static validateResponseStatus(response: any, expectedStatus: number): void {
    if (response.status !== expectedStatus) {
      throw new Error(
        `Status esperado: ${expectedStatus}, recebido: ${response.status}. Resposta: ${JSON.stringify(response.body)}`,
      );
    }
  }

  /**
   * Valida se uma resposta HTTP contém propriedades obrigatórias
   */
  static validateResponseProperties(response: any, requiredProperties: string[]): void {
    const body = response.body;

    requiredProperties.forEach(prop => {
      if (!body.hasOwnProperty(prop)) {
        throw new Error(`Propriedade obrigatória '${prop}' não encontrada na resposta`);
      }
    });
  }

  /**
   * Gera dados de teste para diferentes cenários
   */
  static generateTestData(scenario: string): any {
    const testData: Record<string, any> = {
      basic: {
        productName: 'PS5',
        maxResults: 50,
      },
      withCategory: {
        productName: 'Xbox Series X',
        maxResults: 30,
        category: 'Games e Consoles',
      },
      withPriceRange: {
        productName: 'Nintendo Switch',
        maxResults: 25,
        priceRange: {
          min: 1000,
          max: 3000,
        },
      },
      complete: {
        productName: 'Smartphone Samsung',
        maxResults: 100,
        category: 'Eletrônicos',
        priceRange: {
          min: 500,
          max: 5000,
        },
      },
      invalid: {
        productName: '',
        maxResults: 150,
        priceRange: {
          min: 5000,
          max: 1000,
        },
      },
    };

    return testData[scenario] || testData.basic;
  }

  /**
   * Aguarda um tempo específico (útil para operações assíncronas)
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Valida se um ID é um UUID válido
   */
  static isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}
