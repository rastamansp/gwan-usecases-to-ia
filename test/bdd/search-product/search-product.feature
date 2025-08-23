# language: pt
@search-product
Funcionalidade: Busca de Produtos
  Como um usuário do sistema
  Eu quero poder buscar produtos por diferentes critérios
  Para encontrar os produtos que preciso

  Contexto:
    Dado que o sistema de busca está funcionando
    E que tenho acesso à API de busca de produtos

  @basic-search
  Cenário: Criar busca básica de produto
    E o corpo da requisição contém:
      """
      {
        "productName": "PS5",
        "maxResults": 50
      }
      """
    Quando eu envio uma requisição POST para "/api/search-product" na API de busca
    Então a resposta da API de busca deve ter status 202
    E a API de busca deve retornar um ID de busca válido
    E o status da busca na API deve ser "queued"

  @category-search
  Cenário: Criar busca com categoria específica
    E o corpo da requisição contém:
      """
      {
        "productName": "Xbox Series X",
        "maxResults": 30,
        "category": "Games e Consoles"
      }
      """
    Quando eu envio uma requisição POST para "/api/search-product" na API de busca
    Então a resposta da API de busca deve ter status 202
    E a API de busca deve retornar um ID de busca válido
    E o status da busca na API deve ser "queued"

  @price-range-search
  Cenário: Criar busca com faixa de preço
    E o corpo da requisição contém:
      """
      {
        "productName": "Nintendo Switch",
        "maxResults": 25,
        "priceRange": {
          "min": 1000,
          "max": 3000
        }
      }
      """
    Quando eu envio uma requisição POST para "/api/search-product" na API de busca
    Então a resposta da API de busca deve ter status 202
    E a API de busca deve retornar um ID de busca válido
    E o status da busca na API deve ser "queued"

  @complete-search
  Cenário: Criar busca com todos os parâmetros
    E o corpo da requisição contém:
      """
      {
        "productName": "Smartphone Samsung",
        "maxResults": 100,
        "category": "Eletrônicos",
        "priceRange": {
          "min": 500,
          "max": 5000
        }
      }
      """
    Quando eu envio uma requisição POST para "/api/search-product" na API de busca
    Então a resposta da API de busca deve ter status 202
    E a API de busca deve retornar um ID de busca válido
    E o status da busca na API deve ser "queued"

  @status-query
  Cenário: Consultar status de uma busca
    Dado que existe uma busca com ID "881b40bc-d710-4c7f-82b4-9368af61b320"
    Quando eu envio uma requisição GET para "/api/search-product/881b40bc-d710-4c7f-82b4-9368af61b320" na API de busca
    Então a resposta da API de busca deve ter status 200
    E deve retornar os detalhes da busca
    E deve incluir o status atual da busca

  @validation-empty-name
  Cenário: Validação - Nome de produto vazio
    E o corpo da requisição contém:
      """
      {
        "productName": "",
        "maxResults": 50
      }
      """
    Quando eu envio uma requisição POST para "/api/search-product" na API de busca
    Então a resposta da API de busca deve ter status 400
    E deve retornar uma mensagem de erro de validação

  @validation-invalid-maxresults
  Cenário: Validação - MaxResults inválido
    E o corpo da requisição contém:
      """
      {
        "productName": "PS5",
        "maxResults": 150
      }
      """
    Quando eu envio uma requisição POST para "/api/search-product" na API de busca
    Então a resposta da API de busca deve ter status 400
    E deve retornar uma mensagem de erro de validação

  @validation-invalid-price-range
  Cenário: Validação - Faixa de preço inválida
    E o corpo da requisição contém:
      """
      {
        "productName": "PS5",
        "priceRange": {
          "min": 5000,
          "max": 1000
        }
      }
      """
    Quando eu envio uma requisição POST para "/api/search-product" na API de busca
    Então a resposta da API de busca deve ter status 400
    E deve retornar uma mensagem de erro de validação
