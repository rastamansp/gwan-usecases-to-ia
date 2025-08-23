# language: pt
Funcionalidade: Gerenciamento do Worker
  Como um administrador do sistema
  Eu quero poder monitorar e controlar o worker Playwright
  Para garantir o funcionamento adequado da automação

  Contexto:
    Dado que o worker está rodando
    E que tenho acesso à API de gerenciamento do worker

  @worker-health
  Cenário: Verificar saúde do worker
    Quando eu envio uma requisição GET para "/api/worker/health" na API do worker
    Então a resposta da API do worker deve ter status 200
    E a API do worker deve retornar status "healthy"
    E deve incluir informações sobre o navegador Playwright

  @worker-status
  Cenário: Verificar status do worker
    Quando eu envio uma requisição GET para "/api/worker/status" na API do worker
    Então a resposta da API do worker deve ter status 200
    E deve retornar o status atual do worker
    E deve incluir informações sobre buscas em andamento

  @worker-stats
  Cenário: Verificar estatísticas detalhadas do worker
    Quando eu envio uma requisição GET para "/api/worker/stats" na API do worker
    Então a resposta da API do worker deve ter status 200
    E deve retornar estatísticas de performance
    E deve incluir métricas de buscas processadas
    E deve incluir tempo médio de processamento

  @worker-restart
  Cenário: Reiniciar navegador Playwright
    Quando eu envio uma requisição POST para "/api/worker/restart-browser" na API do worker
    Então a resposta da API do worker deve ter status 200
    E deve confirmar que o navegador foi reiniciado
    E o worker deve continuar funcionando normalmente

  @worker-test-search
  Cenário: Executar busca de teste
    Quando eu envio uma requisição POST para "/api/worker/test-search/PS5" na API do worker
    Então a resposta da API do worker deve ter status 200
    E deve confirmar que a busca de teste foi iniciada
    E a API do worker deve retornar um ID de busca válido
    E o status da busca no worker deve ser "processing"

  @worker-error
  Cenário: Verificar worker com erro
    Dado que o worker está com problemas
    Quando eu envio uma requisição GET para "/api/worker/health" na API do worker
    Então a resposta da API do worker deve ter status 503
    E a API do worker deve retornar status "unhealthy"
    E deve incluir detalhes sobre o problema

  @worker-overloaded
  Cenário: Verificar worker sobrecarregado
    Dado que o worker está processando muitas buscas
    Quando eu envio uma requisição GET para "/api/worker/status" na API do worker
    Então a resposta da API do worker deve ter status 200
    E deve indicar que o worker está sobrecarregado
    E deve incluir o número de buscas na fila
    E deve incluir recomendações de otimização
