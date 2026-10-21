import { Cenario, CHAVES } from '../contexto/Cenario';
import { UsuarioFactory } from '../factories/UsuarioFactory';

/**
 * Placeholders dinâmicos usados nas tabelas de Exemplos do Gherkin.
 * Permitem escrever cenários data-driven que referenciam dados gerados em tempo de execução:
 *
 *   {{vazio}}            → ""                (campo em branco)
 *   {{ausente}}          → undefined         (campo removido do payload)
 *   {{usuario.email}}    → e-mail do usuário criado no cenário
 *   {{usuario.password}} → senha do usuário criado no cenário
 *   {{email.aleatorio}}  → e-mail único que não existe na base
 */
const RESOLVEDORES = {
  vazio: () => '',
  ausente: () => undefined,
  'usuario.email': () => Cenario.obter(CHAVES.USUARIO).email,
  'usuario.password': () => Cenario.obter(CHAVES.USUARIO).password,
  'email.aleatorio': () => UsuarioFactory.emailUnico(),
};

export function resolverValor(texto) {
  const encontrado = /^\{\{\s*([\w.]+)\s*\}\}$/.exec(String(texto).trim());
  if (!encontrado) return texto;

  const resolvedor = RESOLVEDORES[encontrado[1]];
  if (!resolvedor) {
    throw new Error(
      `Placeholder desconhecido: ${texto}. Disponíveis: ${Object.keys(RESOLVEDORES)
        .map((chave) => `{{${chave}}}`)
        .join(', ')}`,
    );
  }
  return resolvedor();
}
