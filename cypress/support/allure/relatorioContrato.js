import * as allure from 'allure-js-commons';

const escapar = (texto) =>
  String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

function linhasDeViolacao(violacoes) {
  return violacoes
    .map(
      (v, i) => `
      <tr>
        <td class="n">${i + 1}</td>
        <td><code>${escapar(v.caminho)}</code></td>
        <td><span class="regra">${escapar(v.regra)}</span></td>
        <td>${escapar(v.mensagem)}</td>
        <td><code>${v.recebido === undefined ? '—' : escapar(JSON.stringify(v.recebido))}</code></td>
      </tr>`,
    )
    .join('');
}

function montarHtml({ contrato, valido, violacoes }, status) {
  const cor = valido ? '#12805c' : '#c0262d';
  const fundo = valido ? '#e8f6f0' : '#fdecec';
  const titulo = valido
    ? 'Contrato respeitado'
    : `Contrato violado • ${violacoes.length} violação(ões)`;

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<style>
  :root { color-scheme: light; }
  body { font: 14px/1.5 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 16px; color: #1f2430; background: #fff; }
  .card { border: 1px solid #e3e6ec; border-radius: 10px; overflow: hidden; background: #fff; color: #1f2430; }
  .topo { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: ${fundo}; border-bottom: 1px solid #e3e6ec; }
  .selo { width: 30px; height: 30px; border-radius: 50%; background: ${cor}; color: #fff; display: grid; place-items: center; font-weight: 700; }
  .titulo { font-weight: 650; color: ${cor}; font-size: 15px; }
  .meta { color: #5b6272; font-size: 12.5px; }
  .meta code { background: #fff; border: 1px solid #e3e6ec; border-radius: 4px; padding: 1px 6px; }
  .corpo { padding: 14px 16px; background: #fff; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; color: #5b6272; font-weight: 600; border-bottom: 1px solid #e3e6ec; padding: 6px 8px; }
  td { border-bottom: 1px solid #f0f2f5; padding: 7px 8px; vertical-align: top; }
  td.n { color: #8a90a0; width: 24px; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12.5px; word-break: break-all; }
  .regra { background: #eef1f7; border-radius: 4px; padding: 1px 6px; font-size: 12px; }
  .ok { color: #3c4352; }
</style></head>
<body><div class="card">
  <div class="topo">
    <div class="selo">${valido ? '✓' : '!'}</div>
    <div>
      <div class="titulo">${titulo}</div>
      <div class="meta">Contrato <code>${escapar(contrato)}</code> • JSON Schema 2020-12 • HTTP ${status}</div>
    </div>
  </div>
  <div class="corpo">
    ${
      valido
        ? '<div class="ok">Todos os campos obrigatórios, tipos, formatos e restrições foram atendidos. Nenhum campo fora do contrato foi retornado.</div>'
        : `<table><thead><tr><th>#</th><th>Caminho</th><th>Regra</th><th>Violação</th><th>Valor recebido</th></tr></thead><tbody>${linhasDeViolacao(violacoes)}</tbody></table>`
    }
  </div>
</div></body></html>`;
}

/** Anexa o resultado da validação de contrato (HTML) e o schema utilizado (JSON) ao Allure. */
export function anexarRelatorioDeContrato(resultado, status) {
  const icone = resultado.valido ? '✅' : '❌';
  allure.attachment(`${icone} Contrato • ${resultado.contrato}`, montarHtml(resultado, status), {
    contentType: 'text/html',
    fileExtension: 'html',
  });
  allure.attachment(
    `JSON Schema • ${resultado.contrato}`,
    JSON.stringify(resultado.schema, null, 2),
    { contentType: 'application/json', fileExtension: 'json' },
  );
}
