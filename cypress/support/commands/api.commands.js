import { Cenario } from '../contexto/Cenario';
import { anexarTrocaHttp } from '../allure/trocaHttp';

/** Monta o header Authorization; `null`/`undefined` = requisição sem token (cenários negativos). */
export const comAutorizacao = (token) => (token ? { Authorization: token } : {});

/**
 * Comando base de toda requisição da suíte. Os commands de domínio (usuários, login,
 * produtos, carrinhos) apenas descrevem a request e delegam para cá, o que garante:
 *  - failOnStatusCode desligado: o status é sempre validado explicitamente nos passos;
 *  - a resposta fica registrada no contexto do cenário (encadeamento entre passos);
 *  - anexo "HTTP Exchange" + cURL no Allure, com o token mascarado;
 *  - um grupo legível no Command Log ("POST /usuarios → 201 Created (312 ms)").
 *
 * @param {object} requisicao
 * @param {'GET'|'POST'|'PUT'|'DELETE'} requisicao.method
 * @param {string} requisicao.url        caminho relativo à baseUrl
 * @param {object} [requisicao.body]
 * @param {object} [requisicao.qs]       query string
 * @param {object} [requisicao.headers]
 * @param {boolean} [requisicao.registrarResposta=true] false para chamadas de apoio (ex.: limpeza)
 */
Cypress.Commands.add('api', (requisicao) => {
  const { method = 'GET', url, body, qs, headers = {}, registrarResposta = true } = requisicao;
  const query = qs && Object.keys(qs).length ? `?${new URLSearchParams(qs)}` : '';
  let resposta;

  const grupo = Cypress.log({
    name: method,
    message: `${url}${query}`,
    type: 'parent',
    groupStart: true,
    // Resumo curto: vira parâmetro do passo no Allure (o detalhe completo fica no anexo HTTP).
    consoleProps: () => ({
      Endpoint: `${method} ${url}${query}`,
      Status: resposta ? `${resposta.status} ${resposta.statusText ?? ''}`.trim() : 'sem resposta',
      'Tempo (ms)': resposta?.duration,
    }),
  });

  const inicio = Date.now();
  return cy
    .request({ method, url, body, qs, headers, failOnStatusCode: false, log: false })
    .then((recebida) => {
      resposta = recebida;
      anexarTrocaHttp({
        requisicao: { method, url, body, qs, headers },
        resposta: recebida,
        inicio,
        fim: Date.now(),
      });
      grupo.set('message', `${url}${query} → ${recebida.status} (${recebida.duration} ms)`);
      grupo.endGroup();

      if (registrarResposta) Cenario.registrarResposta(recebida);
      return recebida;
    });
});
