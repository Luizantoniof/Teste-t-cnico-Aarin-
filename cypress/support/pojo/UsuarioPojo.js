import PojoBase from './PojoBase';
import LoginPojo from './LoginPojo';

/** Payload de POST/PUT /usuarios. */
export default class UsuarioPojo extends PojoBase {
  #nome;
  #email;
  #password;
  #administrador;

  constructor({ nome, email, password, administrador } = {}) {
    super();
    this.#nome = nome;
    this.#email = email;
    this.#password = password;
    this.#administrador = administrador;
  }

  get nome() {
    return this.#nome;
  }

  set nome(valor) {
    this.#nome = valor;
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

  /** A API trafega o perfil como string: "true" | "false". */
  get administrador() {
    return this.#administrador;
  }

  set administrador(valor) {
    this.#administrador = valor;
  }

  get ehAdministrador() {
    return this.#administrador === 'true';
  }

  /** Credenciais de login derivadas do próprio usuário. */
  paraLogin() {
    return new LoginPojo({ email: this.#email, password: this.#password });
  }

  toJSON() {
    return PojoBase.semIndefinidos({
      nome: this.#nome,
      email: this.#email,
      password: this.#password,
      administrador: this.#administrador,
    });
  }
}
