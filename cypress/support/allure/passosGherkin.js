/**
 * O preprocessor do Cucumber registra cada passo no Command Log como um grupo cuja
 * mensagem vem em negrito ("**texto do passo**"). O allure-cypress só remove os asteriscos
 * para palavras-chave em inglês (Given/When/Then/And); aqui normalizamos as do Gherkin
 * em português para que o Allure exiba "Dado que ..." limpo, com os comandos aninhados.
 *
 * IMPORTANTE: este módulo precisa ser importado ANTES de "allure-cypress" no e2e.js,
 * pois os listeners de "log:added" executam na ordem de registro.
 */
const PALAVRAS_CHAVE = new Set([
  'Dado',
  'Dada',
  'Dados',
  'Dadas',
  'Quando',
  'Então',
  'Entao',
  'E',
  'Mas',
  '*',
  'Before',
  'After',
  'BeforeStep',
  'AfterStep',
]);

Cypress.on('log:added', (_atributos, log) => {
  const atributos = log?.attributes;
  if (typeof atributos?.message !== 'string') return;

  // Tabelas de dados chegam com &nbsp; para alinhar no runner; no Allure viram ruído.
  if (atributos.name === 'DataTable') {
    atributos.message = atributos.message
      .replaceAll('&nbsp;', ' ')
      .replace(/[ \t]+/g, ' ')
      .trim();
    return;
  }

  if (!atributos.groupStart) return;

  const { name, message } = atributos;
  if (PALAVRAS_CHAVE.has(String(name).trim()) && /^\*\*[\s\S]*\*\*$/.test(message)) {
    atributos.message = message.slice(2, -2);
  }
});
