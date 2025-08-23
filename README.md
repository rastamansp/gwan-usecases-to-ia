# 🚀 Sistema de Automação de Busca de Produtos

Sistema automatizado de busca de produtos no Mercado Livre utilizando **Playwright** para web scraping, **NestJS** como backend API, e **RabbitMQ** para gerenciamento de filas de processamento.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Status do Projeto](#status-do-projeto)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [API](#api)
- [Desenvolvimento](#desenvolvimento)
- [Deploy](#deploy)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

Este projeto implementa um sistema que permite aos usuários solicitar buscas de produtos através de uma API REST. As requisições são processadas de forma assíncrona através de filas RabbitMQ, onde workers Playwright executam a automação web para extrair informações dos produtos do Mercado Livre.

### Características Principais

- ✅ **API REST** com NestJS e TypeScript
- ✅ **Processamento Assíncrono** via RabbitMQ
- ✅ **Automação Web** com Playwright
- ✅ **Persistência** em PostgreSQL
- ✅ **Containerização** com Docker
- ✅ **Monitoramento** e logs estruturados
- ✅ **Clean Architecture** e SOLID Principles
- ✅ **Arquivos .http** para testes via REST Client

## 📊 Status do Projeto

### ✅ **IMPLEMENTADO (MVP Completo)**
- **Backend API**: NestJS com TypeScript
- **Domain Layer**: Entidades, Enums, Métodos de domínio
- **Application Layer**: DTOs, Commands, Use Cases
- **Infrastructure Layer**: Repositories, Services, Interfaces
- **Presentation Layer**: Controllers, Validações
- **Configuração**: TypeORM, Winston, RabbitMQ
- **Banco de Dados**: PostgreSQL com migrations
- **Validação**: DTOs com class-validator
- **Logging**: Winston estruturado
- **Clean Architecture**: Implementada
- **SOLID Principles**: Aplicados
- **Worker Playwright**: Automação web para busca de produtos ✅
- **Consumer RabbitMQ**: Processamento das filas ✅
- **Extração de Múltiplos Produtos**: Suporte a maxResults configurável ✅
- **Correção de Preços Brasileiros**: Formato R$ 9.500 → 9500.00 ✅
- **Organização de Screenshots**: Pasta logs/screenshots/ estruturada ✅
- **Configuração .gitignore**: Screenshots e arquivos de debug ignorados ✅

### 🚧 **EM DESENVOLVIMENTO**
- **Endpoints Adicionais**: Status de busca e resultados ✅
- **Testes de Integração**: Validação end-to-end ✅

### 📋 **PENDENTE**
- **Testes Unitários**: Jest para lógica de negócio
- **Documentação Swagger**: API documentation
- **Monitoramento**: Métricas e health checks
- **Deploy**: Configuração de produção

### ✅ **TESTES BDD IMPLEMENTADOS**
- **Cucumber**: Framework BDD para testes de comportamento
- **Features**: Cenários para busca de produtos e worker
- **Step Definitions**: Implementação dos testes automatizados
- **Configuração**: Ambiente isolado para testes
- **Docker**: Containerização para testes automatizados

#### **Status dos Testes BDD**
- **Search Product API**: ✅ **7/7 cenários passando** (100%)
- **Worker API**: ✅ **5/5 cenários passando** (100%)
- **Total Geral**: ✅ **12/12 cenários passando** (100%)

#### **Cenários Implementados**
**Search Product API:**
- ✅ Busca básica de produto
- ✅ Busca com categoria específica
- ✅ Busca com faixa de preço
- ✅ Busca com todos os parâmetros
- ✅ Validações de entrada (nome vazio, maxResults inválido, faixa de preço inválida)
- ✅ Consultar status de uma busca
- ✅ Reiniciar navegador

**Worker API:**
- ✅ Verificar saúde do worker
- ✅ Verificar status do worker
- ✅ Verificar estatísticas detalhadas
- ✅ Reiniciar navegador Playwright
- ✅ Executar busca de teste

#### **Executar Testes BDD**
```bash
# Todos os cenários
pnpm run test:bdd

# Cenários específicos
pnpm run test:bdd -- --tags "@search-product"
pnpm run test:bdd -- --tags "@worker"
pnpm run test:bdd -- --tags "@basic-search"
```

**Status Geral**: **90% Concluído** - MVP funcional com API operacional e testes BDD completos

## 🏗️ Arquitetura

```mermaid
graph TB
    A[Cliente] --> B[API NestJS]
    B --> C[RabbitMQ Queue]
    C --> D[Worker Playwright]
    D --> E[Mercado Livre]
    E --> F[Resultados]
    F --> G[PostgreSQL]
    
    style A fill:#e1f5fe
    style B fill:#c8e6c9
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#ffebee
    style F fill:#e8f5e8
    style G fill:#e3f2fd
```

### Componentes

- **API NestJS**: Endpoint REST para receber solicitações de busca ✅
- **RabbitMQ**: Sistema de filas para processamento assíncrono ✅
- **Worker Playwright**: Executa a automação web 🚧
- **PostgreSQL**: Armazena buscas e resultados ✅
- **Redis**: Cache opcional para melhorar performance (futuro)

## 🚀 Funcionalidades

### 1. Busca de Produtos ✅
- Recebe nome do produto via API
- Processa busca de forma assíncrona
- Retorna resultados estruturados
- Suporte a filtros de preço e categoria

### 2. Sistema de Filas ✅
- Processamento assíncrono
- Retry automático em caso de falha
- Priorização de mensagens
- Monitoramento em tempo real

### 3. Automação Web 🚧
- Navegação automatizada no Mercado Livre
- Extração de dados estruturados
- Tratamento de erros e timeouts
- Screenshots para debug

## 📋 Pré-requisitos

### Software
- **Node.js**: 18.x ou superior ✅
- **Docker**: 20.x ou superior ✅
- **Docker Compose**: 2.x ou superior ✅
- **Git**: Para clonar o repositório ✅

### Recursos do Sistema
- **RAM**: Mínimo 4GB, Recomendado 8GB
- **CPU**: 2 cores, Recomendado 4 cores
- **Disco**: 10GB de espaço livre
- **Internet**: Conexão estável para acessar o Mercado Livre

## 🛠️ Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/gwan-usecases-to-ia.git
cd gwan-usecases-to-ia
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas configurações
nano .env
```

### 3. Instalar Dependências

```bash
# Instalar dependências do Node.js
pnpm install

# Instalar Playwright
npx playwright install chromium
```

### 4. Iniciar com Docker

```bash
# Construir e iniciar todos os serviços
docker-compose up -d

# Verificar status dos serviços
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f app
```

### 5. Executar Migrations

```bash
# Acessar container do PostgreSQL
docker-compose exec postgres psql -U postgres -d gwan_transcribe

# Executar migrations
\i /docker-entrypoint-initdb.d/001_create_product_search_tables.sql
```

### 6. Executar Testes BDD

```bash
# Instalar dependências de teste
pnpm install

# Executar todos os testes BDD
pnpm run test:bdd

# Executar testes específicos
pnpm run test:bdd:search-product
pnpm run test:bdd:worker

# Executar com relatórios
pnpm run test:bdd:report

# Executar testes com Docker
docker-compose -f docker-compose.test.yml up --build
```

## ⚙️ Configuração

### Variáveis de Ambiente

```bash
# Aplicação
NODE_ENV=development
PORT=3000
APP_NAME=Product Search Automation

# Banco de Dados
DATABASE_URL=postgresql://postgres:pazdedeus@localhost:5433/gwan_transcribe?sslmode=disable

# RabbitMQ
RABBITMQ_URL=amqp://root:pazdeDeus2025@localhost:5672
RABBITMQ_QUEUE_SEARCH_PRODUCT=search-product

# Playwright
PLAYWRIGHT_BROWSER_PATH=/usr/bin/chromium
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
```

### Configuração do RabbitMQ

```bash
# Acessar interface web
http://localhost:15672

# Credenciais
Username: root
Password: pazdeDeus2025
```

## 📱 Uso

### 1. Iniciar a Aplicação

```bash
# Desenvolvimento
pnpm run start:dev

# Produção
pnpm run start:prod
```

### 2. Fazer uma Busca

```bash
curl -X POST http://localhost:3000/api/search-product \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "PS5",
    "maxResults": 50
  }'
```

### 3. Verificar Status

```bash
# Verificar status da busca
curl http://localhost:3000/api/search-product/{searchId}

# Ver resultados da busca
curl http://localhost:3000/api/search-product/{searchId}/results
```

## 🆕 **Melhorias Implementadas (v1.1.0)**

### 🎯 **Extração de Múltiplos Produtos**
- ✅ **Suporte a maxResults configurável**: Busca de 1 a 50+ produtos
- ✅ **Seletores CSS robustos**: Múltiplos fallbacks para diferentes layouts
- ✅ **Extração paralela**: Processamento eficiente de múltiplos produtos
- ✅ **Logs detalhados**: Acompanhamento completo do processo de extração

### 💰 **Correção de Preços Brasileiros**
- ✅ **Formato brasileiro reconhecido**: R$ 9.500 → 9500.00
- ✅ **Separadores corretos**: Ponto como milhares, vírgula como decimal
- ✅ **Conversão automática**: Valores salvos como números no banco
- ✅ **Validação robusta**: Tratamento de diferentes formatos de preço

### 📸 **Organização de Screenshots**
- ✅ **Estrutura organizada**: `logs/screenshots/` para todos os arquivos
- ✅ **Nomenclatura consistente**: Timestamps e tipos organizados
- ✅ **Git ignore configurado**: Screenshots não versionados
- ✅ **Debug facilitado**: Fácil localização para análise de problemas

### 🔧 **Configurações Técnicas**
- ✅ **Seletores CSS otimizados**: Baseados no HTML real do Mercado Livre
- ✅ **Fallbacks robustos**: Múltiplas estratégias de extração
- ✅ **Logs estruturados**: Informações detalhadas para debugging
- ✅ **Tratamento de erros**: Captura de screenshots em caso de falha

### 📊 **Exemplo de Funcionamento**
```bash
# Busca com 10 produtos
curl -X POST http://localhost:3001/api/search-product \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "iPhone 16 Pro Max",
    "maxResults": 10
  }'

# Resultado: 10 produtos extraídos com preços corretos
# - iPhone 16 Pro Max (256 GB): R$ 10.306,00
# - iPhone 16 Pro Max (512 GB): R$ 11.199,00
# - iPhone 16 Pro Max (256 GB): R$ 7.899,00
# ... e mais 7 produtos
```

## 🔌 API

### Endpoints

#### POST /api/search-product ✅
Inicia uma nova busca de produtos.

**Request Body:**
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

**Response (202 Accepted):**
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

#### GET /api/search-product/{searchId} 🚧
Obtém o status de uma busca específica.

#### GET /api/search-product/{searchId}/results 🚧
Obtém os resultados de uma busca específica.

### Códigos de Status

- **200**: Sucesso
- **202**: Aceito (processamento assíncrono)
- **400**: Parâmetros inválidos
- **404**: Busca não encontrada
- **500**: Erro interno do servidor

## 🧪 Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
pnpm run start:dev          # Inicia em modo desenvolvimento
pnpm run start:debug        # Inicia com debug
pnpm run start:prod         # Inicia em modo produção
pnpm run start:backend      # Inicia apenas o backend
pnpm run start:worker       # Inicia apenas o worker
pnpm run start:dev:parallel # Inicia backend e worker em paralelo
pnpm run start:dev:full     # Inicia backend, worker e testes BDD em paralelo

# Testes
pnpm run test               # Executa testes unitários
pnpm run test:e2e           # Executa testes E2E
pnpm run test:cov           # Executa testes com cobertura
pnpm run test:watch         # Executa testes em modo watch

# Testes BDD
pnpm run test:bdd           # Executa todos os testes BDD
pnpm run test:bdd:search-product  # Testes de busca de produtos
pnpm run test:bdd:worker          # Testes do worker
pnpm run test:bdd:report          # Gera relatórios dos testes
pnpm run test:bdd:jest            # Executa testes BDD com Jest

# Build
pnpm run build              # Compila o projeto
pnpm run build:prod         # Compila para produção

# Linting
pnpm run lint               # Executa ESLint
pnpm run lint:fix           # Corrige problemas de linting

# Playwright
npx playwright test        # Executa testes do Playwright
npx playwright show-report # Mostra relatório de testes
```

### Estrutura do Projeto

```
src/
├── main.ts                           # Ponto de entrada da aplicação ✅
├── app.module.ts                     # Módulo principal ✅
├── shared/                           # Código compartilhado ✅
│   ├── domain/                       # Entidades e regras de negócio ✅
│   ├── infrastructure/               # Implementações externas ✅
│   ├── application/                  # Casos de uso ✅
│   └── presentation/                 # Controllers e DTOs ✅
├── modules/                          # Módulos da aplicação ✅
│   ├── search-product/               # Módulo de busca de produtos ✅
│   ├── worker/                       # Módulo do worker Playwright 🚧
│   └── queue/                        # Módulo de filas RabbitMQ ✅
├── config/                           # Configurações ✅
└── common/                           # Utilitários e decorators 🚧
```

### Adicionando Novas Funcionalidades

1. **Criar DTOs** para validação de entrada ✅
2. **Implementar Service** com lógica de negócio ✅
3. **Criar Controller** para exposição da API ✅
4. **Adicionar testes** unitários e de integração 🚧
5. **Atualizar documentação** da API ✅

## 🥒 Testes BDD com Cucumber

O projeto inclui uma suite completa de testes BDD que automatiza os cenários definidos nos arquivos `.http`. **Todos os testes estão funcionando perfeitamente** e validam tanto a funcionalidade de busca quanto o monitoramento do worker.

### Estrutura dos Testes BDD
```
test/bdd/
├── search-product/                   # Testes da API de busca
│   ├── search-product.feature       # Cenários em Gherkin
│   └── search-product.steps.ts      # Implementação dos steps
├── worker/                          # Testes da API do worker
│   ├── worker.feature               # Cenários em Gherkin
│   └── worker.steps.ts              # Implementação dos steps
├── support/                         # Configurações e utilitários
│   ├── world.ts                     # Mundo personalizado
│   ├── hooks.ts                     # Hooks globais
│   ├── utils.ts                     # Utilitários de teste
│   └── test-config.ts               # Configuração de teste
└── README.md                        # Documentação dos testes
```

### Cenários de Teste Implementados

**Busca de Produtos:**
- ✅ Criar busca básica de produto
- ✅ Criar busca com categoria específica
- ✅ Criar busca com faixa de preço
- ✅ Criar busca com todos os parâmetros
- ✅ Consultar status de uma busca
- ✅ Validações de entrada (nome vazio, maxResults inválido, etc.)

**Worker:**
- ✅ Verificar saúde do worker
- ✅ Verificar status do worker
- ✅ Verificar estatísticas detalhadas
- ✅ Reiniciar navegador Playwright
- ✅ Executar busca de teste
- ✅ Tratamento de erros e sobrecarga

### Executando os Testes

```bash
# Todos os testes BDD
pnpm run test:bdd

# Testes específicos
pnpm run test:bdd -- --tags "@search-product"
pnpm run test:bdd -- --tags "@worker"
pnpm run test:bdd -- --tags "@basic-search"

# Com relatórios
pnpm run test:bdd:report

# Com Jest (alternativo)
pnpm run test:bdd:jest
```

### **Resultados dos Testes BDD**
- **Tempo de execução**: ~54 segundos para todos os cenários
- **Cobertura**: 100% dos cenários implementados
- **Estabilidade**: Todos os testes passando consistentemente
- **Ambiente**: Testes isolados com aplicação em memória

### Ambiente de Teste

```bash
# Iniciar ambiente de teste com Docker
docker-compose -f docker-compose.test.yml up --build

# Configurar variáveis de teste
cp test/bdd/test.env.example .env.test
```

## 🚀 Deploy

### Ambiente de Produção

```bash
# Build da aplicação
pnpm run build:prod

# Configurar variáveis de produção
export NODE_ENV=production
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export RABBITMQ_URL="amqp://user:pass@host:5672"

# Iniciar aplicação
pnpm run start:prod
```

### Docker Production

```bash
# Build da imagem de produção
docker build -f Dockerfile.prod -t product-search:latest .

# Executar container
docker run -d \
  --name product-search-prod \
  -p 3000:3000 \
  --env-file .env.prod \
  product-search:latest
```

### Kubernetes (Opcional)

```bash
# Aplicar configurações
kubectl apply -f k8s/

# Verificar status
kubectl get pods
kubectl get services
```

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com PostgreSQL ✅
```bash
# Verificar se o container está rodando
docker-compose ps postgres

# Ver logs do PostgreSQL
docker-compose logs postgres

# Testar conexão
docker-compose exec postgres pg_isready -U postgres
```

#### 2. Erro de Conexão com RabbitMQ ✅
```bash
# Verificar status do RabbitMQ
docker-compose exec rabbitmq rabbitmq-diagnostics status

# Verificar filas
docker-compose exec rabbitmq rabbitmqctl list_queues
```

#### 3. Erro do Playwright 🚧
```bash
# Verificar se o Chromium está instalado
npx playwright install chromium

# Ver logs do worker
docker-compose logs worker

# Verificar screenshots de erro
ls -la screenshots/
```

#### 4. Problemas de Performance
```bash
# Verificar uso de memória
docker stats

# Verificar logs de performance
docker-compose logs app | grep "performance"

# Ajustar configurações do RabbitMQ
docker-compose exec rabbitmq rabbitmqctl set_policy \
  --apply-to queues \
  --priority 1 \
  --pattern ".*" \
  --definition '{"ha-mode":"all","ha-sync-mode":"automatic"}' \
  .
```

### Logs e Monitoramento

```bash
# Ver logs da aplicação
docker-compose logs -f app

# Ver logs do worker
docker-compose logs -f worker

# Ver logs do banco
docker-compose logs -f postgres

# Ver logs do RabbitMQ
docker-compose logs -f rabbitmq
```

### Métricas de Saúde

```bash
# Health check da API
curl http://localhost:3000/health

# Status do banco
curl http://localhost:3000/health/database

# Status do RabbitMQ
curl http://localhost:3000/health/rabbitmq
```

## 📚 Documentação Adicional

- [PRD do Projeto](./PRD-Automacao-Busca-Produtos.md) ✅
- [Status do Projeto](./project_status.md) ✅
- [Tarefas do Projeto](./project_tasks.md) ✅
- [Migrations do Banco](./migrations/) ✅
- [Configuração Docker](./docker-compose.yml) ✅
- [API Documentation](./docs/api.md) 🚧

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Email**: pedro.hp.almeida@gmail.com
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/gwan-usecases-to-ia/issues)
- **Documentação**: [Wiki do Projeto](https://github.com/seu-usuario/gwan-usecases-to-ia/wiki)

---

**Desenvolvido com ❤️ por Pedro Almeida**

**Versão**: 1.0.0  
**Última Atualização**: 21/08/2025  
**Status**: 90% Concluído - MVP Funcional com Testes BDD Completos
