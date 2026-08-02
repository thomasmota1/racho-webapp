// Importa o erro padronizado.
import { ErroAplicacao } from '../utils/AppError.js';

// Responde para rotas inexistentes.
export function rotaNaoEncontrada(requisicao, _resposta, proximo) {
  proximo(new ErroAplicacao(
    `Rota não encontrada: ${requisicao.method} ${requisicao.originalUrl}`,
    404,
  ));
}

// Padroniza erros enviados ao cliente.
export function tratarErro(erro, _requisicao, resposta, _proximo) {
  // Trata conflitos de unicidade.
  if (erro.code === 'P2002') {
    resposta.status(409).json({ message: 'Já existe um registro com essas informações.' });
    return;
  }

  // Trata registros inexistentes.
  if (erro.code === 'P2025') {
    resposta.status(404).json({ message: 'Registro não encontrado.' });
    return;
  }

  // Define resposta de erro padrão.
  const codigoHttp = erro.codigoHttp || 500;
  const mensagem = erro.message || 'Erro interno do servidor.';

  // Registra falhas internas.
  if (codigoHttp >= 500) {
    console.error(erro);
  }

  // Envia a resposta padronizada.
  resposta.status(codigoHttp).json({ message: mensagem });
}
