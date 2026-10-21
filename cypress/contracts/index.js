/**
 * Registro central dos contratos (JSON Schema draft 2020-12).
 * Para criar um contrato novo: adicione o arquivo *.schema.json e importe-o aqui.
 * Nos testes, o contrato é referenciado pelo nome curto, ex.: "carrinhos/detalhe".
 */
import definicoes from './definicoes.schema.json';
import mensagem from './comum/mensagem.schema.json';
import cadastroSucesso from './comum/cadastro-sucesso.schema.json';
import errosValidacao from './comum/erros-validacao.schema.json';
import usuarioDetalhe from './usuarios/detalhe.schema.json';
import usuarioListagem from './usuarios/listagem.schema.json';
import usuarioExclusaoBloqueada from './usuarios/exclusao-bloqueada.schema.json';
import loginSucesso from './login/sucesso.schema.json';
import produtoDetalhe from './produtos/detalhe.schema.json';
import produtoListagem from './produtos/listagem.schema.json';
import produtoExclusaoBloqueada from './produtos/exclusao-bloqueada.schema.json';
import carrinhoDetalhe from './carrinhos/detalhe.schema.json';
import carrinhoListagem from './carrinhos/listagem.schema.json';
import carrinhoErroItem from './carrinhos/erro-item.schema.json';
import carrinhoErroDuplicado from './carrinhos/erro-produto-duplicado.schema.json';

export const URI_BASE_CONTRATOS = 'https://contratos.serverest.local/';

export const CONTRATOS = [
  definicoes,
  mensagem,
  cadastroSucesso,
  errosValidacao,
  usuarioDetalhe,
  usuarioListagem,
  usuarioExclusaoBloqueada,
  loginSucesso,
  produtoDetalhe,
  produtoListagem,
  produtoExclusaoBloqueada,
  carrinhoDetalhe,
  carrinhoListagem,
  carrinhoErroItem,
  carrinhoErroDuplicado,
];

/** "carrinhos/detalhe" → "https://contratos.serverest.local/carrinhos/detalhe.schema.json" */
export const idDoContrato = (nomeCurto) => `${URI_BASE_CONTRATOS}${nomeCurto}.schema.json`;

/** Caminho inverso, usado nas mensagens de erro e no relatório. */
export const nomeCurtoDoContrato = (id) =>
  id.replace(URI_BASE_CONTRATOS, '').replace('.schema.json', '');
