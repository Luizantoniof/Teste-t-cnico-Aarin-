// Remove resultados de execuções anteriores (multiplataforma). O histórico do Allure é preservado.
import { rm } from 'node:fs/promises';

const ALVOS = [
  'allure-results',
  'allure-report',
  'reports',
  'cypress/screenshots',
  'cypress/videos',
];

await Promise.all(ALVOS.map((alvo) => rm(alvo, { recursive: true, force: true })));
console.log(`🧹 Resultados anteriores removidos: ${ALVOS.join(', ')}`);
