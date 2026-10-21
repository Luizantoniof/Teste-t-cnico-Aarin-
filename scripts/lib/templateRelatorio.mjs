// Template HTML do relatório executivo (renderizado em PDF pelo Puppeteer).
import { formatarDuracao } from './resultadosAllure.mjs';

const STATUS = {
  passed: { rotulo: 'Aprovado', cor: '#16a34a', fundo: '#dcfce7' },
  failed: { rotulo: 'Falhou', cor: '#dc2626', fundo: '#fee2e2' },
  broken: { rotulo: 'Quebrado', cor: '#d97706', fundo: '#fef3c7' },
  skipped: { rotulo: 'Ignorado', cor: '#64748b', fundo: '#e2e8f0' },
  unknown: { rotulo: 'Desconhecido', cor: '#7c3aed', fundo: '#ede9fe' },
};

const SEVERIDADES = {
  blocker: 'Bloqueador',
  critical: 'Crítico',
  normal: 'Normal',
  minor: 'Menor',
  trivial: 'Trivial',
};

const METODOS = {
  GET: '#2563eb',
  POST: '#16a34a',
  PUT: '#d97706',
  PATCH: '#7c3aed',
  DELETE: '#dc2626',
};

const esc = (texto) =>
  String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const pct = (valor) => `${valor.toFixed(1).replace('.', ',')}%`;

function rosca(indicadores) {
  const fatias = [
    ['passed', indicadores.aprovados],
    ['failed', indicadores.falhados],
    ['broken', indicadores.quebrados],
    ['skipped', indicadores.ignorados],
  ].filter(([, valor]) => valor > 0);

  const raio = 54;
  const circunferencia = 2 * Math.PI * raio;
  let deslocamento = 0;
  const arcos = fatias
    .map(([status, valor]) => {
      const tamanho = (valor / indicadores.total) * circunferencia;
      const arco = `<circle r="${raio}" cx="70" cy="70" fill="none" stroke="${STATUS[status].cor}" stroke-width="18"
        stroke-dasharray="${tamanho} ${circunferencia - tamanho}" stroke-dashoffset="${-deslocamento}" />`;
      deslocamento += tamanho;
      return arco;
    })
    .join('');

  return `<svg viewBox="0 0 140 140" class="rosca" role="img" aria-label="Distribuição de status">
    <circle r="${raio}" cx="70" cy="70" fill="none" stroke="#eef2f7" stroke-width="18" />
    <g transform="rotate(-90 70 70)">${arcos}</g>
    <text x="70" y="66" text-anchor="middle" class="rosca-valor">${pct(indicadores.taxaSucesso)}</text>
    <text x="70" y="84" text-anchor="middle" class="rosca-rotulo">de sucesso</text>
  </svg>`;
}

function legenda(indicadores) {
  return [
    ['passed', indicadores.aprovados],
    ['failed', indicadores.falhados],
    ['broken', indicadores.quebrados],
    ['skipped', indicadores.ignorados],
  ]
    .map(
      ([status, valor]) => `<li><span class="ponto" style="background:${STATUS[status].cor}"></span>
        ${STATUS[status].rotulo}<strong>${valor}</strong></li>`,
    )
    .join('');
}

function barrasPorFuncionalidade(funcionalidades) {
  return funcionalidades
    .map((f) => {
      const segmento = (status) =>
        f[status]
          ? `<span style="width:${(f[status] / f.total) * 100}%;background:${STATUS[status].cor}"></span>`
          : '';
      const taxa = (f.passed / f.total) * 100;
      return `<div class="barra-linha">
        <div class="barra-nome">${esc(f.nome)}</div>
        <div class="barra">${segmento('passed')}${segmento('failed')}${segmento('broken')}${segmento('skipped')}</div>
        <div class="barra-num">${f.passed}/${f.total}</div>
        <div class="barra-taxa ${taxa === 100 ? 'ok' : 'nok'}">${pct(taxa)}</div>
      </div>`;
    })
    .join('');
}

function tabelaEndpoints(endpoints) {
  const linhas = endpoints
    .map(
      (e) => `<tr>
        <td><span class="metodo" style="background:${METODOS[e.metodo] ?? '#475569'}">${e.metodo}</span></td>
        <td class="mono">${esc(e.caminho)}</td>
        <td class="num">${e.chamadas}</td>
        <td>${e.status
          .map(
            ([codigo, qtd]) =>
              `<span class="http http-${String(codigo)[0]}">${codigo}<small>×${qtd}</small></span>`,
          )
          .join(' ')}</td>
        <td class="num">${e.mediaMs} ms</td>
        <td class="num">${e.p95Ms} ms</td>
      </tr>`,
    )
    .join('');

  return `<table class="tabela">
    <thead><tr><th>Método</th><th>Endpoint</th><th class="num">Chamadas</th><th>Status HTTP observados</th><th class="num">Média</th><th class="num">p95</th></tr></thead>
    <tbody>${linhas}</tbody>
  </table>`;
}

