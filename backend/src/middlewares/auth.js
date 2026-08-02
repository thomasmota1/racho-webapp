// Importa token, banco e erros.
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';

// Autentica o token recebido.
export async function autenticar(requisicao, _resposta, proximo) {
  // Valida token e usuário.
  try {
    // Lê o cabeçalho de autorização.
    const cabecalho = requisicao.headers.authorization;

    // Exige um token Bearer.
    if (!cabecalho?.startsWith('Bearer ')) {
      throw new ErroAplicacao('Token de autenticação não informado.', 401);
    }

    // Decodifica e consulta o usuário.
    const token = cabecalho.slice(7);
    const dadosToken = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await prisma.user.findUnique({ where: { id: dadosToken.userId } });

    // Bloqueia contas inexistentes ou inativas.
    if (!usuario || !usuario.active) {
      throw new ErroAplicacao('Usuário não encontrado ou desativado.', 401);
    }

    // Anexa o usuário autenticado.
    requisicao.usuario = usuario;
    proximo();
  } catch (erro) {
    // Converte erros de token.
    if (erro.name === 'JsonWebTokenError' || erro.name === 'TokenExpiredError') {
      proximo(new ErroAplicacao('Sessão inválida ou expirada.', 401));
      return;
    }
    proximo(erro);
  }
}

// Restringe acesso ao administrador.
export function exigirAdministrador(requisicao, _resposta, proximo) {
  // Bloqueia usuários comuns.
  if (requisicao.usuario.role !== 'ADMIN') {
    proximo(new ErroAplicacao('Acesso restrito ao administrador.', 403));
    return;
  }
  // Libera administradores autenticados.
  proximo();
}
