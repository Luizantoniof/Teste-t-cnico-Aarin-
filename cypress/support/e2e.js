// A ordem importa: o normalizador dos passos em português precisa registrar seu
// listener de "log:added" antes do allure-cypress.
import './allure/passosGherkin';
import 'allure-cypress';

import './validators/chaiContrato';
import './commands';
import './hooks/ciclo-de-vida';
