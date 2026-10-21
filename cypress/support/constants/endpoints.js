/** Rotas da API ServeRest. A baseUrl vem do cypress.config.js (variável BASE_URL). */
export const ENDPOINTS = Object.freeze({
  LOGIN: '/login',
  USUARIOS: '/usuarios',
  USUARIO_POR_ID: (id) => `/usuarios/${id}`,
  PRODUTOS: '/produtos',
  PRODUTO_POR_ID: (id) => `/produtos/${id}`,
  CARRINHOS: '/carrinhos',
  CARRINHO_POR_ID: (id) => `/carrinhos/${id}`,
  CONCLUIR_COMPRA: '/carrinhos/concluir-compra',
  CANCELAR_COMPRA: '/carrinhos/cancelar-compra',
});
