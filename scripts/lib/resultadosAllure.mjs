// Leitura e consolidação dos arquivos de allure-results (reaproveitado pelo PDF e pelo resumo do CI).
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const TIPO_TROCA_HTTP = 'application/vnd.allure.http+json';
const ORDEM_STATUS = ['failed', 'broken', 'passed', 'skipped', 'unknown'];

const rotulo = (resultado, nome) => resultado.labels?.find((l) => l.name === nome)?.value;
const rotulos = (resultado, nome) =>
  resultado.labels?.filter((l) => l.name === nome).map((l) => l.value) ?? [];

/** /carrinhos/Ab12Cd34Ef56Gh78 → /carrinhos/{_id} */
const normalizarCaminho = (caminho) =>
  caminho
    .split('/')
    .map((parte) => (/^[A-Za-z0-9]{16}$/.test(parte) ? '{_id}' : parte))
    .join('/');

async function lerJson(arquivo) {
  return JSON.parse(await readFile(arquivo, 'utf-8'));
}

async function coletarTrocasHttp(passos, diretorio, acumulador = []) {
  for (const passo of passos ?? []) {
    for (const anexo of passo.attachments ?? []) {
      if (anexo.type !== TIPO_TROCA_HTTP) continue;
      const arquivo = path.join(diretorio, anexo.source);
      if (!existsSync(arquivo)) continue;
      const troca = await lerJson(arquivo);
      const url = new URL(troca.request.url);
      acumulador.push({
        metodo: troca.request.method,
        caminho: normalizarCaminho(url.pathname),
        status: troca.response?.status,
        duracaoMs: troca.stop - troca.start,
      });
    }
    await coletarTrocasHttp(passo.steps, diretorio, acumulador);
  }
  return acumulador;
}

async function lerAmbiente(diretorio) {
  const arquivo = path.join(diretorio, 'environment.properties');
  if (!existsSync(arquivo)) return {};
  const conteudo = await readFile(arquivo, 'utf-8');
  return Object.fromEntries(
    conteudo
      .split('\n')
      .filter((linha) => linha.includes('='))
      .map((linha) => {
        const indice = linha.indexOf('=');
        return [linha.slice(0, indice).replace(/\\ /g, ' ').trim(), linha.slice(indice + 1).trim()];
      }),
  );
}

/**
 * Consolida os resultados:
 *  - retentativas do mesmo cenário (mesmo historyId) viram um único teste com o status final;
 *  - um teste que falhou e depois passou é marcado como "instável" (flaky);
 *  - as trocas HTTP anexadas alimentam a cobertura de endpoints.
 */
export async function carregarResultados(diretorio = 'allure-results') {
  if (!existsSync(diretorio)) {
    throw new Error(
      `Diretório "${diretorio}" não encontrado. Execute os testes antes de gerar relatórios.`,
    );
  }

  const arquivos = (await readdir(diretorio)).filter((nome) => nome.endsWith('-result.json'));
  const brutos = await Promise.all(arquivos.map((nome) => lerJson(path.join(diretorio, nome))));

  const porCenario = new Map();
  for (const resultado of brutos) {
    const chave = resultado.historyId ?? resultado.fullName ?? resultado.uuid;
    const tentativas = porCenario.get(chave) ?? [];
    tentativas.push(resultado);
    porCenario.set(chave, tentativas);
  }

  const testes = [];
  for (const tentativas of porCenario.values()) {
    tentativas.sort((a, b) => (a.stop ?? 0) - (b.stop ?? 0));
    const final = tentativas.at(-1);
    testes.push({
      nome: final.name,
      status: final.status ?? 'unknown',
      funcionalidade:
        rotulo(final, 'feature') ?? rotulo(final, 'parentSuite') ?? 'Sem funcionalidade',
      historia: rotulo(final, 'story') ?? rotulo(final, 'suite') ?? '',
      severidade: rotulo(final, 'severity') ?? 'normal',
      tags: rotulos(final, 'tag'),
      duracaoMs: (final.stop ?? 0) - (final.start ?? 0),
      inicio: final.start,
      fim: final.stop,
      mensagemErro: final.statusDetails?.message?.trim(),
      parametros: (final.parameters ?? []).filter((p) => !p.excluded),
      tentativas: tentativas.length,
      instavel: tentativas.length > 1 && final.status === 'passed',
      requisicoes: await coletarTrocasHttp(final.steps, diretorio),
    });
  }

  testes.sort(
    (a, b) =>
      a.funcionalidade.localeCompare(b.funcionalidade, 'pt-BR') ||
      ORDEM_STATUS.indexOf(a.status) - ORDEM_STATUS.indexOf(b.status) ||
      (a.inicio ?? 0) - (b.inicio ?? 0),
  );

  return { testes, ambiente: await lerAmbiente(diretorio) };
}

