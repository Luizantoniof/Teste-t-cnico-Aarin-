/**
 * Contexto do cenário (o "World" do Cucumber).
 *
 * É o mecanismo de encadeamento de dados entre os passos: o token gerado no login,
 * os IDs de usuário/produtos/carrinho e a última resposta HTTP ficam aqui para serem
 * consumidos pelos passos seguintes. É reiniciado antes de cada cenário, garantindo
 * isolamento total entre testes (ver hooks/ciclo-de-vida.js).
 *
 * O Cypress empacota o support file e cada spec em bundles SEPARADOS: se o estado
 * vivesse no módulo, commands e steps enxergariam cópias diferentes. Por isso ele fica
 * em um singleton global (Symbol.for), compartilhado pelos dois bundles.
 */
export const CHAVES = Object.freeze({
  USUARIO: 'usuario',
  USUARIO_ID: 'usuarioId',
  TOKEN: 'token',
  CARRINHO_ID: 'carrinhoId',
  CARRINHO_ENVIADO: 'carrinhoEnviado',
  AUTORIZACAO_FORCADA: 'autorizacaoForcada',
});

const novoEstado = () => ({
  dados: new Map(),
  produtos: new Map(),
  ultimaResposta: null,
  limpeza: [],
});

const CHAVE_GLOBAL = Symbol.for('serverest.qa.cenario');
const estado = () => (globalThis[CHAVE_GLOBAL] ??= novoEstado());

export const Cenario = {
  reiniciar() {
    globalThis[CHAVE_GLOBAL] = novoEstado();
  },

  definir(chave, valor) {
    estado().dados.set(chave, valor);
    return valor;
  },

  obter(chave) {
    if (!estado().dados.has(chave)) {
      throw new Error(
        `"${chave}" não existe no contexto do cenário. ` +
          'Verifique se o passo que produz esse dado foi executado antes.',
      );
    }
    return estado().dados.get(chave);
  },

  possui(chave) {
    return estado().dados.has(chave);
  },

  /** Token a ser enviado: o forçado pelo cenário (negativos de autenticação) ou o do login. */
  tokenDaRequisicao() {
    if (estado().dados.has(CHAVES.AUTORIZACAO_FORCADA)) {
      return estado().dados.get(CHAVES.AUTORIZACAO_FORCADA);
    }
    return Cenario.obter(CHAVES.TOKEN);
  },

  registrarResposta(resposta) {
    estado().ultimaResposta = resposta;
  },

  get ultimaResposta() {
    if (!estado().ultimaResposta) {
      throw new Error('Nenhuma requisição foi executada neste cenário até o momento.');
    }
    return estado().ultimaResposta;
  },

  /** Produtos são referenciados por apelido no Gherkin ("notebook", "mouse"...). */
  registrarProduto(apelido, produto) {
    estado().produtos.set(apelido, produto);
  },

  produto(apelido) {
    if (!estado().produtos.has(apelido)) {
      const conhecidos = [...estado().produtos.keys()].join(', ') || 'nenhum';
      throw new Error(
        `Produto "${apelido}" não cadastrado neste cenário (conhecidos: ${conhecidos}).`,
      );
    }
    return estado().produtos.get(apelido);
  },

  produtoPorId(id) {
    const encontrado = [...estado().produtos.values()].find((produto) => produto.id === id);
    if (!encontrado) throw new Error(`Produto de id "${id}" não cadastrado neste cenário.`);
    return encontrado;
  },

  /** Registra um recurso criado para ser removido ao final do cenário. */
  agendarLimpeza(recurso) {
    estado().limpeza.push(recurso);
  },

  recursosParaLimpeza() {
    return [...estado().limpeza];
  },
};
