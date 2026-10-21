# language: pt
@e2e @fluxo-principal
Funcionalidade: Fluxo principal de compra
  Valida a integração ponta a ponta entre usuários, login, produtos e carrinhos,
  encadeando token e IDs entre as chamadas, exatamente como o front-end da loja faria.

  Regra: A jornada completa de compra encadeia cadastro, autenticação, catálogo e carrinho

    @smoke @contrato @severity:blocker @doc:Carrinhos/post_carrinhos
    Cenário: Jornada completa: do cadastro do usuário à conclusão da compra
      # 1. POST /usuarios
      Quando eu cadastro um novo usuário administrador
      Então o status da resposta deve ser 201
      E a resposta deve respeitar o contrato "comum/cadastro-sucesso"
      # 2. POST /login
      Quando eu realizo login com as credenciais do usuário cadastrado
      Então o status da resposta deve ser 200
      E a resposta deve respeitar o contrato "login/sucesso"
      # 3. POST /produtos
      Quando eu cadastro os seguintes produtos:
        | apelido  | preco | quantidade |
        | notebook | 3500  | 10         |
        | mouse    | 120   | 50         |
      # 4.1 POST /carrinhos
      E eu adiciono ao carrinho os produtos:
        | apelido  | quantidade |
        | notebook | 2          |
        | mouse    | 3          |
      Então o status da resposta deve ser 201
      E a mensagem da resposta deve ser "Cadastro realizado com sucesso"
      E a resposta deve respeitar o contrato "comum/cadastro-sucesso"
      # 4.2 GET /carrinhos/{_id}
      Quando eu consulto o carrinho criado
      Então o status da resposta deve ser 200
      E a resposta deve respeitar o contrato "carrinhos/detalhe"
      E o carrinho deve pertencer ao usuário autenticado
      E o carrinho deve conter os produtos adicionados com seus preços unitários
      E o preço total do carrinho deve ser 7360
      E a quantidade total do carrinho deve ser 5
      E o estoque do produto "notebook" deve ser 8
      E o estoque do produto "mouse" deve ser 47
      # 4.3 DELETE /carrinhos/concluir-compra
      Quando eu concluo a compra
      Então o status da resposta deve ser 200
      E a mensagem da resposta deve ser "Registro excluído com sucesso"
      E a resposta deve respeitar o contrato "comum/mensagem"
      E o carrinho não deve mais existir
      E o estoque do produto "notebook" deve ser 8
      E o estoque do produto "mouse" deve ser 47

  Regra: Cancelar a compra exclui o carrinho e devolve os itens ao estoque

    Contexto:
      Dado que existe um usuário administrador cadastrado e autenticado
      E que os seguintes produtos estão cadastrados:
        | apelido  | preco | quantidade |
        | notebook | 3500  | 10         |
        | mouse    | 120   | 50         |

    @smoke @severity:critical @doc:Carrinhos/delete_carrinhos_cancelar_compra
    Cenário: Cancelar a compra devolve o estoque reservado
      Dado que eu possuo um carrinho com os produtos:
        | apelido  | quantidade |
        | notebook | 4          |
        | mouse    | 10         |
      E o estoque do produto "notebook" deve ser 6
      Quando eu cancelo a compra
      Então o status da resposta deve ser 200
      E a mensagem da resposta deve ser "Registro excluído com sucesso. Estoque dos produtos reabastecido"
      E o carrinho não deve mais existir
      E o estoque do produto "notebook" deve ser 10
      E o estoque do produto "mouse" deve ser 50

    @contrato @severity:critical @doc:Carrinhos/get_carrinhos
    Cenário: Listar os carrinhos do usuário autenticado
      Dado que eu possuo um carrinho com os produtos:
        | apelido | quantidade |
        | mouse   | 2          |
      Quando eu listo os carrinhos do usuário autenticado
      Então o status da resposta deve ser 200
      E a resposta deve respeitar o contrato "carrinhos/listagem"
      E o tempo de resposta deve estar dentro do SLA
      E a listagem deve conter somente o carrinho criado

    @severity:critical @doc:Carrinhos/post_carrinhos
    Esquema do Cenário: Calcular totais do carrinho para <itens>
      Quando eu adiciono ao carrinho os produtos:
        | apelido  | quantidade            |
        | notebook | <qtd_notebook>        |
        | mouse    | <qtd_mouse>           |
      E eu consulto o carrinho criado
      Então o preço total do carrinho deve ser <preco_total>
      E a quantidade total do carrinho deve ser <quantidade_total>
      E o preço total e a quantidade total devem corresponder aos itens do carrinho

      Exemplos:
        | itens                 | qtd_notebook | qtd_mouse | preco_total | quantidade_total |
        | uma unidade de cada   | 1            | 1         | 3620        | 2                |
        | várias unidades       | 3            | 7         | 11340       | 10               |
