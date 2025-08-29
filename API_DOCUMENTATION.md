# 📚 Documentação das APIs - Sistema de Automação de Busca de Produtos

## 🎯 Visão Geral

Este documento descreve todas as APIs desenvolvidas no sistema de automação de busca de produtos usando NestJS, Playwright e RabbitMQ. As APIs permitem criar buscas automatizadas de produtos no Mercado Livre, monitorar o status das buscas e obter resultados detalhados.

---

## 🔍 Módulo: Search Product (`/search-product`)

### 1. **POST** `/search-product` - Criar Nova Busca

**Descrição:** Inicia uma nova busca automatizada de produtos usando Playwright.

**Endpoint:** `POST /search-product`

**Headers:**

```
Content-Type: application/json
```

**Body (CreateSearchDto):**

```json
{
  "productName": "PS5",
  "maxResults": 50,
  "category": "Gaming",
  "priceRange": {
    "min": 1000,
    "max": 5000
  }
}
```

**Campos:**

- `productName` (obrigatório): Nome do produto a ser buscado (máx: 255 caracteres)
- `maxResults` (opcional): Número máximo de resultados (1-100, padrão: 50) - **SEMPRE respeitado pelo sistema**
- `category` (opcional): Categoria do produto (máx: 100 caracteres)
- `priceRange` (opcional): Faixa de preço para filtrar resultados
  - `min`: Preço mínimo (>= 0)
  - `max`: Preço máximo (>= 0, deve ser > min)

**Resposta de Sucesso (202):**

```json
{
  "statusCode": 202,
  "message": "Busca iniciada com sucesso",
  "data": {
    "searchId": "bfc05476-0cd9-4371-b5e9-baaf9deaea0e",
    "productName": "PS5",
    "status": "queued",
    "estimatedTime": "30-60 segundos",
    "createdAt": "2025-08-22T21:44:23.143Z"
  }
}
```

**Validações:**

- Nome do produto é obrigatório e não pode estar vazio
- MaxResults deve ser entre 1 e 100
- Se especificada, faixa de preço deve ter min < max
- Categoria tem limite de 100 caracteres

**Exemplos de Uso:**

**Exemplo 1: Busca com maxResults específico**
```json
{
  "productName": "Nintendo Switch",
  "maxResults": 3
}
```
**Resultado:** Sistema retorna exatamente 3 produtos (ou menos se não houver 3 disponíveis)

**Exemplo 2: Busca com maxResults padrão**
```json
{
  "productName": "PS5"
}
```
**Resultado:** Sistema retorna até 50 produtos (valor padrão)

**Exemplo 3: Busca com maxResults máximo**
```json
{
  "productName": "Smartphone",
  "maxResults": 100
}
```
**Resultado:** Sistema retorna até 100 produtos

---

### 2. **GET** `/search-product/:searchId` - Consultar Status da Busca

**Descrição:** Recupera o status atual e detalhes de uma busca específica.

**Endpoint:** `GET /search-product/{searchId}`

**Parâmetros:**

- `searchId` (path): ID único da busca (UUID)

**Exemplo:** `GET /search-product/bfc05476-0cd9-4371-b5e9-baaf9deaea0e`

**Resposta de Sucesso (200):**

```json
{
  "statusCode": 200,
  "message": "Status da busca recuperado com sucesso",
  "data": {
    "searchId": "bfc05476-0cd9-4371-b5e9-baaf9deaea0e",
    "productName": "PS5",
    "status": "processing",
    "maxResults": 50,
    "category": "Gaming",
    "priceMin": 1000,
    "priceMax": 5000,
    "createdAt": "2025-08-22T21:44:23.143Z",
    "updatedAt": "2025-08-22T21:44:25.000Z",
    "completedAt": null,
    "errorMessage": null
  }
}
```

**Resposta de Erro (404):**

```json
{
  "statusCode": 404,
  "message": "Busca com ID bfc05476-0cd9-4371-b5e9-baaf9deaea0e não encontrada"
}
```

**Status Possíveis:**

- `queued`: Busca aguardando processamento
- `processing`: Busca em andamento
- `completed`: Busca concluída com sucesso
- `failed`: Busca falhou
- `cancelled`: Busca cancelada

---

### 3. **GET** `/search-product/:searchId/results` - Obter Resultados da Busca

**Descrição:** Recupera todos os produtos encontrados em uma busca específica.

**Endpoint:** `GET /search-product/{searchId}/results`

**Parâmetros:**

- `searchId` (path): ID único da busca (UUID)

**Exemplo:** `GET /search-product/bfc05476-0cd9-4371-b5e9-baaf9deaea0e/results`

