import PojoBase from './PojoBase';

/** Payload de POST /login. */
export default class LoginPojo extends PojoBase {
  #email;
  #password;

  constructor({ email, password } = {}) {
    super();
    this.#email = email;
    this.#password = password;
  }

  get email() {
    return this.#email;
  }

  set email(valor) {
    this.#email = valor;
  }

  get password() {
    return this.#password;
  }

  set password(valor) {
    this.#password = valor;
  }

  toJSON() {
    return PojoBase.semIndefinidos({ email: this.#email, password: this.#password });
  }
}
