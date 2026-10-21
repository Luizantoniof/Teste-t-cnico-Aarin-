# language: pt
@produtos
Funcionalidade: Catálogo de produtos
  Como administrador da loja
  Quero cadastrar produtos com preço e estoque
  Para que eles possam ser adicionados aos carrinhos dos clientes

  Contexto:
    Dado que existe um usuário administrador cadastrado e autenticado

  Regra: Somente administradores autenticados cadastram produtos válidos e com nome único

    @smoke @contrato @severity:critical @doc:Produtos/post_produtos
    Cenário: Cadastrar produto com sucesso
      Quando eu cadastro um novo produto
      Então o status da resposta deve ser 201
      E a mensagem da resposta deve ser "Cadastro realizado com sucesso"
      E a resposta deve respeitar o contrato "comum/cadastro-sucesso"
      E o tempo de resposta deve estar dentro do SLA
      E o produto deve estar persistido com os mesmos dados enviados

    @contrato @doc:Produtos/get_produtos
    Cenário: Listar produtos filtrando pelo nome cadastrado
      Dado que existe um produto cadastrado
      Quando eu listo os produtos filtrando pelo nome cadastrado
      Então o status da resposta deve ser 200
      E a resposta deve respeitar o contrato "produtos/listagem"
      E a listagem deve conter somente o produto cadastrado

    @negativo @doc:Produtos/post_produtos
    Cenário: Impedir cadastro de produto com nome já existente
      Dado que existe um produto cadastrado
      Quando eu tento cadastrar outro produto com o mesmo nome
      Então o status da resposta deve ser 400
      E a mensagem da resposta deve ser "Já existe produto com esse nome"

    @negativo @seguranca @severity:critical @doc:Produtos/post_produtos
    Esquema do Cenário: Bloquear cadastro de produto com <autenticacao>
      Dado que as próximas requisições serão enviadas com <autenticacao>
      Quando eu tento cadastrar um novo produto
      Então o status da resposta deve ser <status>
      E a mensagem da resposta deve ser "<mensagem>"
      E a resposta deve respeitar o contrato "comum/mensagem"

      Exemplos:
        | autenticacao           | status | mensagem                                                                        |
        | token de usuário comum | 403    | Rota exclusiva para administradores                                             |
        | token inválido         | 401    | Token de acesso ausente, inválido, expirado ou usuário do token não existe mais |
        | ausência de token      | 401    | Token de acesso ausente, inválido, expirado ou usuário do token não existe mais |

    @negativo @contrato @doc:Produtos/post_produtos
    Esquema do Cenário: Rejeitar produto com <campo> <situacao>
      Quando eu tento cadastrar um produto com o campo "<campo>" igual a "<valor>"
      Então o status da resposta deve ser 400
      E a resposta deve respeitar o contrato "comum/erros-validacao"
      E o campo "<campo>" da resposta deve conter "<mensagem>"

      Exemplos: Valores numéricos fora das regras (análise de valor limite)
        | campo      | situacao      | valor | mensagem                               |
        | preco      | zerado        | 0     | preco deve ser um número positivo      |
        | preco      | negativo      | -10   | preco deve ser um número positivo      |
        | preco      | decimal       | 10.5  | preco deve ser um inteiro              |
        | quantidade | negativa      | -1    | quantidade deve ser maior ou igual a 0 |
        | quantidade | decimal       | 1.5   | quantidade deve ser um inteiro         |

      Exemplos: Tipos e obrigatoriedade
        | campo     | situacao      | valor     | mensagem                           |
        | preco     | não numérico  | abc       | preco deve ser um número           |
        | nome      | em branco     | {{vazio}} | nome não pode ficar em branco      |
        | descricao | em branco     | {{vazio}} | descricao não pode ficar em branco |
