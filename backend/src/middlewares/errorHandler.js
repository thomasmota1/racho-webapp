import { ErroAplicacao } from '../utils/AppError.js';

export function rotaNaoEncontrada(requisicao, _resposta, proximo) {
  proximo(new ErroAplicacao(
    `Rota não encontrada: ${requisicao.method} ${requisicao.originalUrl}`,
    404,
  ));
}

export function tratarErro(erro, _requisicao, resposta, _proximo) {
  if (erro.code === 'P2002') {
    resposta.status(409).json({ message: 'Já existe um registro com essas informações.' });
    return;
  }

  if (erro.code === 'P2025') {
    resposta.status(404).json({ message: 'Registro não encontrado.' });
    return;
  }

  const codigoHttp = erro.codigoHttp || 500;
  const mensagem = erro.message || 'Erro interno do servidor.';

  if (codigoHttp >= 500) {
    console.error(erro);
  }

  resposta.status(codigoHttp).json({ message: mensagem });
}
