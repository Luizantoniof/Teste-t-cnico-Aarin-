import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import LoginPojo from '../pojo/LoginPojo';
import { Cenario, CHAVES } from '../contexto/Cenario';
import { decodificarJwt } from '../utils/dados';
import { resolverValor } from '../utils/placeholders';

When('eu realizo login com as credenciais do usuário cadastrado', () => {
  cy.login(Cenario.obter(CHAVES.USUARIO).paraLogin()).then((resposta) => {
    if (resposta.status === 200) Cenario.definir(CHAVES.TOKEN, resposta.body.authorization);
  });
});

When('eu realizo login com e-mail {string} e senha {string}', (email, senha) => {
  cy.login(new LoginPojo({ email: resolverValor(email), password: resolverValor(senha) }));
});

Then('o token retornado deve identificar o usuário autenticado', () => {
  const payload = decodificarJwt(Cenario.ultimaResposta.body.authorization);
  expect(payload.email, 'e-mail no payload do JWT').to.eq(Cenario.obter(CHAVES.USUARIO).email);
  expect(payload.iat, 'emissão (iat) não pode estar no futuro').to.be.at.most(
    Math.ceil(Date.now() / 1000) + 5,
  );
});

Then('o token retornado deve expirar em {int} segundos', (segundos) => {
  const { iat, exp } = decodificarJwt(Cenario.ultimaResposta.body.authorization);
  expect(exp - iat, 'validade do token (exp - iat)').to.eq(segundos);
});

Then('nenhum token deve ser retornado', () => {
  expect(Cenario.ultimaResposta.body).not.to.have.property('authorization');
});