**Resposta de Sucesso (200):**

```json
{
  "statusCode": 200,
  "message": "Resultados da busca recuperados com sucesso",
  "data": {
    "searchId": "bfc05476-0cd9-4371-b5e9-baaf9deaea0e",
    "productName": "PS5",
    "status": "completed",
    "totalResults": 2,
    "results": [
      {
        "id": "b376282a-59c3-415c-88e6-37bac7331e3b",
        "title": "PlayStation 5 Console Digital Edition",
        "price": 3499.0,
        "originalPrice": 3999.0,
        "discountPercentage": 12.5,
        "sellerName": "Loja Oficial",
        "sellerRating": 4.8,
        "freeShipping": true,
        "condition": "Novo",
        "imageUrl": "https://example.com/ps5.jpg",
        "productUrl": "https://produto.mercadolivre.com.br/ps5",
        "createdAt": "2025-08-23T01:03:12.500Z"
      }
    ],
    "searchInfo": {
      "createdAt": "2025-08-22T21:44:23.143Z",
      "completedAt": "2025-08-22T21:45:00.000Z",
      "maxResults": 50
    }
  }
}
```

**Resposta sem Resultados (200):**

```json
{
  "statusCode": 200,
  "message": "Resultados da busca recuperados com sucesso",
  "data": {
    "searchId": "bfc05476-0cd9-4371-b5e9-baaf9deaea0e",
    "productName": "PS5",
    "status": "completed",
    "totalResults": 0,
    "results": [],
    "searchInfo": {
      "createdAt": "2025-08-22T21:44:23.143Z",
      "completedAt": "2025-08-22T21:45:00.000Z",
      "maxResults": 50
    }
  }
}
```

**Campos dos Produtos:**

- `id`: ID único do resultado
- `title`: Título/nome do produto
- `price`: Preço atual (pode ser null)
- `originalPrice`: Preço original (pode ser null)
- `discountPercentage`: Percentual de desconto (pode ser null)
- `sellerName`: Nome do vendedor
- `sellerRating`: Avaliação do vendedor (0-5)
- `freeShipping`: Frete grátis disponível
- `condition`: Condição do produto (Novo, Usado, etc.)
- `imageUrl`: URL da imagem do produto
- `productUrl`: URL do produto no Mercado Livre
- `createdAt`: Data de criação do resultado

---

## 🤖 Módulo: Worker (`/worker`)

### 1. **GET** `/worker/health` - Verificar Saúde do Worker

**Descrição:** Retorna o status de saúde do worker e seus componentes.

**Endpoint:** `GET /worker/health`

**Resposta de Sucesso (200):**

```json
{
  "status": "healthy",
  "timestamp": "2025-08-22T21:44:23.143Z",
  "components": {
    "browser": "connected",
    "playwright": "ready",
    "rabbitmq": "connected"
  }
}
```

---

### 2. **GET** `/worker/status` - Obter Status do Worker

**Descrição:** Retorna o status atual do worker e informações de operação.

**Endpoint:** `GET /worker/status`

**Resposta de Sucesso (200):**

```json
{
  "status": "running",
  "activeSearches": 2,
  "completedSearches": 15,
  "failedSearches": 1,
  "uptime": "2h 30m 15s"
}
```

---

### 3. **GET** `/worker/stats` - Obter Estatísticas Detalhadas

**Descrição:** Retorna estatísticas de performance e métricas do worker.

**Endpoint:** `GET /worker/stats`

**Resposta de Sucesso (200):**

```json
{
  "performance": {
    "averageSearchTime": "45.2s",
    "totalSearches": 18,
    "successRate": "94.4%",
    "lastSearchTime": "2025-08-22T21:44:23.143Z"
  },
  "resources": {
    "memoryUsage": "256MB",
    "cpuUsage": "15%",
    "browserInstances": 1
  }
}
```

---

### 4. **POST** `/worker/restart-browser` - Reiniciar Navegador

**Descrição:** Reinicia o navegador Playwright para resolver problemas de estabilidade.

**Endpoint:** `POST /worker/restart-browser`

**Resposta de Sucesso (200):**

```json
{
  "statusCode": 200,
  "message": "Navegador reiniciado com sucesso",
  "timestamp": "2025-08-22T21:44:23.143Z"
}
```

**Resposta de Erro (500):**

```json
{
  "statusCode": 500,
  "message": "Erro ao reiniciar navegador",
  "error": "Falha na conexão com o Playwright",
  "timestamp": "2025-08-22T21:44:23.143Z"
}
```

---

