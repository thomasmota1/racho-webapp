import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';

export async function autenticar(requisicao, _resposta, proximo) {
  try {
    const cabecalho = requisicao.headers.authorization;

    if (!cabecalho?.startsWith('Bearer ')) {
      throw new ErroAplicacao('Token de autenticação não informado.', 401);
    }

    const token = cabecalho.slice(7);
    const dadosToken = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await prisma.user.findUnique({ where: { id: dadosToken.userId } });

    if (!usuario || !usuario.active) {
      throw new ErroAplicacao('Usuário não encontrado ou desativado.', 401);
    }

    requisicao.usuario = usuario;
    proximo();
  } catch (erro) {
    if (erro.name === 'JsonWebTokenError' || erro.name === 'TokenExpiredError') {
      proximo(new ErroAplicacao('Sessão inválida ou expirada.', 401));
      return;
    }
    proximo(erro);
  }
}

export function exigirAdministrador(requisicao, _resposta, proximo) {
  if (requisicao.usuario.role !== 'ADMIN') {
    proximo(new ErroAplicacao('Acesso restrito ao administrador.', 403));
    return;
  }
  proximo();
}
