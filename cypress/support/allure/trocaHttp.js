import * as allure from 'allure-js-commons';
import { mascararCabecalhos, mascararCorpo } from '../utils/mascaramento';

/** Tipo nativo do Allure 3 que renderiza request/response em abas (headers, query, body, status). */
const TIPO_TROCA_HTTP = 'application/vnd.allure.http+json';

const paraPares = (objeto = {}) =>
  Object.entries(objeto ?? {}).map(([name, value]) => ({
    name,
    value: Array.isArray(value) ? value.join(', ') : String(value),
  }));

function corpo(conteudo, tipo = 'application/json') {
  if (conteudo === undefined || conteudo === null || conteudo === '') return undefined;
  const valor = typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo, null, 2);
  return { contentType: tipo, encoding: 'utf8', value: valor, size: new Blob([valor]).size };
}

function aspasSimples(texto) {
  return `'${String(texto).replaceAll("'", "'\\''")}'`;
}

/** cURL pronto para reproduzir a chamada fora da automação (token substituído por $TOKEN). */
function gerarCurl({ method, url, headers, body }) {
  const linhas = [`curl --request ${method} ${aspasSimples(url)}`];
  Object.entries(headers).forEach(([nome, valor]) => {
    const valorSeguro = nome.toLowerCase() === 'authorization' ? '$TOKEN' : valor;
    linhas.push(`--header ${aspasSimples(`${nome}: ${valorSeguro}`)}`);
  });
  if (body !== undefined) {
    linhas.push(`--header 'Content-Type: application/json'`);
    linhas.push(`--data-raw ${aspasSimples(JSON.stringify(body))}`);
  }
  return linhas.join(' \\\n  ');
}

/**
 * Anexa a troca HTTP completa ao passo corrente do Allure:
 *  1) "HTTP Exchange" nativo (visual rico de request/response);
 *  2) cURL para reprodução manual.
 * Usa os headers efetivamente enviados (allRequestResponses), não apenas os informados no teste.
 */
export function anexarTrocaHttp({ requisicao, resposta, inicio, fim }) {
  const enviada = resposta.allRequestResponses?.at(-1) ?? {};
  const url = enviada['Request URL'] ?? new URL(requisicao.url, Cypress.config('baseUrl')).href;
  const caminho = new URL(url).pathname;

  const troca = {
    start: inicio,
    stop: fim,
    request: {
      method: requisicao.method,
      url,
      httpVersion: 'HTTP/1.1',
      headers: paraPares(mascararCabecalhos(enviada['Request Headers'] ?? requisicao.headers)),
      query: paraPares(requisicao.qs),
      body: corpo(requisicao.body),
    },
    response: {
      status: resposta.status,
      statusText: resposta.statusText,
      httpVersion: 'HTTP/1.1',
      headers: paraPares(resposta.headers),
      body: corpo(mascararCorpo(resposta.body), resposta.headers?.['content-type']),
    },
  };

  const titulo = `${requisicao.method} ${caminho} → ${resposta.status} ${resposta.statusText ?? ''} • ${resposta.duration} ms`;
  allure.attachment(titulo, JSON.stringify(troca), {
    contentType: TIPO_TROCA_HTTP,
    fileExtension: 'json',
  });
  allure.attachment(
    `cURL • ${requisicao.method} ${caminho}`,
    gerarCurl({
      method: requisicao.method,
      url,
      headers: requisicao.headers,
      body: requisicao.body,
    }),
    { contentType: 'text/plain', fileExtension: 'sh' },
  );
}
