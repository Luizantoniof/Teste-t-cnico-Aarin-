import js from '@eslint/js';
import pluginCypress from 'eslint-plugin-cypress';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/',
      'allure-results/',
      'allure-report/',
      'allure-history/',
      'reports/',
      'cypress/screenshots/',
      'cypress/videos/',
    ],
  },
  js.configs.recommended,
  {
    files: ['cypress/**/*.js'],
    ...pluginCypress.configs.recommended,
    languageOptions: {
      ...pluginCypress.configs.recommended.languageOptions,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...pluginCypress.configs.recommended.languageOptions?.globals,
        ...globals.browser,
        ...globals.mocha,
        chai: 'readonly',
      },
    },
    rules: {
      ...pluginCypress.configs.recommended.rules,
      // Expressões como `expect(x).to.exist` são asserções Chai válidas.
      'no-unused-expressions': 'off',
    },
  },
  {
    files: ['cypress.config.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    files: ['scripts/**/*.mjs', '*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
  },
];
