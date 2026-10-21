import { Cenario } from '../contexto/Cenario';
import { validarContrato } from '../validators/validadorDeContrato';
import { anexarRelatorioDeContrato } from '../allure/relatorioContrato';

/**
 * Valida o corpo da resposta contra um contrato JSON Schema.
 *   cy.validarContrato('carrinhos/detalhe')              → usa a última resposta do cenário
 *   cy.buscarCarrinho(id).validarContrato('carrinhos/detalhe') → usa a resposta encadeada
 * Anexa ao Allure o relatório da validação (HTML) e o schema aplicado.
 */
Cypress.Commands.add('validarContrato', { prevSubject: 'optional' }, (anterior, nomeContrato) => {
  const resposta = anterior ?? Cenario.ultimaResposta;
  const resultado = validarContrato(nomeContrato, resposta.body);

  anexarRelatorioDeContrato(resultado, resposta.status);
  expect(resposta.body).to.respeitarContrato(nomeContrato);
  return cy.wrap(resposta, { log: false });
});
