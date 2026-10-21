import { ENDPOINTS } from '../constants/endpoints';
import { Cenario } from '../contexto/Cenario';
import { comAutorizacao } from './api.commands';

/** POST /carrinhos — recebe um CarrinhoPojo. O carrinho pertence ao dono do token. */
Cypress.Commands.add('criarCarrinho', (carrinho, token) =>
  cy
    .api({
      method: 'POST',
      url: ENDPOINTS.CARRINHOS,
      body: carrinho.toJSON(),
      headers: comAutorizacao(token),
    })
    .then((resposta) => {
      if (resposta.status === 201) {
        Cenario.agendarLimpeza({ tipo: 'carrinho', id: resposta.body._id, token });
      }
      return resposta;
    }),
);

/** GET /carrinhos/{_id} */
Cypress.Commands.add('buscarCarrinho', (id, opcoes = {}) =>
  cy.api({ method: 'GET', url: ENDPOINTS.CARRINHO_POR_ID(id), ...opcoes }),
);

/** GET /carrinhos?filtros (ex.: { idUsuario }) */
Cypress.Commands.add('listarCarrinhos', (filtros = {}) =>
  cy.api({ method: 'GET', url: ENDPOINTS.CARRINHOS, qs: filtros }),
);

/** DELETE /carrinhos/concluir-compra — exclui o carrinho do usuário SEM devolver estoque. */
Cypress.Commands.add('concluirCompra', (token, opcoes = {}) =>
  cy.api({
    method: 'DELETE',
    url: ENDPOINTS.CONCLUIR_COMPRA,
    headers: comAutorizacao(token),
    ...opcoes,
  }),
);

/** DELETE /carrinhos/cancelar-compra — exclui o carrinho do usuário e DEVOLVE o estoque. */
Cypress.Commands.add('cancelarCompra', (token, opcoes = {}) =>
  cy.api({
    method: 'DELETE',
    url: ENDPOINTS.CANCELAR_COMPRA,
    headers: comAutorizacao(token),
    ...opcoes,
  }),
);
