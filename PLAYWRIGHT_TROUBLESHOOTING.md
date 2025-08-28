# 🔧 Troubleshooting - Problema de Compatibilidade do Playwright

## 🚨 **Problema Identificado**

**Erro:** `Executable doesn't exist at /ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell`

**Causa:** Incompatibilidade entre a versão do Playwright no código (1.55.0) e a imagem Docker (1.40.0).

## ✅ **Solução Implementada**

### 1. **Dockerfile Atualizado**
- ✅ `Dockerfile.worker.prod` atualizado para usar `mcr.microsoft.com/playwright:v1.55.0`
- ✅ Compatibilidade garantida entre código e imagem Docker

### 2. **Script de Deploy Atualizado**
- ✅ `deploy-production.sh` inclui verificação de versões
- ✅ Pull automático das imagens base corretas
- ✅ Rebuild forçado para garantir compatibilidade

### 3. **Script de Correção Rápida**
- ✅ `fix-playwright-issue.sh` para resolver o problema especificamente
- ✅ Testes automáticos de funcionamento

## 🚀 **Como Resolver em Produção**

### **Opção 1: Deploy Completo (Recomendado)**
```bash
# Executar o script de deploy atualizado
./deploy-production.sh
```

### **Opção 2: Correção Rápida**
```bash
# Executar apenas a correção do Playwright
./fix-playwright-issue.sh
```

### **Opção 3: Comandos Manuais**
```bash
# 1. Parar containers
docker-compose -f docker-compose.prod.yml down

# 2. Remover imagem antiga
docker rmi $(docker images -q product-search-worker-prod)

# 3. Atualizar imagem base
docker pull mcr.microsoft.com/playwright:v1.55.0

# 4. Rebuild
docker-compose -f docker-compose.prod.yml build --no-cache worker

# 5. Subir worker
docker-compose -f docker-compose.prod.yml up -d worker
```

## 🔍 **Verificação da Solução**

### **1. Verificar Versão do Playwright**
```bash
docker exec product-search-worker-prod node -e "
const { chromium } = require('playwright');
console.log('✅ Playwright funcionando');
console.log('📦 Versão:', require('playwright/package.json').version);
"
```

### **2. Testar Busca Simples**
```bash
curl -X POST "http://localhost:3000/api/worker/test-search/teste"
```

### **3. Verificar Logs**
```bash
docker logs product-search-worker-prod --tail 20
```

## 📋 **Checklist de Verificação**

- [ ] Imagem Docker usa versão 1.55.0
- [ ] Playwright inicializa sem erros
- [ ] Worker responde ao health check
- [ ] Busca de teste funciona
- [ ] Logs não mostram erros de executável

## 🚫 **O que NÃO fazer**

- ❌ **NUNCA** fazer downgrade do Playwright no código
- ❌ **NUNCA** usar imagem Docker desatualizada
- ❌ **NUNCA** ignorar erros de compatibilidade
- ❌ **NUNCA** usar `--force` em builds

## ✅ **O que SEMPRE fazer**

- ✅ **SEMPRE** manter versões sincronizadas
- ✅ **SEMPRE** fazer rebuild completo após mudanças
- ✅ **SEMPRE** testar funcionamento após deploy
- ✅ **SEMPRE** verificar logs de inicialização

## 🔄 **Prevenção Futura**

### **1. Monitoramento Automático**
```bash
# Adicionar ao crontab para verificar diariamente
0 6 * * * /path/to/check-playwright-version.sh
```

### **2. CI/CD Pipeline**
- ✅ Verificar compatibilidade de versões
- ✅ Testar build em ambiente similar
- ✅ Validação automática de imagens

### **3. Documentação de Versões**
- ✅ Manter registro de versões compatíveis
- ✅ Testar novas versões em staging
- ✅ Rollback automático em caso de problemas

## 📞 **Suporte**

Se o problema persistir após aplicar as correções:

1. **Verificar logs completos:**
   ```bash
   docker logs product-search-worker-prod --tail 100
   ```

2. **Verificar recursos do sistema:**
   ```bash
   docker stats product-search-worker-prod
   ```

3. **Verificar conectividade:**
   ```bash
   docker exec product-search-worker-prod ping google.com
   ```

4. **Verificar permissões:**
   ```bash
   docker exec product-search-worker-prod ls -la /ms-playwright/
   ```

## 🎯 **Resultado Esperado**

Após aplicar as correções:

- ✅ Worker inicia sem erros
- ✅ Playwright funciona corretamente
- ✅ Buscas são executadas com sucesso
- ✅ Status retorna "completed" em vez de "failed"
- ✅ Logs mostram execução normal

---

**Lembre-se:** Este problema é causado por incompatibilidade de versões. A solução é sempre manter as versões do código e das imagens Docker sincronizadas.
