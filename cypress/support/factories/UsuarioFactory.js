import { fakerPT_BR as faker } from '@faker-js/faker';
import UsuarioPojo from '../pojo/UsuarioPojo';
import { PREFIXO_MASSA } from '../constants/mensagens';
import { identificadorUnico } from '../utils/dados';

const DOMINIO_EMAIL = 'qa.serverest.dev';

function novoUsuario(sobrescritas = {}) {
  const primeiroNome = faker.person.firstName();
  const sobrenome = faker.person.lastName();
  const email = faker.internet
    .email({ firstName: primeiroNome, lastName: sobrenome, provider: DOMINIO_EMAIL })
    .toLowerCase()
    .replace('@', `.${identificadorUnico()}@`);

  return new UsuarioPojo({
    nome: `${PREFIXO_MASSA} ${primeiroNome} ${sobrenome}`,
    email,
    password: `Qa@${faker.internet.password({ length: 10 })}`,
    administrador: 'false',
    ...sobrescritas,
  });
}

/** Fábrica de usuários com dados realistas (pt-BR) e e-mail garantidamente único. */
export const UsuarioFactory = Object.freeze({
  administrador: (sobrescritas) => novoUsuario({ administrador: 'true', ...sobrescritas }),
  comum: (sobrescritas) => novoUsuario({ administrador: 'false', ...sobrescritas }),
  doPerfil: (ehAdministrador, sobrescritas) =>
    ehAdministrador
      ? UsuarioFactory.administrador(sobrescritas)
      : UsuarioFactory.comum(sobrescritas),
  emailUnico: () => novoUsuario().email,
});
