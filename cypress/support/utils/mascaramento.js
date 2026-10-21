const CABECALHOS_SENSIVEIS = new Set(['authorization', 'cookie', 'set-cookie']);
const CAMPOS_SENSIVEIS = new Set(['authorization']);

/**
 * Mantém o início do token (prova de que ele foi encadeado) e oculta o restante.
 * Valores curtos (ex.: o token inválido dos cenários negativos) ficam visíveis de propósito.
 */
export function mascararToken(valor) {
  if (typeof valor !== 'string' || valor.length < 40) return valor;
  const [esquema, token] = valor.includes(' ') ? valor.split(' ', 2) : ['', valor];
  const prefixo = esquema ? `${esquema} ` : '';
  return `${prefixo}${token.slice(0, 16)}…••••••[mascarado]`;
}

export function mascararCabecalhos(cabecalhos = {}) {
  return Object.fromEntries(
    Object.entries(cabecalhos).map(([nome, valor]) => [
      nome,
      CABECALHOS_SENSIVEIS.has(nome.toLowerCase()) ? mascararToken(String(valor)) : valor,
    ]),
  );
}

/** Mascara campos sensíveis em qualquer nível do corpo (ex.: "authorization" do /login). */
export function mascararCorpo(corpo) {
  if (Array.isArray(corpo)) return corpo.map(mascararCorpo);
  if (corpo && typeof corpo === 'object') {
    return Object.fromEntries(
      Object.entries(corpo).map(([chave, valor]) => [
        chave,
        CAMPOS_SENSIVEIS.has(chave.toLowerCase()) ? mascararToken(valor) : mascararCorpo(valor),
      ]),
    );
  }
  return corpo;
}
