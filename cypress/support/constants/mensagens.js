/** Mensagens de negócio retornadas pela API, centralizadas para evitar strings mágicas nos testes. */
export const MENSAGENS = Object.freeze({
  CADASTRO_SUCESSO: 'Cadastro realizado com sucesso',
  LOGIN_SUCESSO: 'Login realizado com sucesso',
  LOGIN_INVALIDO: 'Email e/ou senha inválidos',
  EXCLUSAO_SUCESSO: 'Registro excluído com sucesso',
  COMPRA_CANCELADA: 'Registro excluído com sucesso. Estoque dos produtos reabastecido',
  CARRINHO_NAO_ENCONTRADO_USUARIO: 'Não foi encontrado carrinho para esse usuário',
  CARRINHO_NAO_ENCONTRADO: 'Carrinho não encontrado',
  TOKEN_INVALIDO: 'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais',
  ROTA_ADMIN: 'Rota exclusiva para administradores',
});

/** Prefixo usado na massa de dados: facilita identificar (e limpar) o que a automação criou. */
export const PREFIXO_MASSA = 'QA-AUTO';
