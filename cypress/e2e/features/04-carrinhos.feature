# language: pt
@carrinhos
Funcionalidade: Regras de negócio do carrinho
  Como cliente autenticado
  Quero montar um carrinho apenas com produtos válidos e disponíveis
  Para que a loja nunca venda além do estoque nem gere pedidos inconsistentes

  Contexto:
    Dado que existe um usuário administrador cadastrado e autenticado
    E que os seguintes produtos estão cadastrados:
      | apelido  | preco | quantidade |
      | notebook | 3500  | 10         |
      | mouse    | 120   | 50         |

  Regra: Cada usuário pode ter somente um carrinho ativo

    @negativo @severity:critical @doc:Carrinhos/post_carrinhos
    Cenário: Impedir a criação de um segundo carrinho para o mesmo usuário
      Dado que eu possuo um carrinho com os produtos:
        | apelido | quantidade |
        | mouse   | 1          |
      Quando eu tento criar outro carrinho com o produto "notebook" e quantidade 1
      Então o status da resposta deve ser 400
      E a mensagem da resposta deve ser "Não é permitido ter mais de 1 carrinho"
      E a resposta deve respeitar o contrato "comum/mensagem"

  Regra: Só entram no carrinho produtos existentes, sem duplicidade e com estoque suficiente

    @negativo @contrato @severity:critical @doc:Carrinhos/post_carrinhos
    Esquema do Cenário: Rejeitar item de carrinho com <situacao>
      Quando eu tento criar um carrinho com o produto "<produto>" e quantidade <quantidade>
      Então o status da resposta deve ser 400
      E a mensagem da resposta deve ser "<mensagem>"
      E a resposta deve respeitar o contrato "carrinhos/erro-item"
      E o estoque do produto "notebook" deve ser 10

      Exemplos:
        | situacao                    | produto     | quantidade | mensagem                                 |
        | produto inexistente         | inexistente | 1          | Produto não encontrado                   |
        | quantidade acima do estoque | notebook    | 11         | Produto não possui quantidade suficiente |

    @negativo @contrato @doc:Carrinhos/post_carrinhos
    Cenário: Rejeitar carrinho com o mesmo produto repetido
      Quando eu tento criar um carrinho com o produto "mouse" repetido
      Então o status da resposta deve ser 400
      E a mensagem da resposta deve ser "Não é permitido possuir produto duplicado"
      E a resposta deve respeitar o contrato "carrinhos/erro-produto-duplicado"
      E a resposta deve apontar o produto "mouse" como duplicado

    @limite @severity:critical @doc:Carrinhos/post_carrinhos
    Cenário: Permitir comprar exatamente todo o estoque disponível (valor limite)
      Quando eu adiciono ao carrinho os produtos:
        | apelido  | quantidade |
        | notebook | 10         |
      Então o status da resposta deve ser 201
      E o estoque do produto "notebook" deve ser 0

  Regra: Operações de carrinho exigem autenticação

    @negativo @seguranca @doc:Carrinhos/post_carrinhos
    Esquema do Cenário: Bloquear criação de carrinho com <autenticacao>
      Dado que as próximas requisições serão enviadas com <autenticacao>
      Quando eu tento criar um carrinho com o produto "mouse" e quantidade 1
      Então o status da resposta deve ser 401
      E a mensagem da resposta deve ser "Token de acesso ausente, inválido, expirado ou usuário do token não existe mais"
      E o estoque do produto "mouse" deve ser 50

      Exemplos:
        | autenticacao      |
        | token inválido    |
        | ausência de token |

  Regra: Recursos vinculados a um carrinho não podem ser excluídos

    @integridade @severity:critical @doc:Produtos/delete_produtos__id_
    Cenário: Impedir exclusão de produto que faz parte de um carrinho
      Dado que eu possuo um carrinho com os produtos:
        | apelido  | quantidade |
        | notebook | 1          |
      Quando eu tento excluir o produto "notebook"
      Então o status da resposta deve ser 400
      E a mensagem da resposta deve ser "Não é permitido excluir produto que faz parte de carrinho"
      E a resposta deve respeitar o contrato "produtos/exclusao-bloqueada"
      E a resposta deve referenciar o carrinho criado em "idCarrinhos"

    @integridade @severity:critical @doc:Usuários/delete_usuarios__id_
    Cenário: Impedir exclusão de usuário que possui carrinho
      Dado que eu possuo um carrinho com os produtos:
        | apelido | quantidade |
        | mouse   | 2          |
      Quando eu tento excluir o usuário autenticado
      Então o status da resposta deve ser 400
      E a mensagem da resposta deve ser "Não é permitido excluir usuário com carrinho cadastrado"
      E a resposta deve respeitar o contrato "usuarios/exclusao-bloqueada"
      E a resposta deve referenciar o carrinho criado em "idCarrinho"

  Regra: Consultas e encerramentos sem carrinho retornam mensagens claras

    @negativo @doc:Carrinhos/get_carrinhos__id_
    Cenário: Buscar carrinho inexistente
      Quando eu busco o carrinho de id "0000000000000000"
      Então o status da resposta deve ser 400
      E a mensagem da resposta deve ser "Carrinho não encontrado"

    @negativo @doc:Carrinhos/delete_carrinhos_concluir_compra
    Esquema do Cenário: <acao> a compra quando o usuário não possui carrinho
      Quando eu <acao_verbo> a compra
      Então o status da resposta deve ser 200
      E a mensagem da resposta deve ser "Não foi encontrado carrinho para esse usuário"

      Exemplos:
        | acao     | acao_verbo |
        | Concluir | concluo    |
        | Cancelar | cancelo    |
