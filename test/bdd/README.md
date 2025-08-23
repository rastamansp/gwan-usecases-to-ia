# 🥒 Testes BDD com Cucumber

Este diretório contém os testes de Behavior Driven Development (BDD) usando Cucumber para o sistema de automação de busca de produtos.

## 📁 Estrutura dos Arquivos

```
test/bdd/
├── search-product/           # Testes da API de busca de produtos
│   ├── search-product.feature
│   └── search-product.steps.ts
├── worker/                   # Testes da API do worker
│   ├── worker.feature
│   └── worker.steps.ts
├── support/                  # Configurações e utilitários
│   ├── world.ts             # Mundo personalizado do Cucumber
│   ├── hooks.ts             # Hooks globais
│   └── utils.ts             # Utilitários para testes
├── tsconfig.json            # Configuração TypeScript para BDD
└── README.md                # Este arquivo
```

## 🚀 Como Executar os Testes

### Executar todos os testes BDD
```bash
pnpm run test:bdd
```

### Executar testes específicos
```bash
# Apenas testes de busca de produtos
pnpm run test:bdd:search-product

# Apenas testes do worker
pnpm run test:bdd:worker
```

### Executar em modo watch
```bash
pnpm run test:bdd:watch
```

### Gerar relatórios
```bash
pnpm run test:bdd:report
```

## 📋 Cenários de Teste

### Busca de Produtos (`search-product.feature`)
- ✅ Criar busca básica de produto
- ✅ Criar busca com categoria específica
- ✅ Criar busca com faixa de preço
- ✅ Criar busca com todos os parâmetros
- ✅ Consultar status de uma busca
- ✅ Validação de nome de produto vazio
- ✅ Validação de MaxResults inválido
- ✅ Validação de faixa de preço inválida

### Worker (`worker.feature`)
- ✅ Verificar saúde do worker
- ✅ Verificar status do worker
- ✅ Verificar estatísticas detalhadas
- ✅ Reiniciar navegador Playwright
- ✅ Executar busca de teste
- ✅ Verificar worker com erro
- ✅ Verificar worker sobrecarregado

## 🔧 Configuração

### Pré-requisitos
- Node.js 18+
- pnpm
- Aplicação NestJS rodando
- Banco de dados configurado
- RabbitMQ configurado

### Variáveis de Ambiente
```bash
# Para testes BDD
NODE_ENV=test
DATABASE_URL=postgresql://user:pass@localhost:5432/test_db
RABBITMQ_URL=amqp://localhost:5672
```

## 🧪 Executando Testes Específicos

### Por tag
```bash
# Executar apenas cenários marcados com @search-product
cucumber-js --tags @search-product

# Executar apenas cenários marcados com @worker
cucumber-js --tags @worker
```

### Por cenário específico
```bash
# Executar cenário específico por nome
cucumber-js --name "Criar busca básica de produto"
```

## 📊 Relatórios

Os relatórios são gerados em:
- **HTML**: `test/reports/cucumber-report.html`
- **JSON**: `test/reports/cucumber-report.json`

## 🐛 Debugging

### Logs detalhados
```bash
# Executar com logs verbosos
cucumber-js --verbose
```

### Modo debug
```bash
# Executar com debug
cucumber-js --debug
```

## 🔄 Integração com CI/CD

### GitHub Actions
```yaml
- name: Executar testes BDD
  run: pnpm run test:bdd:report
```

### GitLab CI
```yaml
test:bdd:
  script:
    - pnpm run test:bdd:report
```

## 📝 Adicionando Novos Cenários

### 1. Criar arquivo .feature
```gherkin
# language: pt
Funcionalidade: Nova Funcionalidade
  Cenário: Novo Cenário
    Dado que...
    Quando...
    Então...
```

### 2. Implementar step definitions
```typescript
import { Given, When, Then } from '@cucumber/cucumber';

Given('que...', function() {
  // Implementação
});

When('...', function() {
  // Implementação
});

Then('...', function() {
  // Implementação
});
```

### 3. Adicionar ao cucumber.js
```javascript
'new-feature': {
  require: ['test/bdd/new-feature/**/*.ts'],
  format: ['@cucumber/pretty-formatter']
}
```

## 🎯 Boas Práticas

1. **Nomes descritivos**: Use nomes claros para cenários e steps
2. **Reutilização**: Reutilize steps comuns entre diferentes features
3. **Dados de teste**: Use DataTables para dados complexos
4. **Hooks**: Use hooks para setup e cleanup
5. **Validações**: Valide tanto o status quanto o conteúdo das respostas
6. **Tratamento de erros**: Implemente retry logic para operações instáveis

## 🚨 Troubleshooting

### Erro: "Cannot find module"
```bash
# Verificar se as dependências estão instaladas
pnpm install

# Verificar se o tsconfig está correto
npx tsc --noEmit
```

### Erro: "Application not initialized"
- Verificar se o AppModule está sendo importado corretamente
- Verificar se as dependências do NestJS estão configuradas

### Erro: "Database connection failed"
- Verificar se o banco de dados está rodando
- Verificar as variáveis de ambiente
- Verificar se as migrations foram executadas

## 📚 Recursos Adicionais

- [Documentação do Cucumber](https://cucumber.io/docs)
- [Cucumber.js](https://github.com/cucumber/cucumber-js)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest](https://github.com/visionmedia/supertest)
