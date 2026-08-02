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
  const { name, role, active } = request.body;
  const data = {};

  if (name !== undefined) {
    if (!name.trim()) throw new AppError('O nome não pode ficar vazio.');
    data.name = name.trim();
  }
  if (role !== undefined) {
    if (!['ADMIN', 'USER'].includes(role)) throw new AppError('Perfil inválido.');
    data.role = role;
  }
  if (active !== undefined) data.active = Boolean(active);
  const user = await prisma.user.update({ where: { id }, data });
  response.json(publicUser(user));
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
