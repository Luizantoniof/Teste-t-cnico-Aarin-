import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { Cenario, CHAVES } from '../contexto/Cenario';
import { UsuarioFactory } from '../factories/UsuarioFactory';
import { afirmarStatus } from '../utils/afirmacoes';
import { resolverValor } from '../utils/placeholders';

function cadastrarERegistrar(usuario) {
  Cenario.definir(CHAVES.USUARIO, usuario);
  return cy.cadastrarUsuario(usuario).then((resposta) => {
    if (resposta.status === 201) Cenario.definir(CHAVES.USUARIO_ID, resposta.body._id);
    return resposta;
  });
}

When('eu cadastro um novo usuário {perfil}', (ehAdministrador) => {
  cadastrarERegistrar(UsuarioFactory.doPerfil(ehAdministrador));
});

Given('que existe um usuário {perfil} cadastrado', (ehAdministrador) => {
  cadastrarERegistrar(UsuarioFactory.doPerfil(ehAdministrador)).then((resposta) => {
    afirmarStatus(resposta, 201, 'pré-condição: usuário cadastrado');
  });
});

Given('que existe um usuário {perfil} cadastrado e autenticado', (ehAdministrador) => {
  cy.prepararUsuarioAutenticado(ehAdministrador);
});

When('eu tento cadastrar outro usuário com o mesmo e-mail', () => {
  const existente = Cenario.obter(CHAVES.USUARIO);
  cy.cadastrarUsuario(UsuarioFactory.comum({ email: existente.email }));
});

When('eu tento cadastrar um usuário com o campo {string} igual a {string}', (campo, valor) => {
  const usuario = UsuarioFactory.comum().definir(campo, resolverValor(valor));
  cy.cadastrarUsuario(usuario);
});

When('eu listo os usuários filtrando pelo e-mail cadastrado', () => {
  cy.listarUsuarios({ email: Cenario.obter(CHAVES.USUARIO).email });
});

When('eu busco o usuário de id {string}', (id) => {
  cy.buscarUsuario(id);
});

When('eu tento excluir o usuário autenticado', () => {
  cy.excluirUsuario(Cenario.obter(CHAVES.USUARIO_ID));
});

Then('o usuário deve estar persistido com os mesmos dados enviados', () => {
  const enviado = Cenario.obter(CHAVES.USUARIO);
  const id = Cenario.obter(CHAVES.USUARIO_ID);

  cy.buscarUsuario(id)
    .validarContrato('usuarios/detalhe')
    .then(({ status, body }) => {
      afirmarStatus({ status, body }, 200, 'GET /usuarios/{_id}');
      expect(body, 'usuário persistido').to.deep.equal({ ...enviado.toJSON(), _id: id });
    });
});

Then('a listagem deve conter somente o usuário cadastrado', () => {
  const { body } = Cenario.ultimaResposta;
  const esperado = Cenario.obter(CHAVES.USUARIO);

  expect(body.quantidade, 'campo "quantidade" coerente com a lista').to.eq(body.usuarios.length);
  expect(body.usuarios, 'usuários retornados pelo filtro').to.have.length(1);
  expect(body.usuarios[0]).to.include({
    _id: Cenario.obter(CHAVES.USUARIO_ID),
    email: esperado.email,
    nome: esperado.nome,
  });
});
