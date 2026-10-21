import { Before, defineParameterType } from '@badeball/cypress-cucumber-preprocessor';
import { aplicarMetadadosAllure } from '../allure/metadadosCucumber';

/** {perfil} → true para administrador, false para usuário comum. */
defineParameterType({
  name: 'perfil',
  regexp: /administrador|comum/,
  transformer: (perfil) => perfil === 'administrador',
});

/** {autenticacao} → estratégia de token usada nos cenários negativos de segurança. */
defineParameterType({
  name: 'autenticacao',
  regexp: /token de usuário comum|token inválido|ausência de token/,
});

Before({ name: 'Publicar metadados do cenário no Allure' }, (cenario) => {
  aplicarMetadadosAllure(cenario);
});
