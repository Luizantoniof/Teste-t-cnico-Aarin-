// Gera o relatório executivo em PDF (e a versão HTML) a partir de allure-results.
// Uso: npm run report:pdf
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { calcularIndicadores, carregarResultados } from './lib/resultadosAllure.mjs';
import { montarHtmlRelatorio } from './lib/templateRelatorio.mjs';

const DIRETORIO_RESULTADOS = process.env.ALLURE_RESULTS_DIR || 'allure-results';
const DIRETORIO_SAIDA = path.join('reports', 'pdf');
const ARQUIVO_PDF = path.join(DIRETORIO_SAIDA, 'relatorio-testes-api.pdf');
const ARQUIVO_HTML = path.join(DIRETORIO_SAIDA, 'relatorio-testes-api.html');

const env = process.env;
const dataExecucao = new Date().toLocaleString('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  dateStyle: 'short',
  timeStyle: 'short',
});

let resultados;
try {
  resultados = await carregarResultados(DIRETORIO_RESULTADOS);
} catch (erro) {
  console.warn(`⚠️  Relatório PDF não gerado: ${erro.message}`);
  process.exit(0);
}

const indicadores = calcularIndicadores(resultados);
const metadados = {
  'API alvo': env.BASE_URL || resultados.ambiente['API alvo'] || 'https://serverest.dev',
  Branch: env.GITHUB_REF_NAME || 'local',
  Commit: env.GITHUB_SHA ? env.GITHUB_SHA.slice(0, 7) : 'local',
  Execução: env.GITHUB_RUN_NUMBER ? `#${env.GITHUB_RUN_NUMBER}` : 'local',
  Tags: env.TAGS || 'todas',
  'Gerado em': `${dataExecucao} (BRT)`,
};

const html = montarHtmlRelatorio({ ...resultados, indicadores, metadados });
await mkdir(DIRETORIO_SAIDA, { recursive: true });
await writeFile(ARQUIVO_HTML, html, 'utf-8');

// Em runners Linux (Ubuntu 23.10+) o sandbox do Chrome depende de user namespaces: desativamos só no CI.
const navegador = await puppeteer.launch({
  headless: true,
  args: env.CI ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
});

try {
  const pagina = await navegador.newPage();
  await pagina.setContent(html, { waitUntil: 'load' });
  await pagina.pdf({
    path: ARQUIVO_PDF,
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', right: '12mm', bottom: '16mm', left: '12mm' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `
      <div style="width:100%;font:8px Arial,sans-serif;color:#94a3b8;padding:0 12mm;display:flex;justify-content:space-between">
        <span>ServeRest • Relatório de testes de API • ${dataExecucao}</span>
        <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
      </div>`,
  });
} finally {
  await navegador.close();
}

const resumo = `${indicadores.aprovados}/${indicadores.total} aprovados (${indicadores.taxaSucesso.toFixed(1)}%)`;
console.log(`📄 Relatório PDF gerado: ${ARQUIVO_PDF} — ${resumo}`);
