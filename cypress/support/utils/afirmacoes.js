/**
 * Asserção de status com diagnóstico: quando falha, a mensagem já traz o corpo recebido,
 * evitando a ida ao log para entender o motivo (ex.: 400 com a mensagem de validação).
 */
export function afirmarStatus(resposta, esperado, descricao = 'status HTTP') {
  const mensagem =
    resposta.status === esperado
      ? descricao
      : `${descricao} — corpo recebido: ${JSON.stringify(resposta.body)}`;
  expect(resposta.status, mensagem).to.eq(esperado);
}
