import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

export async function authenticate(request, _response, next) {
  try {
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Token de autenticação não informado.', 401);
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || !user.active) {
      throw new AppError('Usuário não encontrado ou desativado.', 401);
    }

    request.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AppError('Sessão inválida ou expirada.', 401));
      return;
    }
    next(error);
  }
}

export function requireAdmin(request, _response, next) {
  if (request.user.role !== 'ADMIN') {
    next(new AppError('Acesso restrito ao administrador.', 403));
    return;
  }
  next();
}
