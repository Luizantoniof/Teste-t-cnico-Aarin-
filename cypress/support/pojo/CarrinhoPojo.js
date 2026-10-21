import PojoBase from './PojoBase';

/** Item do carrinho: referência a um produto e a quantidade desejada. */
export class ItemCarrinhoPojo extends PojoBase {
  #idProduto;
  #quantidade;

  constructor({ idProduto, quantidade } = {}) {
    super();
    this.#idProduto = idProduto;
    this.#quantidade = quantidade;
  }

  get idProduto() {
    return this.#idProduto;
  }

  set idProduto(valor) {
    this.#idProduto = valor;
  }

  get quantidade() {
    return this.#quantidade;
  }

  set quantidade(valor) {
    this.#quantidade = valor;
  }

  toJSON() {
    return PojoBase.semIndefinidos({ idProduto: this.#idProduto, quantidade: this.#quantidade });
  }
}

/** Payload de POST /carrinhos. */
export default class CarrinhoPojo extends PojoBase {
  #produtos;

  constructor({ produtos = [] } = {}) {
    super();
    this.#produtos = produtos.map((item) =>
      item instanceof ItemCarrinhoPojo ? item : new ItemCarrinhoPojo(item),
    );
  }

  get produtos() {
    return [...this.#produtos];
  }

  set produtos(itens) {
    this.#produtos = itens;
  }

  adicionarItem(idProduto, quantidade) {
    this.#produtos.push(new ItemCarrinhoPojo({ idProduto, quantidade }));
    return this;
  }

  get quantidadeTotal() {
    return this.#produtos.reduce((total, item) => total + item.quantidade, 0);
  }

  toJSON() {
    return { produtos: this.#produtos.map((item) => item.toJSON()) };
  }
}
