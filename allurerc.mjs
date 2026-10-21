import { defineConfig } from 'allure';

const env = process.env;
const NOME_RELATORIO = 'ServeRest • Testes de API';

/**
 * Allure Report 3 (100% Node.js, sem Java).
 * - awesome: relatório principal, gerado em arquivo único (abre com duplo clique, ideal para artefato do CI);
 * - historyPath: guarda o histórico entre execuções (gráficos de tendência / detecção de flaky);
 * - categories: classifica as falhas por natureza, acelerando a triagem.
 */
export default defineConfig({
  name: NOME_RELATORIO,
  output: './allure-report',
  historyPath: './allure-history/history.jsonl',
  appendHistory: true,
  historyLimit: 30,
  variables: {
    'API alvo': env.BASE_URL || 'https://serverest.dev',
    Branch: env.GITHUB_REF_NAME || 'local',
    Commit: env.GITHUB_SHA ? env.GITHUB_SHA.slice(0, 7) : 'local',
    Execução: env.GITHUB_RUN_NUMBER ? `#${env.GITHUB_RUN_NUMBER}` : 'local',
    Gatilho: env.GITHUB_EVENT_NAME || 'manual',
    Tags: env.TAGS || 'todas',
  },
  categories: {
    rules: [
      {
        name: 'Contrato violado (JSON Schema)',
        matchers: { statuses: ['failed'], message: /respeitasse o contrato/ },
      },
      {
        name: 'Pré-condição / massa de dados',
        matchers: { statuses: ['failed', 'broken'], message: /pré-condição/ },
      },
      {
        name: 'Status HTTP inesperado',
        matchers: { statuses: ['failed'], message: /status HTTP/ },
      },
      {
        name: 'Ambiente indisponível ou rede instável',
        matchers: {
          statuses: ['failed', 'broken'],
          message:
            /ECONNREFUSED|ETIMEDOUT|ESOCKETTIMEDOUT|ENOTFOUND|cy\.request\(\) failed|timed out/i,
        },
      },
      {
        name: 'Regra de negócio divergente',
        matchers: { statuses: ['failed'] },
      },
      {
        name: 'Erro de automação (broken)',
        matchers: { statuses: ['broken'] },
      },
    ],
  },
  plugins: {
    awesome: {
      options: {
        reportName: NOME_RELATORIO,
        reportLanguage: 'pt',
        singleFile: true,
        theme: 'auto',
        groupBy: ['epic', 'feature', 'story'],
      },
    },
  },
});
