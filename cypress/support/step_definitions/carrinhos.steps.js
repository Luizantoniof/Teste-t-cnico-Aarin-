import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { Cenario, CHAVES } from '../contexto/Cenario';
import { CarrinhoFactory } from '../factories/CarrinhoFactory';
import { MENSAGENS } from '../constants/mensagens';
import { afirmarStatus } from '../utils/afirmacoes';

/** ID com formato válido, mas que não existe na base (garante o caminho "não encontrado"). */
const ID_INEXISTENTE = '0000000000000000';

const idDoProduto = (apelido) =>
  apelido === 'inexistente' ? ID_INEXISTENTE : Cenario.produto(apelido).id;

function criarCarrinho(carrinho) {
  Cenario.definir(CHAVES.CARRINHO_ENVIADO, carrinho);
  return cy.criarCarrinho(carrinho, Cenario.tokenDaRequisicao()).then((resposta) => {
    if (resposta.status === 201) Cenario.definir(CHAVES.CARRINHO_ID, resposta.body._id);
    return resposta;
  });
}

const carrinhoDaTabela = (tabela) =>
  CarrinhoFactory.comItens(
    tabela.hashes().map(({ apelido, quantidade }) => ({
      idProduto: idDoProduto(apelido),
      quantidade: Number(quantidade),
    })),
  );

const corpoDaResposta = () => Cenario.ultimaResposta.body;

// ---------- Ações ----------

When('eu adiciono ao carrinho os produtos:', (tabela) => {
  criarCarrinho(carrinhoDaTabela(tabela));
});

Given('que eu possuo um carrinho com os produtos:', (tabela) => {
  criarCarrinho(carrinhoDaTabela(tabela)).then((resposta) => {
    afirmarStatus(resposta, 201, 'pré-condição: carrinho criado');
  });
});

When(
  'eu tento criar um/outro carrinho com o produto {string} e quantidade {int}',
  (apelido, quantidade) => {
    criarCarrinho(CarrinhoFactory.comProduto(idDoProduto(apelido), quantidade));
  },
);

When('eu tento criar um carrinho com o produto {string} repetido', (apelido) => {
  const id = idDoProduto(apelido);
  criarCarrinho(
    CarrinhoFactory.comItens([
      { idProduto: id, quantidade: 1 },
      { idProduto: id, quantidade: 1 },
    ]),
  );
});

When('eu consulto o carrinho criado', () => {
  cy.buscarCarrinho(Cenario.obter(CHAVES.CARRINHO_ID));
});

When('eu busco o carrinho de id {string}', (id) => {
  cy.buscarCarrinho(id);
});

When('eu listo os carrinhos do usuário autenticado', () => {
  cy.listarCarrinhos({ idUsuario: Cenario.obter(CHAVES.USUARIO_ID) });
});

When('eu concluo a compra', () => {
  cy.concluirCompra(Cenario.tokenDaRequisicao());
});

When('eu cancelo a compra', () => {
  cy.cancelarCompra(Cenario.tokenDaRequisicao());
});

// ---------- Validações ----------

Then('o carrinho deve pertencer ao usuário autenticado', () => {
  expect(corpoDaResposta().idUsuario, 'dono do carrinho').to.eq(Cenario.obter(CHAVES.USUARIO_ID));
});

Then('o carrinho deve conter os produtos adicionados com seus preços unitários', () => {
  const enviados = Cenario.obter(CHAVES.CARRINHO_ENVIADO).produtos;
  const recebidos = corpoDaResposta().produtos;

  expect(recebidos, 'itens do carrinho').to.have.length(enviados.length);
  enviados.forEach(({ idProduto, quantidade }) => {
    const item = recebidos.find((recebido) => recebido.idProduto === idProduto);
    const { pojo } = Cenario.produtoPorId(idProduto);

    expect(item, `item ${idProduto} presente no carrinho`).to.exist;
    expect(item.quantidade, `quantidade do item ${idProduto}`).to.eq(quantidade);
    expect(item.precoUnitario, `preço unitário do item ${idProduto}`).to.eq(pojo.preco);
  });
});

Then('o preço total do carrinho deve ser {int}', (precoTotal) => {
  expect(corpoDaResposta().precoTotal, 'precoTotal').to.eq(precoTotal);
});

Then('a quantidade total do carrinho deve ser {int}', (quantidadeTotal) => {
  expect(corpoDaResposta().quantidadeTotal, 'quantidadeTotal').to.eq(quantidadeTotal);
});

Then('o preço total e a quantidade total devem corresponder aos itens do carrinho', () => {
  const { produtos, precoTotal, quantidadeTotal } = corpoDaResposta();
  const somaPrecos = produtos.reduce((soma, i) => soma + i.precoUnitario * i.quantidade, 0);
  const somaQuantidades = produtos.reduce((soma, i) => soma + i.quantidade, 0);

  expect(precoTotal, 'precoTotal = Σ(precoUnitario × quantidade)').to.eq(somaPrecos);
  expect(quantidadeTotal, 'quantidadeTotal = Σ(quantidade)').to.eq(somaQuantidades);
});

Then('a listagem deve conter somente o carrinho criado', () => {
  const { quantidade, carrinhos } = corpoDaResposta();

  expect(quantidade, 'campo "quantidade" coerente com a lista').to.eq(carrinhos.length);
  expect(carrinhos, 'carrinhos do usuário').to.have.length(1);
  expect(carrinhos[0]).to.include({
    _id: Cenario.obter(CHAVES.CARRINHO_ID),
    idUsuario: Cenario.obter(CHAVES.USUARIO_ID),
  });
});

Then('o carrinho não deve mais existir', () => {
  cy.buscarCarrinho(Cenario.obter(CHAVES.CARRINHO_ID), { registrarResposta: false }).then(
    (resposta) => {
      afirmarStatus(resposta, 400, 'consulta do carrinho encerrado');
      expect(resposta.body.message).to.eq(MENSAGENS.CARRINHO_NAO_ENCONTRADO);
    },
  );
});

Then('a resposta deve apontar o produto {string} como duplicado', (apelido) => {
  expect(corpoDaResposta().idProdutosDuplicados, 'produtos duplicados').to.deep.equal([
    idDoProduto(apelido),
  ]);
});

Then('a resposta deve referenciar o carrinho criado em {string}', (campo) => {
  const valor = corpoDaResposta()[campo];
  const idCarrinho = Cenario.obter(CHAVES.CARRINHO_ID);

  if (Array.isArray(valor)) expect(valor, campo).to.include(idCarrinho);
  else expect(valor, campo).to.eq(idCarrinho);
});
