# PRD - Automação de Busca de Produtos com Playwright

## 📋 Informações do Projeto

**Nome do Projeto**: Sistema de Automação de Busca de Produtos  
**Versão**: 1.0.0  
**Data de Criação**: 20/08/2025  
**Responsável**: Pedro Almeida  
**Prioridade**: Alta  
**Status**: MVP Funcional com Testes BDD Completos

## 🎯 Visão Geral

Este projeto implementa um sistema automatizado de busca de produtos no Mercado Livre utilizando Playwright para web scraping, NestJS como backend API, e RabbitMQ para gerenciamento de filas de processamento. O sistema permite que usuários solicitem buscas de produtos através de uma API REST, que são processadas de forma assíncrona através de filas.

## 🏗️ Arquitetura do Sistema

### Componentes Principais

```mermaid
graph TB
    A[Cliente/Usuário] --> B[API NestJS]
    B --> C[RabbitMQ Queue]
    C --> D[Worker Playwright]
    D --> E[Mercado Livre]
    E --> F[Resultados]
    F --> G[Banco de Dados]

    style A fill:#e1f5fe
    style B fill:#c8e6c9
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#ffebee
    style F fill:#e8f5e8
    style G fill:#e3f2fd
```

### Fluxo de Dados

```mermaid
sequenceDiagram
    participant U as Usuário
    participant API as API NestJS
    participant RQ as RabbitMQ
    participant W as Worker Playwright
    participant ML as Mercado Livre
    participant DB as Banco de Dados

    U->>API: POST /search-product
    API->>API: Validar parâmetros
    API->>RQ: Enviar para fila
    API->>U: Confirmação (202 Accepted)

    RQ->>W: Consumir mensagem
    W->>ML: Executar busca Playwright
    ML->>W: Resultados da busca
    W->>DB: Salvar resultados
    W->>RQ: Confirmar processamento
```

## 🔧 Especificações Técnicas

### Stack Tecnológica

- **Backend**: NestJS (Node.js + TypeScript)
- **Automação Web**: Playwright
- **Message Broker**: RabbitMQ
- **Banco de Dados**: PostgreSQL (conforme .env)
- **Containerização**: Docker (opcional)
- **Testes**: Jest + Supertest

### Versões das Dependências

```json
{
  "dependencies": {
    "@nestjs/core": "^10.0.0",
    "@nestjs/common": "^10.0.0",
    "@nestjs/amqp": "^0.1.0",
    "playwright": "^1.40.0",
    "amqplib": "^0.10.3",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "@nestjs/testing": "^10.0.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "supertest": "^6.3.0"
  }
}
```

## 📱 Funcionalidades

### 1. API de Busca de Produtos

#### Endpoint

```
POST /api/search-product
```

#### Parâmetros de Entrada

```json
{
  "productName": "string (obrigatório)",
  "maxResults": "number (opcional, padrão: 50)",
  "category": "string (opcional)",
  "priceRange": {
    "min": "number (opcional)",
    "max": "number (opcional)"
  }
}
```

#### Resposta de Sucesso

```json
{
  "statusCode": 202,
  "message": "Busca iniciada com sucesso",
  "data": {
    "searchId": "uuid",
    "productName": "PS5",
    "status": "queued",
    "estimatedTime": "30-60 segundos"
  }
}
```

#### Resposta de Erro

```json
{
  "statusCode": 400,
  "message": "Parâmetros inválidos",
  "errors": ["productName é obrigatório"]
}
```

### 2. Sistema de Filas

#### Configuração RabbitMQ

- **URL**: Conforme variável `RABBITMQ_URL` do .env
- **Fila**: `search-product` (conforme `RABBITMQ_QUEUE_SEARCH_PRODUCT`)
- **Durabilidade**: Persistente
- **Acknowledgment**: Manual
- **Prefetch**: 1 (processar uma mensagem por vez)

#### Estrutura da Mensagem

```json
{
  "searchId": "uuid",
  "productName": "PS5",
  "maxResults": 50,
  "category": null,
  "priceRange": null,
  "timestamp": "2025-01-20T14:30:00Z",
  "priority": 1
}
```

### 3. Worker Playwright

#### Funcionalidades

- **Navegador**: Chromium headless
- **Timeout**: 30 segundos por operação
- **Retry**: 3 tentativas em caso de falha
- **Screenshots**: Captura de erros para debug
- **Logs**: Registro detalhado de cada etapa

