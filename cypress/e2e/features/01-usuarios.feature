# language: pt
@usuarios
Funcionalidade: Gestão de usuários
  Como operador da loja ServeRest
  Quero cadastrar e consultar usuários
  Para que clientes e administradores possam acessar a plataforma

  Regra: Um usuário só é cadastrado com dados válidos e e-mail único

    @smoke @contrato @severity:critical @doc:Usuários/post_usuarios
    Esquema do Cenário: Cadastrar usuário com perfil <perfil>
      Quando eu cadastro um novo usuário <perfil>
      Então o status da resposta deve ser 201
      E a mensagem da resposta deve ser "Cadastro realizado com sucesso"
      E a resposta deve respeitar o contrato "comum/cadastro-sucesso"
      E o tempo de resposta deve estar dentro do SLA
      E o usuário deve estar persistido com os mesmos dados enviados

      Exemplos:
        | perfil        |
        | administrador |
        | comum         |

    @negativo @severity:critical @doc:Usuários/post_usuarios
    Cenário: Impedir cadastro de usuário com e-mail já utilizado
      Dado que existe um usuário comum cadastrado
      Quando eu tento cadastrar outro usuário com o mesmo e-mail
      Então o status da resposta deve ser 400
      E a mensagem da resposta deve ser "Este email já está sendo usado"
      E a resposta deve respeitar o contrato "comum/mensagem"

    @negativo @contrato @doc:Usuários/post_usuarios
    Esquema do Cenário: Rejeitar cadastro com <campo> <situacao>
      Quando eu tento cadastrar um usuário com o campo "<campo>" igual a "<valor>"
      Então o status da resposta deve ser 400
      E a resposta deve respeitar o contrato "comum/erros-validacao"
      E o campo "<campo>" da resposta deve conter "<mensagem>"

      Exemplos: Campos obrigatórios em branco
        | campo         | situacao  | valor     | mensagem                                  |
        | nome          | em branco | {{vazio}} | nome não pode ficar em branco             |
        | email         | em branco | {{vazio}} | email não pode ficar em branco            |
        | password      | em branco | {{vazio}} | password não pode ficar em branco         |

      Exemplos: Campos ausentes
        | campo         | situacao  | valor       | mensagem                       |
        | nome          | ausente   | {{ausente}} | nome é obrigatório             |
        | administrador | ausente   | {{ausente}} | administrador é obrigatório    |

      Exemplos: Formatos inválidos
        | campo         | situacao  | valor          | mensagem                                   |
        | email         | inválido  | email.invalido | email deve ser um email válido             |
        | administrador | inválido  | talvez         | administrador deve ser 'true' ou 'false'   |

  Regra: Usuários cadastrados podem ser consultados por identificador e filtro

    @contrato @doc:Usuários/get_usuarios
    Cenário: Listar usuários filtrando pelo e-mail cadastrado
      Dado que existe um usuário comum cadastrado
      Quando eu listo os usuários filtrando pelo e-mail cadastrado
      Então o status da resposta deve ser 200
      E a resposta deve respeitar o contrato "usuarios/listagem"
      E a listagem deve conter somente o usuário cadastrado

    @negativo @doc:Usuários/get_usuarios__id_
    Cenário: Buscar usuário inexistente
      Quando eu busco o usuário de id "0000000000000000"
      Então o status da resposta deve ser 400
      E a mensagem da resposta deve ser "Usuário não encontrado"
      E a resposta deve respeitar o contrato "comum/mensagem"
