import * as allure from 'allure-js-commons';

const EPICO = 'ServeRest • E-commerce API';
const SEVERIDADES = new Set(['blocker', 'critical', 'normal', 'minor', 'trivial']);

/** Percorre a árvore Gherkin (incluindo blocos "Regra") procurando o cenário pelo id do AST. */
function localizarCenario(feature, idCenario) {
  for (const filho of feature.children) {
    if (filho.scenario?.id === idCenario) return { cenario: filho.scenario, regra: null };
    if (filho.rule) {
      const encontrado = filho.rule.children.find((c) => c.scenario?.id === idCenario);
      if (encontrado) return { cenario: encontrado.scenario, regra: filho.rule };
    }
  }
  return { cenario: null, regra: null };
}

/** Em um "Esquema do Cenário", transforma a linha de Exemplos em parâmetros do Allure. */
function aplicarParametrosDosExemplos(cenario, idLinha) {
  for (const exemplos of cenario?.examples ?? []) {
    const linha = exemplos.tableBody.find((l) => l.id === idLinha);
    if (linha) {
      exemplos.tableHeader.cells.forEach((cabecalho, i) => {
        allure.parameter(cabecalho.value, linha.cells[i].value || '(vazio)');
      });
      return;
    }
  }
}

/**
 * Converte o contexto Cucumber em metadados Allure:
 *  - Épico / Funcionalidade / História (Regra)  → aba "Behaviors"
 *  - @severity:<nivel>                          → severidade
 *  - @doc:<Tag/operationId>                     → link para o Swagger da ServeRest
 *  - @issue:<n>                                 → link para issue
 *  - demais tags                                → tags do Allure
 */
export function aplicarMetadadosAllure({ pickle, gherkinDocument }) {
  const { feature } = gherkinDocument;
  const [idCenario, idLinhaExemplo] = pickle.astNodeIds;
  const { cenario, regra } = localizarCenario(feature, idCenario);

  allure.epic(EPICO);
  allure.feature(feature.name);
  allure.story(regra?.name ?? feature.name);
  allure.layer('API');
  allure.owner('QA • Automação de API');

  let severidade = 'normal';
  pickle.tags
    .map(({ name }) => name.replace(/^@/, ''))
    .forEach((tag) => {
      const [chave, ...resto] = tag.split(':');
      const valor = resto.join(':');
      if (chave === 'severity' && SEVERIDADES.has(valor)) severidade = valor;
      else if (chave === 'doc') allure.tms(valor, valor);
      else if (chave === 'issue') allure.issue(valor, valor);
      else allure.tag(tag);
    });
  allure.severity(severidade);

  const descricao = [feature.description, regra?.description, cenario?.description]
    .map((texto) => texto?.trim())
    .filter(Boolean)
    .join('\n\n');
  if (descricao) allure.description(descricao);

  if (idLinhaExemplo) aplicarParametrosDosExemplos(cenario, idLinhaExemplo);
}