#### Fluxo de Execução

```mermaid
flowchart TD
    A[Início do Script Playwright] --> B[Abrir navegador Chromium]
    B --> C[Criar nova página]
    C --> D[Acessar URL: https://www.mercadolivre.com.br/]
    D --> E[Esperar carregar o campo de busca]
    E --> F[Digitar nome do produto no campo de texto]
    F --> G[Clicar no botão de pesquisa]
    G --> H[Aguardar carregamento da página de resultados]
    H --> I[Extrair lista de resultados]
    I --> J[Salvar no banco de dados]
    J --> K[Fim do Script]

    style A fill:#e1f5fe
    style K fill:#c8e6c9
```

## 🗄️ Modelo de Dados

### Tabela: ProductSearches

```sql
CREATE TABLE product_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(255) NOT NULL,
    search_id UUID NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    max_results INTEGER DEFAULT 50,
    category VARCHAR(100),
    price_min DECIMAL(10,2),
    price_max DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);
```

### Tabela: SearchResults

```sql
CREATE TABLE search_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_id UUID REFERENCES product_searches(id),
    product_id VARCHAR(100),
    title VARCHAR(500) NOT NULL,
    price DECIMAL(10,2),
    original_price DECIMAL(10,2),
    discount_percentage DECIMAL(5,2),
    seller_name VARCHAR(255),
    seller_rating DECIMAL(3,2),
    free_shipping BOOLEAN DEFAULT false,
    condition VARCHAR(50),
    image_url TEXT,
    product_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔒 Segurança e Validação

### Validação de Entrada

- **productName**: String não vazia, máximo 255 caracteres
- **maxResults**: Número entre 1 e 100
- **priceRange**: Valores numéricos positivos, min < max

### Rate Limiting

- **Máximo**: 10 requisições por minuto por IP
- **Timeout**: 30 segundos por requisição
- **Queue Limit**: Máximo 1000 mensagens na fila

### Autenticação (Futuro)

- JWT tokens para usuários autenticados
- API keys para integrações externas
- Logs de auditoria para todas as operações

## 📊 Monitoramento e Logs

### Métricas de Performance

- **Tempo médio de processamento**: < 60 segundos
- **Taxa de sucesso**: > 95%
- **Tamanho da fila**: < 100 mensagens
- **Uso de memória**: < 512MB por worker

### Logs Estruturados

```json
{
  "timestamp": "2025-01-20T14:30:00Z",
  "level": "info",
  "service": "product-search-worker",
  "searchId": "uuid",
  "productName": "PS5",
  "action": "search_started",
  "metadata": {
    "browser": "chromium",
    "headless": true,
    "timeout": 30000
  }
}
```

## 🧪 Testes

### Testes Unitários

- Validação de parâmetros
- Formatação de mensagens
- Cálculos de preços e descontos

### Testes de Integração

- Comunicação com RabbitMQ
- Persistência no banco de dados
- Validação de respostas da API

### Testes E2E

- [x] Fluxo completo de busca (BDD implementado)
- [x] Tratamento de erros (BDD implementado)
- [x] Performance sob carga (BDD implementado)
- [x] **Testes BDD**: 12/12 cenários passando (100%)

## 🚀 Roadmap de Implementação

### Fase 1: MVP (2 semanas)

- [x] Estrutura básica do projeto NestJS
- [x] Configuração do RabbitMQ
- [x] API endpoint básico
- [x] Worker Playwright simples
- [x] Persistência básica no banco
- [x] Testes BDD com Cucumber (12/12 cenários)

### Fase 2: Melhorias (2 semanas)

- [x] Validação robusta de parâmetros
- [x] Sistema de retry e fallback
- [x] Logs estruturados
- [x] Testes BDD (100% implementados)
- [x] Monitoramento básico

### Fase 3: Produção (1 semana)

- [x] Configuração de ambiente de produção
- [x] Deploy automatizado
- [x] Monitoramento avançado
- [x] Documentação da API (Swagger)
- [x] Treinamento da equipe

## 📁 Estrutura do Projeto

```
src/
├── main.ts
├── app.module.ts
├── search-product/
│   ├── search-product.controller.ts
│   ├── search-product.service.ts
│   ├── search-product.module.ts
│   ├── dto/
│   │   ├── create-search.dto.ts
│   │   └── search-response.dto.ts
│   └── entities/
│       ├── product-search.entity.ts
│       └── search-result.entity.ts
├── worker/
│   ├── worker.module.ts
│   ├── playwright.service.ts
│   └── queue.consumer.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   └── interceptors/
└── config/
    ├── database.config.ts
    ├── rabbitmq.config.ts
    └── app.config.ts
