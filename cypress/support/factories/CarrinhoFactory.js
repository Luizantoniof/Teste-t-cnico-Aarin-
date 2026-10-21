import CarrinhoPojo from '../pojo/CarrinhoPojo';

/** Fábrica de carrinhos a partir de pares { idProduto, quantidade }. */
export const CarrinhoFactory = Object.freeze({
  comItens: (itens) => new CarrinhoPojo({ produtos: itens }),
  comProduto: (idProduto, quantidade = 1) =>
    new CarrinhoPojo().adicionarItem(idProduto, quantidade),
});
