/**
 * Sufixo único por execução + sequência: evita colisão de e-mail/nome de produto
 * no ambiente público, onde outras pessoas criam dados ao mesmo tempo.
 */
let sequencia = 0;

export function identificadorUnico() {
  sequencia += 1;
  const tempo = Date.now().toString(36);
  const aleatorio = Math.random().toString(36).slice(2, 6);
  return `${tempo}${aleatorio}${sequencia}`;
}

/**
 * Converte valores vindos do Gherkin (sempre texto) para o tipo esperado pelo payload.
 * "10" → 10 | "-1" → -1 | "10.5" → 10.5 | "abc" → "abc"
 */
export function converterNumero(valor) {
  if (typeof valor !== 'string') return valor;
  return /^-?\d+(\.\d+)?$/.test(valor.trim()) ? Number(valor) : valor;
}

/** Decodifica o payload de um JWT ("Bearer <h>.<p>.<s>") sem validar assinatura. */
export function decodificarJwt(autorizacao) {
  const token = autorizacao.replace(/^Bearer\s+/i, '');
  const payload = token.split('.')[1];
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const preenchido = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return JSON.parse(atob(preenchido));
}
