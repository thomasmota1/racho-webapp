import { AppError } from '../utils/AppError.js';

export function notFound(request, _response, next) {
  next(new AppError(`Rota não encontrada: ${request.method} ${request.originalUrl}`, 404));
}

export function errorHandler(error, _request, response, _next) {
  if (error.code === 'P2002') {
    response.status(409).json({ message: 'Já existe um registro com essas informações.' });
    return;
  }

  if (error.code === 'P2025') {
    response.status(404).json({ message: 'Registro não encontrado.' });
    return;
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Erro interno do servidor.';

  if (statusCode >= 500) {
    console.error(error);
  }

  response.status(statusCode).json({ message });
}
