import { ENDPOINTS } from '../constants/endpoints';
import { Cenario } from '../contexto/Cenario';

/** POST /usuarios — recebe um UsuarioPojo. Usuários criados são agendados para limpeza. */
Cypress.Commands.add('cadastrarUsuario', (usuario) =>
  cy.api({ method: 'POST', url: ENDPOINTS.USUARIOS, body: usuario.toJSON() }).then((resposta) => {
    if (resposta.status === 201) {
      Cenario.agendarLimpeza({ tipo: 'usuario', id: resposta.body._id });
    }
    return resposta;
  }),
);

/** GET /usuarios/{_id} */
Cypress.Commands.add('buscarUsuario', (id) =>
  cy.api({ method: 'GET', url: ENDPOINTS.USUARIO_POR_ID(id) }),
);

/** GET /usuarios?filtros */
Cypress.Commands.add('listarUsuarios', (filtros = {}) =>
  cy.api({ method: 'GET', url: ENDPOINTS.USUARIOS, qs: filtros }),
);

/** DELETE /usuarios/{_id} */
Cypress.Commands.add('excluirUsuario', (id, opcoes = {}) =>
  cy.api({ method: 'DELETE', url: ENDPOINTS.USUARIO_POR_ID(id), ...opcoes }),
);
