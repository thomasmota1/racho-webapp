import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { publicUser } from '../utils/serializers.js';

function createToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' },
  );
}

export async function register(request, response) {
  const { name, email, password } = request.body;

  if (!name?.trim() || !email?.trim() || !password) {
    throw new AppError('Nome, e-mail e senha são obrigatórios.');
  }

  if (password.length < 6) {
    throw new AppError('A senha precisa ter pelo menos 6 caracteres.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (existingUser) {
    throw new AppError('Já existe uma conta com esse e-mail.', 409);
  }

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  response.status(201).json({ token: createToken(user), user: publicUser(user) });
}

export async function login(request, response) {
  const { email, password } = request.body;

  if (!email || !password) {
    throw new AppError('Informe e-mail e senha.');
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError('E-mail ou senha incorretos.', 401);
  }

  if (!user.active) {
    throw new AppError('Esta conta foi desativada pelo administrador.', 403);
  }

  response.json({ token: createToken(user), user: publicUser(user) });
}

export async function me(request, response) {
  response.json(publicUser(request.user));
}

export async function updateProfile(request, response) {
  const { name, email, currentPassword, newPassword } = request.body;
  const data = {};

  if (name !== undefined) {
    if (!name.trim()) throw new AppError('O nome não pode ficar vazio.');
    data.name = name.trim();
  }

  if (email !== undefined) {
    if (!email.trim()) throw new AppError('O e-mail não pode ficar vazio.');
    data.email = email.trim().toLowerCase();
  }

  if (newPassword) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, request.user.passwordHash))) {
      throw new AppError('A senha atual está incorreta.', 401);
    }
    if (newPassword.length < 6) throw new AppError('A nova senha precisa ter 6 caracteres.');
    data.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  const user = await prisma.user.update({ where: { id: request.user.id }, data });
  response.json(publicUser(user));
}
