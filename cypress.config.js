const os = require('node:os');
const { defineConfig } = require('cypress');
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');
const { addCucumberPreprocessorPlugin } = require('@badeball/cypress-cucumber-preprocessor');
const { createEsbuildPlugin } = require('@badeball/cypress-cucumber-preprocessor/esbuild');
const { allureCypress } = require('allure-cypress/reporter');
const cypressOnFix = require('cypress-on-fix');

const BASE_URL = process.env.BASE_URL || 'https://serverest.dev';

/**
 * Cypress só permite um handler por evento (after:spec, after:run...).
 * O cypress-on-fix compõe os handlers para que Cucumber e Allure convivam.
 */
async function setupNodeEvents(cypressOn, config) {
  const on = cypressOnFix(cypressOn);

  await addCucumberPreprocessorPlugin(on, config);

  on(
    'file:preprocessor',
    createBundler({
      plugins: [createEsbuildPlugin(config)],
    }),
  );

  allureCypress(on, config, {
    resultsDir: 'allure-results',
    videoOnFailOnly: true,
    stepsFromCommands: {
      maxArgumentLength: 256,
      maxArgumentDepth: 3,
    },
    links: {
      issue: {
        urlTemplate: 'https://github.com/ServeRest/ServeRest/issues/%s',
        nameTemplate: 'Issue #%s',
      },
      tms: {
        urlTemplate: 'https://serverest.dev/#/%s',
        nameTemplate: 'Swagger • %s',
      },
    },
    environmentInfo: {
      'API alvo': config.baseUrl,
      Cypress: config.version,
      'Node.js': process.version,
      'Sistema operacional': `${os.type()} ${os.release()} (${os.arch()})`,
      Branch: process.env.GITHUB_REF_NAME || 'local',
      Commit: process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : 'local',
      Tags: config.expose?.tags || 'todas',
    },
  });

  return config;
}

module.exports = defineConfig({
  projectId: null,
  e2e: {
    baseUrl: BASE_URL,
    specPattern: 'cypress/e2e/features/**/*.feature',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents,
    // Testes de API não renderizam UI: vídeo/screenshot apenas consumiriam tempo e espaço.
    video: false,
    screenshotOnRunFailure: false,
    // Ambiente público e compartilhado: 1 retentativa no CI reduz falso-negativo por instabilidade
    // de rede. O Allure marca o teste como "flaky", então a instabilidade continua visível.
    retries: { runMode: 1, openMode: 0 },
    requestTimeout: 15000,
    responseTimeout: 30000,
    defaultCommandTimeout: 10000,
    // Cypress 16+: valores públicos lidos no browser via Cypress.expose() (substitui Cypress.env()).
    expose: {
      // SLA de tempo de resposta (ms) usado nas validações não funcionais.
      slaRespostaMs: Number(process.env.SLA_RESPOSTA_MS || 3000),
    },
  },
});
