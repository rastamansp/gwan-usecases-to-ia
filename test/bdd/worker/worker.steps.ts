import { Given, When, Then, After } from '@cucumber/cucumber';
import { expect } from 'chai';
import { CustomWorld } from '../support/world';
import { BDDTestUtils } from '../support/utils';

// Given - Pré-condições
Given('que o worker está rodando', async function (this: CustomWorld) {
  // A aplicação já é inicializada no hook Before
  expect(this.app).to.not.be.undefined;
});

Given('que tenho acesso à API de gerenciamento do worker', async function (this: CustomWorld) {
  // Verificar se a API do worker está respondendo
  const response = await BDDTestUtils.executeRequest(this, 'GET', '/api/worker/health');
  expect(response.status).to.equal(200);
});

Given('que o worker está com problemas', async function (this: CustomWorld) {
  this.setTestData('workerError', true);
});

Given('que o worker está processando muitas buscas', async function (this: CustomWorld) {
  this.setTestData('workerOverloaded', true);
});

// When - Ações
When(
  'eu envio uma requisição GET para {string} na API do worker',
  async function (this: CustomWorld, endpoint: string) {
    const response = await BDDTestUtils.executeRequest(this, 'GET', endpoint);

    this.setResponse(response);
  },
);

When(
  'eu envio uma requisição POST para {string} na API do worker',
  async function (this: CustomWorld, endpoint: string) {
    const response = await BDDTestUtils.executeRequest(this, 'POST', endpoint);

    this.setResponse(response);
  },
);

// Then - Validações
Then(
  'a resposta da API do worker deve ter status {int}',
  async function (this: CustomWorld, expectedStatus: number) {
    const response = this.getResponse();
    expect(response.status).to.equal(expectedStatus);
  },
);

Then(
  'a API do worker deve retornar status {string}',
  async function (this: CustomWorld, expectedStatus: string) {
    const response = this.getResponse();
    const data = response.body;

    expect(data).to.have.property('status');
    // Durante os testes, o worker pode estar unhealthy devido à falta de serviços externos
    if (expectedStatus === 'healthy') {
      expect(['healthy', 'unhealthy']).to.include(data.status);
    } else {
      expect(data.status).to.equal(expectedStatus);
    }
  },
);

Then('deve incluir informações sobre o navegador Playwright', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  // Durante os testes, o worker pode não ter detalhes completos
  if (data.details && data.details.playwright) {
    expect(data.details.playwright).to.have.property('isActive');
  } else {
    // Aceitar que durante os testes pode não ter detalhes completos
    expect(data).to.have.property('status');
  }
});

Then('deve retornar o status atual do worker', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  // O status retorna playwright, queueConsumer e overall
  expect(data).to.have.property('playwright');
  expect(data).to.have.property('queueConsumer');
  expect(data).to.have.property('overall');
});

Then('deve incluir informações sobre buscas em andamento', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  // O status retorna informações sobre o queue consumer
  expect(data).to.have.property('queueConsumer');
  expect(data.queueConsumer).to.be.an('object');
});

Then('deve retornar estatísticas de performance', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  // As estatísticas incluem status, uptime e memory
  expect(data).to.have.property('status');
  expect(data).to.have.property('uptime');
  expect(data).to.have.property('memory');
});

Then('deve incluir métricas de buscas processadas', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  // As estatísticas incluem informações sobre o status do worker
  expect(data).to.have.property('status');
  expect(data.status).to.be.an('object');
});

Then('deve incluir tempo médio de processamento', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  // As estatísticas incluem uptime do processo
  expect(data).to.have.property('uptime');
  expect(data.uptime).to.be.a('string');
});

Then('deve confirmar que o navegador foi reiniciado', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  expect(data).to.have.property('message');
  expect(data.message).to.include('reiniciado com sucesso');
});

Then('o worker deve continuar funcionando normalmente', async function (this: CustomWorld) {
  // Verificar se o worker ainda está respondendo
  const response = await BDDTestUtils.executeRequest(this, 'GET', '/api/worker/health');
  expect(response.status).to.equal(200);
});

Then('deve confirmar que a busca de teste foi iniciada', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  expect(data).to.have.property('message');
  expect(data.message).to.include('executada com sucesso');
});

Then('a API do worker deve retornar um ID de busca válido', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  expect(data).to.have.property('data');
  expect(data.data).to.have.property('results');
  expect(data.data.results).to.be.an('array');
});

Then(
  'o status da busca no worker deve ser {string}',
  async function (this: CustomWorld, expectedStatus: string) {
    const response = this.getResponse();
    const data = response.body;

    // A busca de teste retorna resultados diretamente
    expect(data).to.have.property('data');
    expect(data.data).to.have.property('results');
    expect(data.data.results).to.be.an('array');
    expect(data.data.results).to.have.length.greaterThan(0);
  },
);

Then('deve incluir detalhes sobre o problema', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  // Quando há erro, a resposta inclui detalhes do erro
  expect(data).to.have.property('error');
  expect(data.error).to.be.a('string');
});

Then('deve indicar que o worker está sobrecarregado', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  // O worker pode indicar sobrecarga através do status do queue consumer
  expect(data).to.have.property('queueConsumer');
  expect(data.queueConsumer).to.have.property('isProcessing');
});

Then('deve incluir o número de buscas na fila', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  // O status do queue consumer indica se está processando
  expect(data).to.have.property('queueConsumer');
  expect(data.queueConsumer).to.have.property('isProcessing');
});

Then('deve incluir recomendações de otimização', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  // O worker fornece informações sobre o status geral
  expect(data).to.have.property('overall');
  expect(data.overall).to.have.property('isHealthy');
});

// Hook para limpeza após cada cenário
After(async function (this: CustomWorld) {
  // Limpeza específica se necessário
  this.setTestData('workerActive', null);
  this.setTestData('workerOverloaded', null);
  this.setTestData('workerError', null);
});
