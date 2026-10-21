import PojoBase from './PojoBase';

/** Payload de POST/PUT /produtos. Preço e quantidade são inteiros na ServeRest. */
export default class ProdutoPojo extends PojoBase {
  #nome;
  #preco;
  #descricao;
  #quantidade;

  constructor({ nome, preco, descricao, quantidade } = {}) {
    super();
    this.#nome = nome;
    this.#preco = preco;
    this.#descricao = descricao;
    this.#quantidade = quantidade;
  }

  get nome() {
    return this.#nome;
  }

  set nome(valor) {
    this.#nome = valor;
  }

  get preco() {
    return this.#preco;
  }

  set preco(valor) {
    this.#preco = valor;
  }

  get descricao() {
    return this.#descricao;
  }

  set descricao(valor) {
    this.#descricao = valor;
  }

  get quantidade() {
    return this.#quantidade;
  }

  set quantidade(valor) {
    this.#quantidade = valor;
  }

  toJSON() {
    return PojoBase.semIndefinidos({
      nome: this.#nome,
      preco: this.#preco,
      descricao: this.#descricao,
      quantidade: this.#quantidade,
    });
  }
}
