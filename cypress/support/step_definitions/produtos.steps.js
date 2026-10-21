import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { Cenario, CHAVES } from '../contexto/Cenario';
import { ProdutoFactory } from '../factories/ProdutoFactory';
import { afirmarStatus } from '../utils/afirmacoes';
import { converterNumero } from '../utils/dados';
import { resolverValor } from '../utils/placeholders';

const PRODUTO = 'produto';
const PRODUTO_ID = 'produtoId';

function cadastrarERegistrar(produto) {
  Cenario.definir(PRODUTO, produto);
  return cy.cadastrarProduto(produto, Cenario.tokenDaRequisicao()).then((resposta) => {
    if (resposta.status === 201) Cenario.definir(PRODUTO_ID, resposta.body._id);
    return resposta;
  });
}

/** Cadastra os produtos da tabela (apelido | preco | quantidade) e os publica no contexto. */
function cadastrarTabelaDeProdutos(tabela) {
  tabela.hashes().forEach(({ apelido, preco, quantidade }) => {
    const produto = ProdutoFactory.valido({ preco: Number(preco), quantidade: Number(quantidade) });

    cy.cadastrarProduto(produto, Cenario.obter(CHAVES.TOKEN)).then((resposta) => {
      afirmarStatus(resposta, 201, `cadastro do produto "${apelido}"`);
      Cenario.registrarProduto(apelido, { pojo: produto, id: resposta.body._id });
    });
  });
}

Given('que os seguintes produtos estão cadastrados:', cadastrarTabelaDeProdutos);
When('eu cadastro os seguintes produtos:', cadastrarTabelaDeProdutos);

When('eu cadastro um novo produto', () => {
  cadastrarERegistrar(ProdutoFactory.valido());
});

When('eu tento cadastrar um novo produto', () => {
  cadastrarERegistrar(ProdutoFactory.valido());
});

Given('que existe um produto cadastrado', () => {
  cadastrarERegistrar(ProdutoFactory.valido()).then((resposta) => {
    afirmarStatus(resposta, 201, 'pré-condição: produto cadastrado');
  });
});

When('eu tento cadastrar outro produto com o mesmo nome', () => {
  const existente = Cenario.obter(PRODUTO);
  cy.cadastrarProduto(ProdutoFactory.valido({ nome: existente.nome }), Cenario.obter(CHAVES.TOKEN));
});

When('eu tento cadastrar um produto com o campo {string} igual a {string}', (campo, valor) => {
  const produto = ProdutoFactory.valido().definir(campo, converterNumero(resolverValor(valor)));
  cy.cadastrarProduto(produto, Cenario.obter(CHAVES.TOKEN));
});

When('eu tento excluir o produto {string}', (apelido) => {
  cy.excluirProduto(Cenario.produto(apelido).id, Cenario.obter(CHAVES.TOKEN));
});

Then('o produto deve estar persistido com os mesmos dados enviados', () => {
  const enviado = Cenario.obter(PRODUTO);
  const id = Cenario.obter(PRODUTO_ID);

  cy.buscarProduto(id)
    .validarContrato('produtos/detalhe')
    .then(({ status, body }) => {
      afirmarStatus({ status, body }, 200, 'GET /produtos/{_id}');
      expect(body, 'produto persistido').to.deep.equal({ ...enviado.toJSON(), _id: id });
    });
});

When('eu listo os produtos filtrando pelo nome cadastrado', () => {
  cy.listarProdutos({ nome: Cenario.obter(PRODUTO).nome });
});

Then('a listagem deve conter somente o produto cadastrado', () => {
  const { body } = Cenario.ultimaResposta;
  const enviado = Cenario.obter(PRODUTO);

  expect(body.quantidade, 'campo "quantidade" coerente com a lista').to.eq(body.produtos.length);
  expect(body.produtos, 'produtos retornados pelo filtro').to.have.length(1);
  expect(body.produtos[0]).to.deep.equal({ ...enviado.toJSON(), _id: Cenario.obter(PRODUTO_ID) });
});

/** Consulta de apoio: não sobrescreve a "última resposta" que os próximos passos validam. */
Then('o estoque do produto {string} deve ser {int}', (apelido, estoqueEsperado) => {
  cy.buscarProduto(Cenario.produto(apelido).id, { registrarResposta: false }).then((resposta) => {
    afirmarStatus(resposta, 200, `consulta de estoque do produto "${apelido}"`);
    expect(resposta.body.quantidade, `estoque do produto "${apelido}"`).to.eq(estoqueEsperado);
  });
});
