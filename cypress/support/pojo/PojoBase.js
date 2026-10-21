/**
 * Base dos POJOs (Plain Old JavaScript Objects) que modelam os payloads da API.
 *
 * Cada POJO encapsula seus campos (privados) com getters/setters e expõe `toJSON()`,
 * que é o que efetivamente vai no corpo da requisição. Campos `undefined` são omitidos,
 * o que permite simular "campo ausente" nos cenários negativos sem montar JSON na mão.
 */
export default class PojoBase {
  /** Altera um campo pelo nome, via setter (útil em cenários data-driven / Esquema do Cenário). */
  definir(campo, valor) {
    if (!(campo in this)) {
      throw new Error(`O campo "${campo}" não existe em ${this.constructor.name}`);
    }
    this[campo] = valor;
    return this;
  }

  /** Remove o campo do payload (simula campo ausente). */
  remover(campo) {
    return this.definir(campo, undefined);
  }

  clonar() {
    return new this.constructor(this.toJSON());
  }

  toJSON() {
    throw new Error(`${this.constructor.name} deve implementar toJSON()`);
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }

  static semIndefinidos(objeto) {
    return Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor !== undefined));
  }
}