function tabelaSeveridades(severidades) {
  return `<table class="tabela compacta">
    <thead><tr><th>Severidade</th><th class="num">Cenários</th><th class="num">Falhas</th></tr></thead>
    <tbody>${severidades
      .map(
        (s) => `<tr><td><span class="sev sev-${s.nivel}">${SEVERIDADES[s.nivel]}</span></td>
          <td class="num">${s.total}</td><td class="num ${s.falhas ? 'txt-falha' : ''}">${s.falhas}</td></tr>`,
      )
      .join('')}</tbody>
  </table>`;
}

function blocoFalhas(falhas) {
  if (!falhas.length) {
    return `<div class="sem-falhas"><span>✓</span> Nenhuma falha nesta execução: todos os cenários atingiram o resultado esperado.</div>`;
  }
  return falhas
    .map(
      (t) => `<div class="falha">
        <div class="falha-topo">
          <span class="pill" style="background:${STATUS[t.status].fundo};color:${STATUS[t.status].cor}">${STATUS[t.status].rotulo}</span>
          <strong>${esc(t.nome)}</strong>
        </div>
        <div class="falha-meta">${esc(t.funcionalidade)} › ${esc(t.historia)} • Severidade: ${SEVERIDADES[t.severidade] ?? t.severidade}</div>
        <pre>${esc(t.mensagemErro ?? 'Sem mensagem de erro registrada.')}</pre>
      </div>`,
    )
    .join('');
}

function detalhamento(testes, funcionalidades) {
  return funcionalidades
    .map((f) => {
      const linhas = testes
        .filter((t) => t.funcionalidade === f.nome)
        .map((t) => {
          const parametros = t.parametros.length
            ? `<div class="params">${t.parametros.map((p) => `${esc(p.name)}: <b>${esc(p.value)}</b>`).join(' · ')}</div>`
            : '';
          const instavel = t.instavel ? '<span class="tag instavel">instável</span>' : '';
          return `<tr>
            <td><span class="pill" style="background:${STATUS[t.status].fundo};color:${STATUS[t.status].cor}">${STATUS[t.status].rotulo}</span></td>
            <td><div class="cenario">${esc(t.nome)} ${instavel}</div><div class="historia">${esc(t.historia)}</div>${parametros}</td>
            <td><span class="sev sev-${t.severidade}">${SEVERIDADES[t.severidade] ?? t.severidade}</span></td>
            <td class="num">${t.requisicoes.length}</td>
            <td class="num">${formatarDuracao(t.duracaoMs)}</td>
          </tr>`;
        })
        .join('');
      return `<section class="bloco-funcionalidade">
        <h3>${esc(f.nome)} <small>${f.passed}/${f.total} aprovados • ${formatarDuracao(f.duracaoMs)}</small></h3>
        <table class="tabela">
          <thead><tr><th style="width:78px">Status</th><th>Cenário</th><th style="width:78px">Severidade</th><th class="num" style="width:48px">Req.</th><th class="num" style="width:62px">Duração</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </section>`;
    })
    .join('');
}

