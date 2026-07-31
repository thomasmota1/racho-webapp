import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { publicUser } from '../utils/serializers.js';

export async function overview(_request, response) {
  const [users, activeUsers, groups, expenses, settlements, totalExpense] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.group.count(),
    prisma.expense.count(),
    prisma.settlement.count(),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ]);

  response.json({
    users,
    activeUsers,
    groups,
    expenses,
    settlements,
    totalExpense: Number(totalExpense._sum.amount ?? 0),
  });
}

export async function listUsers(_request, response) {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  response.json(users.map(publicUser));
}

export async function updateUser(request, response) {
  const id = Number(request.params.id);
  const { name, email, role, active, password } = request.body;
  const data = {};

  if (name !== undefined) {
    if (!name.trim()) throw new AppError('O nome não pode ficar vazio.');
    data.name = name.trim();
  }
  if (email !== undefined) data.email = email.trim().toLowerCase();
  if (role !== undefined) {
    if (!['ADMIN', 'USER'].includes(role)) throw new AppError('Perfil inválido.');
    data.role = role;
  }
  if (active !== undefined) data.active = Boolean(active);
  if (password) {
    if (password.length < 6) throw new AppError('A senha precisa ter 6 caracteres.');
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({ where: { id }, data });
  response.json(publicUser(user));
}

export async function deleteUser(request, response) {
  const id = Number(request.params.id);
  if (id === request.user.id) throw new AppError('O administrador não pode excluir a própria conta.');

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('Usuário não encontrado.', 404);

  await prisma.user.delete({ where: { id } });
  response.status(204).send();
}

export async function listAllGroups(_request, response) {
  const groups = await prisma.group.findMany({
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { members: true, expenses: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  response.json(groups);
}

export async function listAllExpenses(_request, response) {
  const expenses = await prisma.expense.findMany({
    include: {
      group: { select: { id: true, name: true } },
      payer: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      category: true,
      shares: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  response.json(expenses);
}
