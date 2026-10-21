import { descreverViolacoes, validarContrato } from './validadorDeContrato';

/**
 * Asserção Chai customizada para uso direto no código:
 *   expect(resposta.body).to.respeitarContrato('carrinhos/detalhe')
 * Em caso de falha, a mensagem lista cada violação com caminho, regra e valor recebido.
 */
chai.use((_chai) => {
  _chai.Assertion.addMethod('respeitarContrato', function respeitarContrato(nomeContrato) {
    const { valido, violacoes } = validarContrato(nomeContrato, this._obj);

    // O Cypress exibe a mensagem positiva também quando a asserção passa: ela precisa fazer sentido nos dois casos.
    const mensagem = valido
      ? `resposta respeita o contrato "${nomeContrato}" (JSON Schema)`
      : `esperado que a resposta respeitasse o contrato "${nomeContrato}", ` +
        `mas foram encontradas ${violacoes.length} violação(ões):\n${descreverViolacoes(violacoes)}`;

    this.assert(
      valido,
      mensagem,
      `esperado que a resposta NÃO respeitasse o contrato "${nomeContrato}"`,
    );
  });
});