export function montarHtmlRelatorio({ testes, ambiente, indicadores, metadados }) {
  const aprovado = indicadores.falhados + indicadores.quebrados === 0 && indicadores.total > 0;
  const chips = Object.entries(metadados)
    .map(([chave, valor]) => `<div class="chip"><span>${esc(chave)}</span>${esc(valor)}</div>`)
    .join('');
  const kpis = [
    ['Cenários', indicadores.total, ''],
    ['Aprovados', indicadores.aprovados, 'ok'],
    [
      'Falhas',
      indicadores.falhados + indicadores.quebrados,
      indicadores.falhados + indicadores.quebrados ? 'nok' : '',
    ],
    ['Instáveis', indicadores.instaveis, indicadores.instaveis ? 'alerta' : ''],
    ['Requisições HTTP', indicadores.totalRequisicoes, ''],
    ['Duração', formatarDuracao(indicadores.duracaoTotalMs), ''],
  ]
    .map(
      ([rotulo, valor, classe]) =>
        `<div class="kpi ${classe}"><div class="kpi-valor">${valor}</div><div class="kpi-rotulo">${rotulo}</div></div>`,
    )
    .join('');
  const ambienteTecnico = Object.entries(ambiente)
    .map(([chave, valor]) => `<tr><td>${esc(chave)}</td><td class="mono">${esc(valor)}</td></tr>`)
    .join('');

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório de Execução • Testes de API ServeRest</title>
<style>
  :root { --tinta:#0f172a; --suave:#475569; --linha:#e2e8f0; --fundo:#f8fafc; --marca:#4f46e5; --marca2:#0ea5e9; }
  * { box-sizing: border-box; }
  html { color-scheme: light; background: #fff; }
  body { margin:0; background: #fff; font: 11px/1.5 "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: var(--tinta); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .capa { background: linear-gradient(120deg, #1e1b4b 0%, #312e81 45%, #0c4a6e 100%); color:#fff; border-radius: 14px; padding: 22px 24px; position: relative; overflow: hidden; }
  .capa::after { content:""; position:absolute; right:-60px; top:-60px; width:220px; height:220px; border-radius:50%; background: radial-gradient(circle, rgba(14,165,233,.45), transparent 70%); }
  .sobretitulo { font-size: 9.5px; letter-spacing: .16em; text-transform: uppercase; opacity: .75; }
  h1 { font-size: 24px; margin: 4px 0 2px; letter-spacing: -.01em; }
  .subtitulo { opacity: .85; font-size: 11.5px; }
  .veredito { position:absolute; right: 24px; top: 22px; z-index: 1; padding: 7px 14px; border-radius: 999px; font-weight: 700; font-size: 11px; letter-spacing: .06em; background: ${aprovado ? '#22c55e' : '#ef4444'}; color: #fff; box-shadow: 0 4px 14px rgba(0,0,0,.25); }
  .chips { display:flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; position: relative; z-index: 1; }
  .chip { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); border-radius: 8px; padding: 4px 9px; font-size: 10px; }
  .chip span { display:block; font-size: 8.5px; text-transform: uppercase; letter-spacing: .08em; opacity: .7; }
  .kpis { display:grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin: 14px 0; }
  .kpi { border: 1px solid var(--linha); border-radius: 10px; padding: 10px 12px; background: #fff; }
  .kpi-valor { font-size: 20px; font-weight: 700; letter-spacing: -.02em; }
  .kpi-rotulo { color: var(--suave); font-size: 9.5px; text-transform: uppercase; letter-spacing: .06em; }
  .kpi.ok .kpi-valor { color: #16a34a; } .kpi.nok .kpi-valor { color: #dc2626; } .kpi.alerta .kpi-valor { color: #d97706; }
  .grade { display:grid; grid-template-columns: 210px minmax(0, 1fr); gap: 12px; }
  .cartao { border: 1px solid var(--linha); border-radius: 12px; padding: 14px 16px; background: #fff; break-inside: avoid; }
  h2 { font-size: 13px; margin: 0 0 10px; display:flex; align-items:center; gap: 8px; }
  h2::before { content:""; width: 4px; height: 14px; border-radius: 2px; background: linear-gradient(var(--marca), var(--marca2)); }
  .rosca { width: 150px; display:block; margin: 0 auto 6px; }
  .rosca-valor { font-size: 19px; font-weight: 700; fill: var(--tinta); }
  .rosca-rotulo { font-size: 9px; fill: var(--suave); }
  .legenda { list-style:none; padding:0; margin:0; }
  .legenda li { display:flex; align-items:center; gap: 6px; padding: 2px 0; }
  .legenda strong { margin-left:auto; }
  .ponto { width: 9px; height: 9px; border-radius: 50%; display:inline-block; }
  .barra-linha { display:grid; grid-template-columns: 150px minmax(0, 1fr) 40px 46px; gap: 10px; align-items:center; padding: 5px 0; border-bottom: 1px dashed var(--linha); }
  .barra-linha:last-child { border-bottom: 0; }
  .barra-nome { font-weight: 600; }
  .barra { height: 10px; border-radius: 999px; background: #eef2f7; overflow: hidden; display:flex; }
  .barra span { display:block; height: 100%; }
  .barra-num { color: var(--suave); text-align:right; }
  .barra-taxa { font-weight: 700; text-align:right; } .ok { color:#16a34a; } .nok { color:#dc2626; }
  .secao { margin-top: 14px; }
  .tabela { width: 100%; border-collapse: collapse; }
  .tabela th { text-align:left; font-size: 9px; text-transform: uppercase; letter-spacing: .06em; color: var(--suave); border-bottom: 1px solid var(--linha); padding: 6px 8px; background: var(--fundo); }
  .tabela td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  .tabela tr { break-inside: avoid; }
  .tabela.compacta td, .tabela.compacta th { padding: 4px 6px; }
  .num { text-align: right; white-space: nowrap; }
  .mono { font-family: "SFMono-Regular", Menlo, Consolas, monospace; font-size: 10px; }
  .metodo { color:#fff; font-weight:700; font-size: 9px; padding: 2px 7px; border-radius: 5px; letter-spacing: .04em; }
  .http { display:inline-block; font-family: Menlo, Consolas, monospace; font-size: 9.5px; padding: 1px 6px; border-radius: 5px; margin: 1px 2px 1px 0; }
  .http small { opacity: .7; margin-left: 2px; }
  .http-2 { background:#dcfce7; color:#166534; } .http-4 { background:#fef3c7; color:#92400e; } .http-5 { background:#fee2e2; color:#991b1b; } .http-3, .http-1 { background:#e0f2fe; color:#075985; }
  .pill { display:inline-block; font-weight:700; font-size: 9px; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
  .sev { font-size: 9px; padding: 1px 6px; border-radius: 5px; background:#f1f5f9; color: var(--suave); white-space: nowrap; }
  .sev-blocker { background:#fee2e2; color:#991b1b; } .sev-critical { background:#ffedd5; color:#9a3412; }
  .txt-falha { color:#dc2626; font-weight: 700; }
  .cenario { font-weight: 600; }
  .historia { color: var(--suave); font-size: 9.5px; }
  .params { color: var(--suave); font-size: 9.5px; margin-top: 2px; }
  .tag.instavel { font-size: 8.5px; background:#fef3c7; color:#92400e; padding: 1px 6px; border-radius: 5px; margin-left: 4px; }
  .bloco-funcionalidade { margin-top: 14px; break-inside: auto; }
  .bloco-funcionalidade h3 { font-size: 12px; margin: 0 0 6px; }
  .bloco-funcionalidade h3 small { color: var(--suave); font-weight: 500; margin-left: 6px; }
  .sem-falhas { border: 1px solid #bbf7d0; background: #f0fdf4; color: #166534; border-radius: 10px; padding: 10px 12px; font-weight: 600; }
  .sem-falhas span { display:inline-grid; place-items:center; width: 18px; height: 18px; border-radius: 50%; background:#16a34a; color:#fff; margin-right: 6px; }
  .falha { border: 1px solid #fecaca; border-left: 4px solid #dc2626; border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; break-inside: avoid; }
  .falha-topo { display:flex; gap: 8px; align-items:center; }
  .falha-meta { color: var(--suave); font-size: 9.5px; margin: 3px 0 6px; }
  .falha pre { margin:0; white-space: pre-wrap; word-break: break-word; font: 9.5px/1.45 Menlo, Consolas, monospace; background:#fff7f7; padding: 8px; border-radius: 6px; color:#7f1d1d; }
  .quebra { break-before: page; }
  .lado-a-lado { display:grid; grid-template-columns: minmax(0, 1fr) 236px; gap: 12px; }
  .lado-a-lado .compacta td.mono { word-break: break-all; }
  .rodape-nota { color: var(--suave); font-size: 9.5px; margin-top: 10px; }
</style></head>
<body>
  <header class="capa">
    <div class="veredito">${aprovado ? 'APROVADO' : 'REPROVADO'}</div>
    <div class="sobretitulo">Relatório de execução • Testes automatizados de API</div>
    <h1>ServeRest — E-commerce API</h1>
    <div class="subtitulo">Cypress + Cucumber (BDD) • Validação de contrato com JSON Schema • Allure Report</div>
    <div class="chips">${chips}</div>
  </header>

  <div class="kpis">${kpis}</div>

  <div class="grade">
    <div class="cartao">
      <h2>Resultado geral</h2>
      ${rosca(indicadores)}
      <ul class="legenda">${legenda(indicadores)}</ul>
    </div>
    <div class="cartao">
      <h2>Resultado por funcionalidade</h2>
      ${barrasPorFuncionalidade(indicadores.funcionalidades)}
    </div>
  </div>

  <div class="secao lado-a-lado">
    <div class="cartao">
      <h2>Cobertura de endpoints</h2>
      ${tabelaEndpoints(indicadores.endpoints)}
      <div class="rodape-nota">Considera apenas as requisições feitas pelos cenários (a limpeza de massa não entra na conta). IDs foram normalizados para {_id}.</div>
    </div>
    <div>
      <div class="cartao">
        <h2>Risco por severidade</h2>
        ${tabelaSeveridades(indicadores.severidades)}
      </div>
      <div class="cartao" style="margin-top:12px">
        <h2>Ambiente</h2>
        <table class="tabela compacta"><tbody>${ambienteTecnico}</tbody></table>
      </div>
    </div>
  </div>

  <div class="secao cartao">
    <h2>Falhas e pontos de atenção</h2>
    ${blocoFalhas(indicadores.falhas)}
  </div>

  <div class="quebra"></div>
  <h2>Detalhamento dos cenários</h2>
  ${detalhamento(testes, indicadores.funcionalidades)}
</body></html>`;
}
