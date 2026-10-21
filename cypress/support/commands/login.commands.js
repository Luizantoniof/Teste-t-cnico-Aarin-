import { ENDPOINTS } from '../constants/endpoints';
import { Cenario, CHAVES } from '../contexto/Cenario';
import { UsuarioFactory } from '../factories/UsuarioFactory';

/** POST /login — recebe um LoginPojo. */
Cypress.Commands.add('login', (credenciais) =>
  cy.api({ method: 'POST', url: ENDPOINTS.LOGIN, body: credenciais.toJSON() }),
);

/**
 * Pré-condição composta: cadastra um usuário do perfil informado e faz login.
 * Falha cedo (e com mensagem clara) se qualquer etapa não se comportar como esperado.
 * Não altera o contexto: útil para obter um "segundo usuário" (ex.: token de usuário comum).
 * @returns {{ usuario: UsuarioPojo, id: string, token: string }}
 */
Cypress.Commands.add('criarUsuarioAutenticado', (ehAdministrador = true) => {
  const usuario = UsuarioFactory.doPerfil(ehAdministrador);

  return cy.cadastrarUsuario(usuario).then((cadastro) => {
    expect(cadastro.status, 'pré-condição: cadastro do usuário (POST /usuarios)').to.eq(201);

    return cy.login(usuario.paraLogin()).then((login) => {
      expect(login.status, 'pré-condição: login do usuário (POST /login)').to.eq(200);
      return { usuario, id: cadastro.body._id, token: login.body.authorization };
    });
  });
});

/** Igual a criarUsuarioAutenticado, mas publica usuário, id e token no contexto do cenário. */
Cypress.Commands.add('prepararUsuarioAutenticado', (ehAdministrador = true) =>
  cy.criarUsuarioAutenticado(ehAdministrador).then((autenticado) => {
    Cenario.definir(CHAVES.USUARIO, autenticado.usuario);
    Cenario.definir(CHAVES.USUARIO_ID, autenticado.id);
    Cenario.definir(CHAVES.TOKEN, autenticado.token);
    return autenticado;
  }),
);
