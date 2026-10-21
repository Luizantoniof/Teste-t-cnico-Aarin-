import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { CONTRATOS, idDoContrato, nomeCurtoDoContrato } from '../../contracts';

/**
 * Validador de contrato baseado em AJV (JSON Schema draft 2020-12).
 *  - allErrors: reporta TODAS as violações de uma vez, não apenas a primeira;
 *  - strict: o próprio schema é validado (keyword desconhecida = erro de autoria);
 *  - verbose: inclui o valor recebido em cada violação, essencial para diagnosticar.
 * Os schemas são compilados uma única vez e reaproveitados entre cenários.
 */
const ajv = new Ajv2020({ allErrors: true, strict: true, verbose: true });
addFormats(ajv);
CONTRATOS.forEach((contrato) => ajv.addSchema(contrato));

const TRADUCOES = {
  required: ({ params }) => `campo obrigatório "${params.missingProperty}" ausente`,
  additionalProperties: ({ params }) =>
    `campo "${params.additionalProperty}" não previsto no contrato`,
  type: ({ params }) => `deve ser do tipo ${params.type}`,
  format: ({ params }) => `deve estar no formato "${params.format}"`,
  pattern: ({ params }) => `deve corresponder ao padrão ${params.pattern}`,
  minimum: ({ params }) => `deve ser ${params.comparison} ${params.limit}`,
  maximum: ({ params }) => `deve ser ${params.comparison} ${params.limit}`,
  exclusiveMinimum: ({ params }) => `deve ser ${params.comparison} ${params.limit}`,
  exclusiveMaximum: ({ params }) => `deve ser ${params.comparison} ${params.limit}`,
  minLength: ({ params }) => `deve ter no mínimo ${params.limit} caractere(s)`,
  maxLength: ({ params }) => `deve ter no máximo ${params.limit} caractere(s)`,
  minItems: ({ params }) => `deve ter no mínimo ${params.limit} item(ns)`,
  maxItems: ({ params }) => `deve ter no máximo ${params.limit} item(ns)`,
  minProperties: ({ params }) => `deve ter no mínimo ${params.limit} propriedade(s)`,
  uniqueItems: ({ params }) => `itens duplicados nas posições ${params.j} e ${params.i}`,
  enum: ({ params }) =>
    `deve ser um dos valores: ${params.allowedValues.map((v) => JSON.stringify(v)).join(', ')}`,
  const: ({ params }) => `deve ser exatamente ${JSON.stringify(params.allowedValue)}`,
  propertyNames: ({ params }) => `nome de propriedade inválido: "${params.propertyName}"`,
};

const SEM_VALOR_RECEBIDO = new Set(['required', 'additionalProperties', 'propertyNames']);

function caminhoDaViolacao(erro) {
  const base = erro.instancePath || '';
  if (erro.keyword === 'required') return `${base}/${erro.params.missingProperty}`;
  if (erro.keyword === 'additionalProperties') return `${base}/${erro.params.additionalProperty}`;
  return base || '(raiz)';
}

function formatarViolacoes(erros = []) {
  const vistas = new Set();
  return erros
    .map((erro) => ({
      caminho: caminhoDaViolacao(erro),
      regra: erro.keyword,
      mensagem: TRADUCOES[erro.keyword]?.(erro) ?? erro.message,
      recebido: SEM_VALOR_RECEBIDO.has(erro.keyword) ? undefined : erro.data,
      regraNoSchema: erro.schemaPath,
    }))
    .filter(({ caminho, regra, mensagem }) => {
      const chave = `${caminho}|${regra}|${mensagem}`;
      if (vistas.has(chave)) return false;
      vistas.add(chave);
      return true;
    });
}

export function contratosDisponiveis() {
  return CONTRATOS.map(({ $id }) => nomeCurtoDoContrato($id)).filter((n) => n !== 'definicoes');
}

/**
 * Valida `dados` contra o contrato informado pelo nome curto (ex.: "usuarios/detalhe").
 * @returns {{ contrato: string, valido: boolean, violacoes: object[], schema: object }}
 */
export function validarContrato(nomeContrato, dados) {
  const validar = ajv.getSchema(idDoContrato(nomeContrato));
  if (!validar) {
    throw new Error(
      `Contrato "${nomeContrato}" não registrado. Disponíveis: ${contratosDisponiveis().join(', ')}`,
    );
  }

  const valido = validar(dados);
  return {
    contrato: nomeContrato,
    valido,
    violacoes: valido ? [] : formatarViolacoes(validar.errors),
    schema: schemaLegivel(validar.schema),
  };
}

/** Contratos que são apenas um "$ref" são expandidos para a definição real (melhor leitura no relatório). */
function schemaLegivel(schema) {
  const chaves = Object.keys(schema).filter((k) => !['$schema', '$id', 'title'].includes(k));
  if (chaves.length === 1 && schema.$ref) {
    const referencia = new URL(schema.$ref, schema.$id).href;
    return { ...schema, $refResolvido: ajv.getSchema(referencia)?.schema };
  }
  return schema;
}

export function descreverViolacoes(violacoes) {
  return violacoes
    .map((v, i) => {
      const recebido = v.recebido === undefined ? '' : ` (recebido: ${JSON.stringify(v.recebido)})`;
      return `  ${i + 1}. ${v.caminho} → ${v.mensagem}${recebido}`;
    })
    .join('\n');
}