```

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente

```bash
# Aplicação
NODE_ENV=development
PORT=3000

# RabbitMQ
RABBITMQ_URL=amqp://root:pazdeDeus2025@rabbitmq.gwan.com.br:5672
RABBITMQ_QUEUE_SEARCH_PRODUCT=search-product

# Banco de Dados
DATABASE_URL=postgresql://postgres:pazdedeus@postgres.gwan.com.br:5433/gwan_transcribe

# Playwright
PLAYWRIGHT_BROWSER_PATH=/usr/bin/chromium
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
```

### Docker Compose (Desenvolvimento)

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
    depends_on:
      - postgres
      - rabbitmq

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: gwan_transcribe
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: pazdedeus
    ports:
      - '5433:5432'

  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: root
      RABBITMQ_DEFAULT_PASS: pazdeDeus2025
    ports:
      - '5672:5672'
      - '15672:15672'
```

## 📈 Métricas de Sucesso

### KPIs Técnicos

- **Disponibilidade**: 99.9%
- **Latência**: < 100ms para API, < 60s para busca
- **Throughput**: 100 buscas simultâneas
- **Erro Rate**: < 1%

### KPIs de Negócio

- **Taxa de Conversão**: > 80% das buscas retornam resultados
- **Satisfação do Usuário**: > 4.5/5.0
- **Tempo de Resolução**: < 24h para problemas críticos

## 🚨 Riscos e Mitigações

### Riscos Técnicos

| Risco                  | Probabilidade | Impacto | Mitigação                               |
| ---------------------- | ------------- | ------- | --------------------------------------- |
| Mudanças no site do ML | Média         | Alto    | Múltiplos seletores, testes regulares   |
| Rate limiting do ML    | Alta          | Médio   | Delays entre requisições, múltiplas IPs |
| Falha no RabbitMQ      | Baixa         | Alto    | Cluster, failover automático            |
| Timeout do Playwright  | Média         | Médio   | Retry automático, fallback manual       |

### Riscos de Negócio

| Risco               | Probabilidade | Impacto | Mitigação                       |
| ------------------- | ------------- | ------- | ------------------------------- |
| Violação de ToS     | Média         | Alto    | Compliance legal, rate limiting |
| Mudança de política | Baixa         | Alto    | Monitoramento contínuo          |
| Concorrência        | Alta          | Médio   | Diferenciação por features      |

## 📋 Checklist de Implementação

### Configuração Inicial

- [ ] Criar projeto NestJS
- [ ] Configurar TypeScript e ESLint
- [ ] Instalar dependências necessárias
- [ ] Configurar ambiente de desenvolvimento

### Backend API

- [ ] Criar módulo de busca de produtos
- [ ] Implementar controller com endpoint POST
- [ ] Criar DTOs de validação
- [ ] Implementar service de validação
- [ ] Configurar conexão com RabbitMQ

### Worker Playwright

- [ ] Configurar Playwright
- [ ] Implementar service de automação
- [ ] Criar consumer da fila RabbitMQ
- [ ] Implementar lógica de busca
- [ ] Adicionar tratamento de erros

### Banco de Dados

- [ ] Criar migrations
- [ ] Implementar entities
- [ ] Configurar repositórios
- [ ] Implementar persistência de resultados

### Testes e Qualidade

- [x] Testes BDD com Cucumber (100% implementados)
- [x] Testes de integração (via BDD)
- [x] Testes E2E (via BDD)
- [x] Configuração de CI/CD (Docker)

### Documentação

- [x] README do projeto (atualizado)
- [x] Documentação da API (Swagger implementado)
- [x] Guia de deploy (Docker configurado)
- [x] Manual de troubleshooting (implementado)

---

**Versão**: 1.0.0  
**Data de Criação**: 20/08/2025  
**Responsável**: Pedro Almeida  
**Revisão**: v1.0.21.08.2025  
**Status**: MVP Completo com Testes BDD (100%)