### 5. **POST** `/worker/test-search/:productName` - Executar Busca de Teste

**Descrição:** Executa uma busca de teste para validar o funcionamento do worker.

**Endpoint:** `POST /worker/test-search/{productName}`

**Parâmetros:**

- `productName` (path): Nome do produto para teste

**Query Parameters:**

- `maxResults` (opcional): Número máximo de resultados (padrão: 5)

**Exemplo:** `POST /worker/test-search/PS5?maxResults=3`

**Resposta de Sucesso (200):**

```json
{
  "statusCode": 200,
  "message": "Busca de teste executada com sucesso",
  "data": {
    "productName": "PS5",
    "maxResults": 3,
    "resultsCount": 3,
    "results": [
      {
        "title": "PlayStation 5 Console Digital Edition",
        "price": 3499.0,
        "sellerName": "Loja Oficial"
      }
    ]
  },
  "timestamp": "2025-08-22T21:44:23.143Z"
}
```

---

### 6. **POST** `/worker/test-navigation` - Testar Navegação Básica

**Descrição:** Testa se o Playwright consegue navegar para o Mercado Livre e encontrar elementos básicos.

**Endpoint:** `POST /worker/test-navigation`

**Resposta de Sucesso (200):**

```json
{
  "statusCode": 200,
  "message": "Teste de navegação executado com sucesso",
  "data": {
    "navigationSuccess": true,
    "elementsFound": ["searchBox", "searchButton"],
    "pageTitle": "Mercado Livre Brasil",
    "responseTime": "2.3s"
  },
  "timestamp": "2025-08-22T21:44:23.143Z"
}
```

---

## 📊 Estrutura de Dados

### Enums

#### SearchStatus

```typescript
export enum SearchStatus {
  QUEUED = 'queued', // Aguardando processamento
  PROCESSING = 'processing', // Em andamento
  COMPLETED = 'completed', // Concluída com sucesso
  FAILED = 'failed', // Falhou
  CANCELLED = 'cancelled', // Cancelada
}
```

### DTOs Principais

#### CreateSearchDto

```typescript
{
  productName: string;           // Obrigatório
  maxResults?: number;           // Opcional (1-100, padrão: 50) - SEMPRE respeitado
  category?: string;             // Opcional (máx: 100 chars)
  priceRange?: {                 // Opcional
    min?: number;                // >= 0
    max?: number;                // >= 0, deve ser > min
  };
}
```

#### ProductResultDto

```typescript
{
  id: string;                    // ID único
  title: string;                 // Título do produto
  price?: number;                // Preço atual
  originalPrice?: number;        // Preço original
  discountPercentage?: number;   // Percentual de desconto
  sellerName?: string;           // Nome do vendedor
  sellerRating?: number;         // Avaliação (0-5)
  freeShipping: boolean;         // Frete grátis
  condition?: string;            // Condição do produto
  imageUrl?: string;             // URL da imagem
  productUrl?: string;           // URL do produto
  createdAt: Date;               // Data de criação
}
```

---

## 🔄 Fluxo de Uso das APIs

### 1. **Criar Busca**

```http
POST /search-product
Content-Type: application/json

{
  "productName": "iPhone 15",
  "maxResults": 30,
  "category": "Smartphones",
  "priceRange": {
    "min": 3000,
    "max": 8000
  }
}
```

### 2. **Monitorar Status**

```http
GET /search-product/{searchId}
```

### 3. **Obter Resultados**

```http
GET /search-product/{searchId}/results
```

### 4. **Monitorar Worker**

```http
GET /worker/health
GET /worker/status
GET /worker/stats
```

---

## ⚠️ Códigos de Erro Comuns

### 400 - Bad Request

- Dados de entrada inválidos
- Validações falharam
- Faixa de preço inválida

### 404 - Not Found

- Busca não encontrada
- ID inválido fornecido

### 500 - Internal Server Error

- Erro interno do servidor
- Falha na conexão com banco de dados
- Erro no worker Playwright

---

## 📝 Notas Importantes

### ✅ Correção do maxResults (v1.1.0)

**Problema Resolvido:** O parâmetro `maxResults` agora é **SEMPRE** respeitado pelo sistema, garantindo que o número de resultados retornados corresponda exatamente ao solicitado.

**Antes:** O sistema sempre retornava 50 resultados independente do valor solicitado
**Depois:** O sistema retorna exatamente o número de resultados solicitado (ou menos se não houver disponíveis)

**Exemplo de Funcionamento Correto:**
```json
// Requisição
{
  "productName": "Nintendo Switch",
  "maxResults": 3
}

// Resultado
{
  "totalResults": 3,
  "maxResults": 3,
  "results": [/* exatamente 3 produtos */]
}
```

