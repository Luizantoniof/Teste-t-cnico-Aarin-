import { Cenario } from '../contexto/Cenario';

/**
 * Hooks globais (Mocha) — executam SEMPRE, inclusive quando um passo falha.
 * Os hooks After do Cucumber não rodam após falha, por isso a limpeza fica aqui.
 */
beforeEach('Reiniciar contexto do cenário', () => {
  Cenario.reiniciar();
});

/**
 * Remove a massa criada pelo cenário, respeitando as dependências da API:
 * carrinho (cancelado → devolve estoque) → produtos → usuários.
 * As chamadas não sobrescrevem a "última resposta" do cenário.
 */
afterEach('Limpar massa de dados do cenário', () => {
  const recursos = Cenario.recursosParaLimpeza();
  const doTipo = (tipo) => recursos.filter((recurso) => recurso.tipo === tipo);
  const apoio = { registrarResposta: false };

  doTipo('carrinho').forEach(({ token }) => cy.cancelarCompra(token, apoio));
  doTipo('produto').forEach(({ id, token }) => cy.excluirProduto(id, token, apoio));
  doTipo('usuario').forEach(({ id }) => cy.excluirUsuario(id, apoio));
});
