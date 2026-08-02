// Encaminha erros assíncronos ao Express.
export const tratarErrosAssincronos = (controlador) => (requisicao, resposta, proximo) => {
  Promise.resolve(controlador(requisicao, resposta, proximo)).catch(proximo);
};
