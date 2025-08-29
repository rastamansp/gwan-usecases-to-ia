import { BeforeAll, Before, After, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { CustomWorld } from './world';

// Timeout global para todos os testes
setDefaultTimeout(30000);

BeforeAll(function () {
  console.log('🚀 Iniciando ambiente de teste BDD...');
});

Before(async function (this: CustomWorld) {
  // Inicializar aplicação para cada cenário
  await this.initializeApp();

  // Limpar dados de teste
  this.setTestData('searchId', undefined);
  this.setTestData('response', undefined);
});

After(async function (this: CustomWorld) {
  // Limpar aplicação após cada cenário
  await this.cleanupApp();

  // Limpar dados de teste
  this.setTestData('searchId', undefined);
  this.setTestData('response', undefined);
});

AfterAll(function () {
  console.log('🧹 Limpeza final do ambiente de teste...');
});

// Hooks específicos para features de busca de produtos
Before('@search-product', async function (this: CustomWorld) {
  this.setTestData('testProduct', {
    productName: 'PS5',
    maxResults: 10,
    category: 'Gaming',
    priceRange: { min: 1000, max: 5000 },
  });
});

// Hooks específicos para features do worker
Before('@worker', async function (this: CustomWorld) {
  this.setTestData('workerConfig', {
    timeout: 30000,
    retries: 3,
  });
});
