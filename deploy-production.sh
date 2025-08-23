#!/bin/bash

# 🚀 Script de Deploy para Produção - Sistema de Automação de Busca de Produtos
# Uso: ./deploy-production.sh

set -e

echo "🚀 Iniciando deploy para produção..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    error "Docker não está rodando. Inicie o Docker e tente novamente."
    exit 1
fi

# Verificar se a rede gwan existe
if ! docker network ls | grep -q "gwan"; then
    warn "Rede 'gwan' não encontrada. Criando..."
    docker network create gwan
    log "Rede 'gwan' criada com sucesso!"
else
    log "Rede 'gwan' já existe."
fi

# Parar containers existentes (se houver)
if docker ps -q --filter "name=product-search" | grep -q .; then
    log "Parando containers existentes..."
    docker stop $(docker ps -q --filter "name=product-search") || true
    docker rm $(docker ps -aq --filter "name=product-search") || true
fi

# Remover imagens antigas (opcional)
read -p "Deseja remover imagens antigas? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Removendo imagens antigas..."
    docker image prune -f
fi

# Build e deploy
log "Iniciando build das imagens de produção..."
docker-compose -f docker-compose.prod.yml build --no-cache

log "Iniciando serviços de produção..."
docker-compose -f docker-compose.prod.yml up -d

# Aguardar serviços iniciarem
log "Aguardando serviços iniciarem..."
sleep 30

# Verificar status dos containers
log "Verificando status dos containers..."
docker-compose -f docker-compose.prod.yml ps

# Verificar health checks
log "Verificando health checks..."
sleep 10

# Testar conectividade
log "Testando conectividade..."

# Verificar se os containers estão rodando
if ! docker ps --filter "name=product-search" --filter "status=running" | grep -q "product-search"; then
    error "Alguns containers não estão rodando. Verifique os logs:"
    docker-compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi

# Verificar logs de inicialização
log "Verificando logs de inicialização..."
docker-compose -f docker-compose.prod.yml logs --tail=20

# Informações finais
echo
log "🎉 Deploy concluído com sucesso!"
echo
info "📊 Status dos serviços:"
docker-compose -f docker-compose.prod.yml ps
echo
info "🌐 URLs de acesso:"
echo "   • Aplicação Principal: https://mart.gwan.com.br/api"
echo "   • Worker: https://mart.gwan.com.br/worker"
echo "   • Documentação: https://mart.gwan.com.br/api/docs"
echo
info "📋 Comandos úteis:"
echo "   • Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   • Status: docker-compose -f docker-compose.prod.yml ps"
echo "   • Parar: docker-compose -f docker-compose.prod.yml down"
echo "   • Rebuild: docker-compose -f docker-compose.prod.yml up -d --build"
echo
info "🔍 Para monitorar:"
echo "   • docker stats"
echo "   • docker logs -f product-search-app-prod"
echo "   • docker logs -f product-search-worker-prod"
echo
log "✅ Sistema pronto para uso em produção!"
