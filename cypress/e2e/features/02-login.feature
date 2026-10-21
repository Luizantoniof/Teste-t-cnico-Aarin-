# language: pt
@login
Funcionalidade: Autenticação
  Como usuário cadastrado
  Quero me autenticar com e-mail e senha
  Para obter um token que autorize as operações protegidas da loja

  Contexto:
    Dado que existe um usuário administrador cadastrado

  Regra: Credenciais válidas geram um token JWT do tipo Bearer

    @smoke @contrato @severity:blocker @doc:Login/post_login
    Cenário: Autenticar com credenciais válidas
      Quando eu realizo login com as credenciais do usuário cadastrado
      Então o status da resposta deve ser 200
      E a mensagem da resposta deve ser "Login realizado com sucesso"
      E a resposta deve respeitar o contrato "login/sucesso"
      E o tempo de resposta deve estar dentro do SLA
      E o token retornado deve identificar o usuário autenticado
      E o token retornado deve expirar em 600 segundos

  Regra: Credenciais inválidas nunca geram token

    @negativo @severity:critical @doc:Login/post_login
    Esquema do Cenário: Recusar login com <situacao>
      Quando eu realizo login com e-mail "<email>" e senha "<senha>"
      Então o status da resposta deve ser 401
      E a mensagem da resposta deve ser "Email e/ou senha inválidos"
      E a resposta deve respeitar o contrato "comum/mensagem"
      E nenhum token deve ser retornado

      Exemplos:
        | situacao              | email               | senha                |
        | senha incorreta       | {{usuario.email}}   | SenhaErrada@123      |
        | e-mail não cadastrado | {{email.aleatorio}} | {{usuario.password}} |

    @negativo @contrato @doc:Login/post_login
    Esquema do Cenário: Validar campos obrigatórios do login: <campo> <situacao>
      Quando eu realizo login com e-mail "<email>" e senha "<senha>"
      Então o status da resposta deve ser 400
      E a resposta deve respeitar o contrato "comum/erros-validacao"
      E o campo "<campo>" da resposta deve conter "<mensagem>"

      Exemplos:
        | campo    | situacao  | email             | senha                | mensagem                          |
        | email    | em branco | {{vazio}}         | {{usuario.password}} | email não pode ficar em branco    |
        | password | em branco | {{usuario.email}} | {{vazio}}            | password não pode ficar em branco |
        | email    | ausente   | {{ausente}}       | {{usuario.password}} | email é obrigatório               |
