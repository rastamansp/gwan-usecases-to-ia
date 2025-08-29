import { Given, When, Then, After } from '@cucumber/cucumber';
import { expect } from 'chai';
import { CustomWorld } from '../support/world';
import { BDDTestUtils } from '../support/utils';

// Given - Pré-condições
Given('que o sistema de busca está funcionando', async function (this: CustomWorld) {
  // A aplicação já é inicializada no hook Before
  expect(this.app).to.not.be.undefined;
});

Given('que tenho acesso à API de busca de produtos', async function (this: CustomWorld) {
  // Verificar se a API está respondendo
  const response = await BDDTestUtils.executeRequest(this, 'GET', '/api');
  expect(response.status).to.equal(200);
});

Given('que existe uma busca com ID {string}', async function (this: CustomWorld, searchId: string) {
  this.setSearchId(searchId);
});

// When - Ações
When(
  'eu envio uma requisição POST para {string} na API de busca',
  async function (this: CustomWorld, endpoint: string) {
    const testData = this.getTestData('currentProduct') || {};

    const response = await BDDTestUtils.executeRequest(this, 'POST', endpoint, testData);

    this.setResponse(response);
  },
);

When(
  'eu envio uma requisição GET para {string} na API de busca',
  async function (this: CustomWorld, endpoint: string) {
    const response = await BDDTestUtils.executeRequest(this, 'GET', endpoint);

    this.setResponse(response);
  },
);

When('o corpo da requisição contém:', async function (this: CustomWorld, docString: string) {
  try {
    const data = JSON.parse(docString);
    this.setTestData('currentProduct', data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Erro ao parsear JSON: ${errorMessage}`);
  }
});

// Then - Validações
Then(
  'a resposta da API de busca deve ter status {int}',
  async function (this: CustomWorld, expectedStatus: number) {
    const response = this.getResponse();
    expect(response.status).to.equal(expectedStatus);
  },
);

Then('a API de busca deve retornar um ID de busca válido', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  expect(data).to.have.property('data');
  expect(data.data).to.have.property('searchId');
  expect(data.data.searchId).to.be.a('string');
  expect(data.data.searchId).to.have.length.greaterThan(0);

  this.setSearchId(data.data.searchId);
});

Then(
  'o status da busca na API deve ser {string}',
  async function (this: CustomWorld, expectedStatus: string) {
    const response = this.getResponse();
    const data = response.body;

    expect(data).to.have.property('data');
    expect(data.data).to.have.property('status');
    expect(data.data.status).to.equal(expectedStatus);
  },
);

Then('deve retornar os detalhes da busca', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  expect(data).to.have.property('data');
  expect(data.data).to.have.property('searchId');
  expect(data.data).to.have.property('productName');
  expect(data.data).to.have.property('status');
  expect(data.data).to.have.property('createdAt');
});

Then('deve incluir o status atual da busca', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  expect(data).to.have.property('data');
  expect(data.data).to.have.property('status');
  expect(data.data.status).to.be.oneOf(['queued', 'processing', 'completed', 'failed']);
});

Then('deve retornar uma mensagem de erro de validação', async function (this: CustomWorld) {
  const response = this.getResponse();
  const data = response.body;

  expect(data).to.have.property('message');
  // O ValidationPipe pode retornar array ou string, vamos aceitar ambos
  if (Array.isArray(data.message)) {
    expect(data.message).to.be.an('array');
    expect(data.message).to.have.length.greaterThan(0);
    expect(data.message[0]).to.be.a('string');
  } else {
    expect(data.message).to.be.a('string');
    expect(data.message).to.have.length.greaterThan(0);
  }
});

// Hook para limpeza após cada cenário
After(async function (this: CustomWorld) {
  // Limpeza específica se necessário
  this.setSearchId('');
});
