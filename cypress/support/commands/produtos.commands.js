import { ENDPOINTS } from '../constants/endpoints';
import { Cenario } from '../contexto/Cenario';
import { comAutorizacao } from './api.commands';

/** POST /produtos — recebe um ProdutoPojo e o token (rota exclusiva para administradores). */
Cypress.Commands.add('cadastrarProduto', (produto, token) =>
  cy
    .api({
      method: 'POST',
      url: ENDPOINTS.PRODUTOS,
      body: produto.toJSON(),
      headers: comAutorizacao(token),
    })
    .then((resposta) => {
      if (resposta.status === 201) {
        Cenario.agendarLimpeza({ tipo: 'produto', id: resposta.body._id, token });
      }
      return resposta;
    }),
);

/** GET /produtos/{_id} */
Cypress.Commands.add('buscarProduto', (id, opcoes = {}) =>
  cy.api({ method: 'GET', url: ENDPOINTS.PRODUTO_POR_ID(id), ...opcoes }),
);

/** GET /produtos?filtros */
Cypress.Commands.add('listarProdutos', (filtros = {}) =>
  cy.api({ method: 'GET', url: ENDPOINTS.PRODUTOS, qs: filtros }),
);

/** DELETE /produtos/{_id} */
Cypress.Commands.add('excluirProduto', (id, token, opcoes = {}) =>
  cy.api({
    method: 'DELETE',
    url: ENDPOINTS.PRODUTO_POR_ID(id),
    headers: comAutorizacao(token),
    ...opcoes,
  }),
);
