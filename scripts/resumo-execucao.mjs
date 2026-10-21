// Escreve o resumo da execução em Markdown no "Job Summary" do GitHub Actions
// (ou no terminal, quando executado localmente).
import { appendFile } from 'node:fs/promises';
import {
  calcularIndicadores,
  carregarResultados,
  formatarDuracao,
} from './lib/resultadosAllure.mjs';

const ICONES = { passed: '✅', failed: '❌', broken: '⚠️', skipped: '⏭️', unknown: '❔' };

let resultados;
try {
  resultados = await carregarResultados(process.env.ALLURE_RESULTS_DIR || 'allure-results');
} catch (erro) {
  console.warn(`⚠️  Resumo não gerado: ${erro.message}`);
  process.exit(0);
}

const i = calcularIndicadores(resultados);
const aprovado = i.falhados + i.quebrados === 0 && i.total > 0;

const linhas = [
  `## ${aprovado ? '✅' : '❌'} Testes de API • ServeRest`,
  '',
  '| Cenários | Aprovados | Falhas | Instáveis | Taxa de sucesso | Requisições | Duração |',
  '|---:|---:|---:|---:|---:|---:|---:|',
  `| ${i.total} | ${i.aprovados} | ${i.falhados + i.quebrados} | ${i.instaveis} | ${i.taxaSucesso.toFixed(1)}% | ${i.totalRequisicoes} | ${formatarDuracao(i.duracaoTotalMs)} |`,
  '',
  '### Por funcionalidade',
  '',
  '| Funcionalidade | Aprovados | Total |',
  '|---|---:|---:|',
  ...i.funcionalidades.map((f) => `| ${f.nome} | ${f.passed} | ${f.total} |`),
  '',
];

if (i.falhas.length) {
  linhas.push('### Falhas', '');
  i.falhas.forEach((t) => {
    const mensagem = (t.mensagemErro ?? '').split('\n')[0].slice(0, 220);
    linhas.push(`- ${ICONES[t.status]} **${t.funcionalidade} › ${t.nome}** — \`${mensagem}\``);
  });
  linhas.push('');
}

linhas.push(
  '> 📦 Baixe os artefatos **allure-report** (HTML de arquivo único) e **relatorio-pdf** no rodapé desta execução.',
);

const markdown = `${linhas.join('\n')}\n`;
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown);
  console.log('📝 Resumo publicado no Job Summary do GitHub Actions.');
} else {
  console.log(markdown);
}
