#!/bin/bash

# Script de Deploy para Produção - Sistema de Busca de Produtos
# Resolve problema de compatibilidade do Playwright

set -e

echo "🚀 Iniciando deploy em produção..."

# 1. Parar e remover containers antigos
echo "📦 Parando containers antigos..."
docker-compose -f docker-compose.prod.yml down

# 2. Remover imagens antigas para forçar rebuild
echo "🧹 Removendo imagens antigas..."
docker rmi $(docker images -q product-search-app-prod) 2>/dev/null || true
docker rmi $(docker images -q product-search-worker-prod) 2>/dev/null || true

# 3. Limpar cache do Docker
echo "🧽 Limpando cache do Docker..."
docker system prune -f

# 4. Fazer pull das imagens base mais recentes
echo "⬇️ Atualizando imagens base..."
docker pull mcr.microsoft.com/playwright:v1.55.0-focal
docker pull node:20-alpine

# 5. Rebuild das imagens
echo "🔨 Rebuild das imagens..."
docker-compose -f docker-compose.prod.yml build --no-cache

# 6. Verificar se as imagens foram criadas corretamente
echo "🔍 Verificando imagens criadas..."
docker images | grep product-search

# 7. Subir os serviços
echo "⬆️ Subindo serviços..."
docker-compose -f docker-compose.prod.yml up -d

# 8. Aguardar inicialização
echo "⏳ Aguardando inicialização dos serviços..."
sleep 30

# 9. Verificar status dos containers
echo "📊 Status dos containers:"
docker-compose -f docker-compose.prod.yml ps

# 10. Verificar logs do worker
echo "📝 Logs do worker:"
docker logs product-search-worker-prod --tail 20

# 11. Testar saúde do worker
echo "🏥 Testando saúde do worker..."
curl -f http://localhost:3000/api/worker/health || echo "❌ Worker ainda não está respondendo"

# 12. Verificar versão do Playwright
echo "🔍 Verificando versão do Playwright no container:"
docker exec product-search-worker-prod node -e "
try {
  const { chromium } = require('playwright');
  console.log('✅ Playwright funcionando corretamente');
  console.log('📦 Versão:', require('playwright/package.json').version);
} catch (error) {
  console.error('❌ Erro no Playwright:', error.message);
}
"

echo "✅ Deploy concluído!"
echo "🌐 Acesse: https://mart.gwan.com.br"
echo "📊 Monitoramento: https://mart.gwan.com.br/worker/health"

# 13. Comandos úteis para troubleshooting
echo ""
echo "🔧 Comandos úteis para troubleshooting:"
echo "  Ver logs do worker: docker logs product-search-worker-prod -f"
echo "  Ver logs da app: docker logs product-search-app-prod -f"
echo "  Reiniciar worker: docker restart product-search-worker-prod"
echo "  Ver status: docker-compose -f docker-compose.prod.yml ps"
