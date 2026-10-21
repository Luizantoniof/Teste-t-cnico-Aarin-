import { Given, Then } from '@badeball/cypress-cucumber-preprocessor';
import { Cenario, CHAVES } from '../contexto/Cenario';
import { afirmarStatus } from '../utils/afirmacoes';

const TOKEN_INVALIDO = 'Bearer token.invalido.qa';

Then('o status da resposta deve ser {int}', (statusEsperado) => {
  afirmarStatus(Cenario.ultimaResposta, statusEsperado);
});

Then('a mensagem da resposta deve ser {string}', (mensagem) => {
  expect(Cenario.ultimaResposta.body, 'corpo da resposta').to.have.property('message', mensagem);
});

Then('a resposta deve respeitar o contrato {string}', (contrato) => {
  const { headers } = Cenario.ultimaResposta;
  expect(headers['content-type'], 'Content-Type da resposta').to.include('application/json');
  cy.validarContrato(contrato);
});

Then('o campo {string} da resposta deve conter {string}', (campo, mensagem) => {
  expect(Cenario.ultimaResposta.body, `mensagem de validação do campo "${campo}"`).to.have.property(
    campo,
    mensagem,
  );
});

Then('o tempo de resposta deve estar dentro do SLA', () => {
  const sla = Cypress.expose('slaRespostaMs');
  expect(Cenario.ultimaResposta.duration, `tempo de resposta (SLA ${sla} ms)`).to.be.lessThan(sla);
});

/**
 * Força a estratégia de autenticação das próximas requisições protegidas.
 * "token de usuário comum" cria um segundo usuário (não administrador) só para obter o token.
 */
Given('que as próximas requisições serão enviadas com {autenticacao}', (autenticacao) => {
  if (autenticacao === 'ausência de token') {
    Cenario.definir(CHAVES.AUTORIZACAO_FORCADA, null);
  } else if (autenticacao === 'token inválido') {
    Cenario.definir(CHAVES.AUTORIZACAO_FORCADA, TOKEN_INVALIDO);
  } else {
    cy.criarUsuarioAutenticado(false).then(({ token }) => {
      Cenario.definir(CHAVES.AUTORIZACAO_FORCADA, token);
    });
  }
});
