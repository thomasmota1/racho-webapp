import prisma from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { calculateGroupBalances, suggestSettlements } from '../services/balanceService.js';
import { ensureGroupAccess, ensureGroupManager } from '../services/permissionService.js';

const groupInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
  members: {
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: 'asc' },
  },
  expenses: {
    include: {
      payer: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      category: true,
      shares: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  },
  settlements: {
    include: {
      payer: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  },
};

function enrichGroup(group) {
  const balances = calculateGroupBalances(group);
  return {
    ...group,
    totalExpenses: group.expenses.reduce((total, expense) => total + Number(expense.amount), 0),
    balances,
    suggestions: suggestSettlements(balances),
  };
}

export async function dashboard(request, response) {
  const groups = await prisma.group.findMany({
    where: request.user.role === 'ADMIN'
      ? {}
      : { members: { some: { userId: request.user.id } } },
    include: groupInclude,
    orderBy: { updatedAt: 'desc' },
  });

  let receives = 0;
  let owes = 0;
  let totalExpenses = 0;
  let pendingSettlements = 0;

  const cards = groups.map((group) => {
    const enriched = enrichGroup(group);
    const ownBalance = enriched.balances.find((item) => item.user.id === request.user.id)?.balance ?? 0;
    if (ownBalance > 0) receives += ownBalance;
    if (ownBalance < 0) owes += Math.abs(ownBalance);
    totalExpenses += enriched.totalExpenses;
    pendingSettlements += group.settlements.filter((settlement) => (
      settlement.status === 'PENDING'
      && (settlement.payerId === request.user.id || settlement.receiverId === request.user.id)
    )).length;

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      coverEmoji: group.coverEmoji,
      memberCount: group.members.length,
      expenseCount: group.expenses.length,
      totalExpenses: enriched.totalExpenses,
      ownBalance,
      updatedAt: group.updatedAt,
    };
  });

  response.json({
    summary: {
      receives: Math.round(receives * 100) / 100,
      owes: Math.round(owes * 100) / 100,
      net: Math.round((receives - owes) * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      groupCount: groups.length,
      pendingSettlements,
    },
    groups: cards,
  });
}

export async function getGroup(request, response) {
  const id = Number(request.params.id);
  await ensureGroupAccess(id, request.user);
  const group = await prisma.group.findUnique({ where: { id }, include: groupInclude });
  response.json(enrichGroup(group));
}

export async function createGroup(request, response) {
  const { name, description, coverEmoji = '🎉' } = request.body;
  if (!name?.trim()) throw new AppError('Informe o nome do grupo.');

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      coverEmoji,
      createdById: request.user.id,
      members: { create: { userId: request.user.id } },
    },
    include: groupInclude,
  });

  response.status(201).json(enrichGroup(group));
}

export async function updateGroup(request, response) {
  const id = Number(request.params.id);
  await ensureGroupManager(id, request.user);
  const { name, description, coverEmoji } = request.body;
  const data = {};
  if (name !== undefined) {
    if (!name.trim()) throw new AppError('O nome do grupo não pode ficar vazio.');
    data.name = name.trim();
  }
  if (description !== undefined) data.description = description?.trim() || null;
  if (coverEmoji !== undefined) data.coverEmoji = coverEmoji;
  const group = await prisma.group.update({ where: { id }, data, include: groupInclude });
  response.json(enrichGroup(group));
}

export async function deleteGroup(request, response) {
  const id = Number(request.params.id);
  await ensureGroupManager(id, request.user);
  await prisma.group.delete({ where: { id } });
  response.status(204).send();
}

export async function addMember(request, response) {
  const groupId = Number(request.params.id);
  await ensureGroupManager(groupId, request.user);
  const email = request.body.email?.trim().toLowerCase();
  if (!email) throw new AppError('Informe o e-mail da pessoa.');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) throw new AppError('Usuário não encontrado ou desativado.', 404);

  const membership = await prisma.groupMember.create({ data: { groupId, userId: user.id } });
  response.status(201).json(membership);
}

export async function removeMember(request, response) {
  const groupId = Number(request.params.id);
  const userId = Number(request.params.userId);
  const group = await ensureGroupManager(groupId, request.user);

  if (group.createdById === userId) {
    throw new AppError('O criador não pode ser removido do próprio grupo.');
  }

  const hasData = await prisma.expense.count({
    where: {
      groupId,
      OR: [{ payerId: userId }, { shares: { some: { userId } } }],
    },
  });
  if (hasData > 0) {
    throw new AppError('Essa pessoa participa de despesas do grupo e não pode ser removida.', 409);
  }

  await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId } } });
  response.status(204).send();
}
