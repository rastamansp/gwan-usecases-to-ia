# 🚀 Deploy no Portainer - Sistema de Automação de Busca de Produtos

## 📋 Pré-requisitos

- ✅ Portainer configurado e funcionando
- ✅ Rede `gwan` criada no Portainer
- ✅ Traefik configurado e funcionando
- ✅ Certificados SSL configurados (letsencrypt)
- ✅ Acesso aos serviços externos:
  - PostgreSQL: `postgres.gwan.com.br:5433`
  - RabbitMQ: `rabbitmq.gwan.com.br:5672`

## 🐳 Configuração Docker Compose

### 1. Arquivo Principal: `docker-compose.prod.yml`

Este arquivo está configurado para:
- **Rede**: `gwan` (rede externa do Portainer)
- **Traefik**: Configurado para `mart.gwan.com.br`
- **SSL**: Automático via letsencrypt
- **Recursos**: Limitados para produção

### 2. Estrutura de URLs

```
🌐 mart.gwan.com.br
├── 📱 /api/* → Aplicação Principal (NestJS)
└── ⚙️ /worker/* → Worker Playwright
```

## 🚀 Deploy no Portainer

### Passo 1: Criar Stack

1. **Acesse o Portainer**
2. **Vá para Stacks**
3. **Clique em "Add stack"**
4. **Configure:**
   - **Name**: `product-search-automation`
   - **Build method**: `Web editor`
   - **Copy o conteúdo do `docker-compose.prod.yml`**

### Passo 2: Configurar Rede

1. **Verifique se a rede `gwan` existe**
2. **Se não existir, crie:**
   ```bash
   docker network create gwan
   ```

### Passo 3: Deploy

1. **Clique em "Deploy the stack"**
2. **Aguarde a construção das imagens**
3. **Verifique os logs de build**

## 🔧 Configurações Traefik

### Labels Configurados

#### Aplicação Principal (`/api/*`)
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.product-search-app.rule=Host(`mart.gwan.com.br`) && PathPrefix(`/api`)"
  - "traefik.http.routers.product-search-app.entrypoints=websecure"
  - "traefik.http.routers.product-search-app.tls.certresolver=letsencrypt"
  - "traefik.http.services.product-search-app.loadbalancer.server.port=3000"
  - "traefik.http.middlewares.product-search-app-stripprefix.stripprefix.prefixes=/api"
  - "traefik.http.routers.product-search-app.middlewares=product-search-app-stripprefix"
```

#### Worker (`/worker/*`)
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.product-search-worker.rule=Host(`mart.gwan.com.br`) && PathPrefix(`/worker`)"
  - "traefik.http.routers.product-search-worker.entrypoints=websecure"
  - "traefik.http.routers.product-search-worker.tls.certresolver=letsencrypt"
  - "traefik.http.services.product-search-worker.loadbalancer.server.port=3000"
  - "traefik.http.middlewares.product-search-worker-stripprefix.stripprefix.prefixes=/worker"
  - "traefik.http.routers.product-search-worker.middlewares=product-search-worker-stripprefix"
```

## 📊 Monitoramento e Logs

### Health Checks

- **Aplicação**: `/health` (a cada 30s)
- **Worker**: `/api/worker/health` (a cada 30s)

### Logs

```bash
# Ver logs da aplicação
docker logs product-search-app-prod

# Ver logs do worker
docker logs product-search-worker-prod

# Logs em tempo real
docker logs -f product-search-app-prod
```

## 🧪 Testes Pós-Deploy

### 1. Testar Aplicação Principal

```bash
# Health Check
curl -k https://mart.gwan.com.br/api/health

# Criar busca
curl -k -X POST https://mart.gwan.com.br/api/search-product \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "iPhone 16 Pro",
    "maxResults": 5
  }'
```

### 2. Testar Worker

```bash
# Health Check
curl -k https://mart.gwan.com.br/worker/api/worker/health

# Status do worker
curl -k https://mart.gwan.com.br/worker/api/worker/status
```

### 3. Testar Documentação Swagger

- **Aplicação**: https://mart.gwan.com.br/api/docs
- **Worker**: https://mart.gwan.com.br/worker/api/docs

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. Erro de Rede
```bash
# Verificar se a rede gwan existe
docker network ls | grep gwan

# Verificar conectividade dos containers
docker exec product-search-app-prod ping postgres.gwan.com.br
```

#### 2. Erro de Traefik
```bash
# Verificar logs do Traefik
docker logs traefik

# Verificar se as rotas estão configuradas
docker exec traefik traefik version
```

#### 3. Erro de Build
```bash
# Verificar logs de build
docker-compose -f docker-compose.prod.yml logs

# Reconstruir imagens
docker-compose -f docker-compose.prod.yml up -d --build
```

### Comandos Úteis

```bash
# Status dos containers
docker ps -a

# Estatísticas de recursos
docker stats

# Inspecionar rede
docker network inspect gwan

# Ver logs de todos os serviços
docker-compose -f docker-compose.prod.yml logs -f
```

## 📈 Escalabilidade

### Recursos Configurados

- **Memória**: 1GB limite, 512MB reserva
- **CPU**: 0.5 cores limite, 0.25 cores reserva
- **Restart**: `unless-stopped`

### Para Escalar

1. **Editar o docker-compose.prod.yml**
2. **Ajustar recursos conforme necessário**
3. **Redeploy da stack**

## 🔒 Segurança

### Configurações Implementadas

- ✅ **Usuário não-root**: `nestjs:nodejs`
- ✅ **HTTPS**: SSL automático via Traefik
- ✅ **Health Checks**: Monitoramento automático
- ✅ **Resource Limits**: Controle de recursos
- ✅ **Logs Estruturados**: Para auditoria

### Recomendações Adicionais

- 🔐 **Secrets**: Usar Docker Secrets para senhas
- 🛡️ **Firewall**: Restringir acesso às portas
- 📊 **Monitoramento**: Implementar alertas
- 🔄 **Backup**: Backup automático dos logs

## 📞 Suporte

### Em Caso de Problemas

1. **Verificar logs dos containers**
2. **Verificar conectividade de rede**
3. **Verificar configuração do Traefik**
4. **Verificar recursos do sistema**

### Contatos

- **Email**: pedro.hp.almeida@gmail.com
- **Issues**: GitHub do projeto
- **Documentação**: Este arquivo e README.md

---

**🎯 Sistema configurado para produção no Portainer com Traefik!**