const percentil = (valores, p) => {
  if (!valores.length) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  return ordenados[Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1)];
};

/** Indicadores agregados usados no PDF e no resumo do GitHub Actions. */
export function calcularIndicadores({ testes }) {
  const contar = (status) => testes.filter((t) => t.status === status).length;
  const total = testes.length;
  const aprovados = contar('passed');
  const inicio = Math.min(...testes.map((t) => t.inicio ?? Infinity));
  const fim = Math.max(...testes.map((t) => t.fim ?? 0));

  const porFuncionalidade = new Map();
  for (const teste of testes) {
    const grupo = porFuncionalidade.get(teste.funcionalidade) ?? {
      nome: teste.funcionalidade,
      total: 0,
      passed: 0,
      failed: 0,
      broken: 0,
      skipped: 0,
      duracaoMs: 0,
    };
    grupo.total += 1;
    grupo[teste.status] = (grupo[teste.status] ?? 0) + 1;
    grupo.duracaoMs += teste.duracaoMs;
    porFuncionalidade.set(teste.funcionalidade, grupo);
  }

  const porEndpoint = new Map();
  for (const requisicao of testes.flatMap((t) => t.requisicoes)) {
    const chave = `${requisicao.metodo} ${requisicao.caminho}`;
    const grupo = porEndpoint.get(chave) ?? {
      metodo: requisicao.metodo,
      caminho: requisicao.caminho,
      chamadas: 0,
      status: new Map(),
      duracoes: [],
    };
    grupo.chamadas += 1;
    grupo.status.set(requisicao.status, (grupo.status.get(requisicao.status) ?? 0) + 1);
    grupo.duracoes.push(requisicao.duracaoMs);
    porEndpoint.set(chave, grupo);
  }

  const endpoints = [...porEndpoint.values()]
    .map((e) => ({
      ...e,
      status: [...e.status.entries()].sort(([a], [b]) => a - b),
      mediaMs: Math.round(e.duracoes.reduce((s, d) => s + d, 0) / e.duracoes.length),
      p95Ms: percentil(e.duracoes, 95),
    }))
    .sort((a, b) => a.caminho.localeCompare(b.caminho) || a.metodo.localeCompare(b.metodo));

  const severidades = ['blocker', 'critical', 'normal', 'minor', 'trivial']
    .map((nivel) => ({
      nivel,
      total: testes.filter((t) => t.severidade === nivel).length,
      falhas: testes.filter(
        (t) => t.severidade === nivel && ['failed', 'broken'].includes(t.status),
      ).length,
    }))
    .filter((s) => s.total > 0);

  return {
    total,
    aprovados,
    falhados: contar('failed'),
    quebrados: contar('broken'),
    ignorados: contar('skipped'),
    instaveis: testes.filter((t) => t.instavel).length,
    taxaSucesso: total ? (aprovados / total) * 100 : 0,
    duracaoTotalMs: Number.isFinite(inicio) ? fim - inicio : 0,
    totalRequisicoes: endpoints.reduce((s, e) => s + e.chamadas, 0),
    funcionalidades: [...porFuncionalidade.values()],
    endpoints,
    severidades,
    falhas: testes.filter((t) => ['failed', 'broken'].includes(t.status)),
  };
}

export function formatarDuracao(ms) {
  if (ms < 1000) return `${ms} ms`;
  const segundos = ms / 1000;
  if (segundos < 60) return `${segundos.toFixed(1).replace('.', ',')} s`;
  const minutos = Math.floor(segundos / 60);
  return `${minutos} min ${Math.round(segundos % 60)} s`;
}