---

## 🚀 Funcionalidades da Interface Gráfica

### Páginas Principais

#### 1. **Dashboard Principal**

- Visão geral das buscas ativas
- Estatísticas de performance
- Status do worker
- Gráficos de métricas

#### 2. **Nova Busca**

- Formulário para criar busca
- Validação em tempo real
- Seleção de categoria
- Configuração de faixa de preço
- Botão de envio

#### 3. **Lista de Buscas**

- Tabela com todas as buscas
- Filtros por status, categoria, data
- Paginação
- Ações (ver detalhes, cancelar)

#### 4. **Detalhes da Busca**

- Status atual
- Progresso da busca
- Informações configuradas
- Histórico de atualizações

#### 5. **Resultados da Busca**

- Lista de produtos encontrados
- Filtros por preço, vendedor, condição
- Ordenação por relevância, preço, avaliação
- Cards de produto com informações completas

#### 6. **Monitoramento do Worker**

- Status de saúde
- Métricas de performance
- Logs em tempo real
- Controles de manutenção

### Componentes da Interface

#### Formulário de Busca

- Campo de nome do produto (obrigatório)
- Seletor de categoria (opcional)
- Slider de faixa de preço (opcional)
- Input de máximo de resultados (1-100)
- Botão de envio com loading

#### Tabela de Buscas

- Colunas: ID, Produto, Status, Categoria, Data, Ações
- Filtros por status e categoria
- Busca por texto
- Paginação

#### Cards de Produto

- Imagem do produto
- Título
- Preço atual e original
- Percentual de desconto
- Informações do vendedor
- Botão para ver no Mercado Livre

#### Indicadores de Status

- Badges coloridos para cada status
- Progress bar para buscas em andamento
- Ícones intuitivos

#### Métricas e Gráficos

- Total de buscas por status
- Tempo médio de conclusão
- Taxa de sucesso
- Produtos encontrados por categoria

---

## 🎨 Considerações de Design

### Cores e Status

- **Queued**: Azul (#3B82F6)
- **Processing**: Amarelo (#F59E0B)
- **Completed**: Verde (#10B981)
- **Failed**: Vermelho (#EF4444)
- **Cancelled**: Cinza (#6B7280)

### Responsividade

- Design mobile-first
- Tabelas responsivas
- Cards adaptáveis
- Navegação touch-friendly

### Acessibilidade

- Contraste adequado
- Labels descritivos
- Navegação por teclado
- Screen reader friendly

---

## 📱 Exemplos de Uso

### Busca Simples

```json
POST /search-product
{
  "productName": "Notebook Dell"
}
```

### Busca com Filtros

```json
POST /search-product
{
  "productName": "Smartphone Samsung",
  "maxResults": 25,
  "category": "Smartphones",
  "priceRange": {
    "min": 1000,
    "max": 3000
  }
}
```

### Monitoramento em Tempo Real

```javascript
// Polling para atualizar status
setInterval(async () => {
  const status = await fetch(`/search-product/${searchId}`);
  updateUI(status);
}, 5000);
```

---

## 🔧 Configurações Técnicas

### Base URL

```
http://localhost:3000/api
```

### Timeouts

- **Busca**: 30-60 segundos (estimado)
- **API**: 30 segundos
- **Worker Health Check**: 5 segundos

### Rate Limiting

- **Criar Busca**: 10 por minuto
- **Consultas**: 100 por minuto
- **Worker**: 50 por minuto

---

## 📋 Checklist de Implementação

### Frontend

- [ ] Setup do projeto (React/Vue/Angular)
- [ ] Componentes de formulário
- [ ] Tabelas de dados
- [ ] Cards de produto
- [ ] Sistema de notificações
- [ ] Tratamento de erros
- [ ] Loading states
- [ ] Responsividade

### Integração

- [ ] Cliente HTTP para APIs
- [ ] Validação de formulários
- [ ] Gerenciamento de estado
- [ ] Polling para atualizações
- [ ] Tratamento de erros
- [ ] Cache de dados

### UX/UI

- [ ] Design system
- [ ] Componentes reutilizáveis
- [ ] Feedback visual
- [ ] Navegação intuitiva
- [ ] Acessibilidade
- [ ] Performance

---

Esta documentação fornece todas as informações necessárias para criar uma interface gráfica completa e funcional para o sistema de automação de busca de produtos. As APIs estão bem estruturadas e seguem padrões REST, facilitando a integração com qualquer framework frontend moderno.
