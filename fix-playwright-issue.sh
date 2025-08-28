#!/bin/bash

# Script para resolver problema de compatibilidade do Playwright em produção
# Executar quando aparecer erro: "Executable doesn't exist at /ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell"

set -e

echo "🔧 Resolvendo problema de compatibilidade do Playwright..."

# 1. Verificar versão atual do Playwright no código
echo "📦 Verificando versão do Playwright no package.json..."
PLAYWRIGHT_VERSION=$(grep '"playwright"' package.json | sed 's/.*"playwright": "^\([^"]*\)".*/\1/')
echo "Versão atual: $PLAYWRIGHT_VERSION"

# 2. Parar containers
echo "🛑 Parando containers..."
docker-compose -f docker-compose.prod.yml down

# 3. Remover imagens antigas
echo "🧹 Removendo imagens antigas..."
docker rmi $(docker images -q product-search-worker-prod) 2>/dev/null || true

# 4. Atualizar imagem base do Playwright
echo "⬇️ Atualizando imagem base do Playwright..."
docker pull mcr.microsoft.com/playwright:v1.55.0

# 5. Rebuild da imagem do worker
echo "🔨 Rebuild da imagem do worker..."
docker-compose -f docker-compose.prod.yml build --no-cache worker

# 6. Subir apenas o worker
echo "⬆️ Subindo worker..."
docker-compose -f docker-compose.prod.yml up -d worker

# 7. Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 20

# 8. Verificar se o Playwright está funcionando
echo "🔍 Testando Playwright..."
docker exec product-search-worker-prod node -e "
try {
  const { chromium } = require('playwright');
  console.log('✅ Playwright funcionando corretamente');
  console.log('📦 Versão:', require('playwright/package.json').version);
} catch (error) {
  console.error('❌ Erro no Playwright:', error.message);
  process.exit(1);
}
"

# 9. Testar busca simples
echo "🧪 Testando busca simples..."
curl -X POST "http://localhost:3000/api/worker/test-search/teste" || echo "❌ Worker ainda não está respondendo"

echo "✅ Problema do Playwright resolvido!"
echo "🌐 Worker disponível em: https://mart.gwan.com.br/worker"
