import prisma from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { ensureGroupAccess } from '../services/permissionService.js';

function splitAmountEqually(amount, participantIds) {
  const cents = Math.round(Number(amount) * 100);
  const base = Math.floor(cents / participantIds.length);
  let remainder = cents - base * participantIds.length;

  return participantIds.map((userId) => {
    const extraCent = remainder > 0 ? 1 : 0;
    remainder -= extraCent;
    return { userId, amount: ((base + extraCent) / 100).toFixed(2) };
  });
}

async function validateExpenseData(groupId, { amount, payerId, categoryId, participantIds }) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new AppError('O valor da despesa deve ser maior que zero.');
  }

  const uniqueParticipants = [...new Set((participantIds || []).map(Number))];
  if (uniqueParticipants.length === 0) {
    throw new AppError('Selecione pelo menos um participante.');
  }

  const memberIds = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });
  const allowed = new Set(memberIds.map((item) => item.userId));

  if (!allowed.has(Number(payerId)) || uniqueParticipants.some((id) => !allowed.has(id))) {
    throw new AppError('O pagador e os participantes precisam pertencer ao grupo.');
  }

  const category = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
  if (!category) throw new AppError('Categoria não encontrada.', 404);

  return { numericAmount, uniqueParticipants };
}

export async function createExpense(request, response) {
  const groupId = Number(request.params.groupId);
  await ensureGroupAccess(groupId, request.user);
  const { title, description, amount, date, payerId, categoryId, participantIds } = request.body;

  if (!title?.trim()) throw new AppError('Informe o título da despesa.');
  const { numericAmount, uniqueParticipants } = await validateExpenseData(groupId, {
    amount, payerId, categoryId, participantIds,
  });

  const expense = await prisma.expense.create({
    data: {
      groupId,
      title: title.trim(),
      description: description?.trim() || null,
      amount: numericAmount.toFixed(2),
      date: date ? new Date(`${date}T12:00:00`) : new Date(),
      payerId: Number(payerId),
      categoryId: Number(categoryId),
      createdById: request.user.id,
      shares: { create: splitAmountEqually(numericAmount, uniqueParticipants) },
    },
    include: {
      payer: { select: { id: true, name: true } },
      category: true,
      shares: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  response.status(201).json(expense);
}

export async function updateExpense(request, response) {
  const id = Number(request.params.id);
  const existing = await prisma.expense.findUnique({
    where: { id },
    include: { shares: true },
  });
  if (!existing) throw new AppError('Despesa não encontrada.', 404);
  await ensureGroupAccess(existing.groupId, request.user);

  if (request.user.role !== 'ADMIN' && existing.createdById !== request.user.id) {
    throw new AppError('Você só pode editar despesas cadastradas por você.', 403);
  }

  const { title, description, amount, date, payerId, categoryId, participantIds } = request.body;
  const finalAmount = amount ?? Number(existing.amount);
  const finalPayerId = payerId ?? existing.payerId;
  const finalCategoryId = categoryId ?? existing.categoryId;
  const finalParticipants = participantIds ?? existing.shares.map((share) => share.userId);

  const { numericAmount, uniqueParticipants } = await validateExpenseData(existing.groupId, {
    amount: finalAmount,
    payerId: finalPayerId,
    categoryId: finalCategoryId,
    participantIds: finalParticipants,
  });

  const expense = await prisma.$transaction(async (transaction) => {
    await transaction.expenseShare.deleteMany({ where: { expenseId: id } });
    return transaction.expense.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        amount: numericAmount.toFixed(2),
        date: date !== undefined ? new Date(`${date}T12:00:00`) : undefined,
        payerId: Number(finalPayerId),
        categoryId: Number(finalCategoryId),
        shares: { create: splitAmountEqually(numericAmount, uniqueParticipants) },
      },
      include: {
        payer: { select: { id: true, name: true } },
        category: true,
        shares: { include: { user: { select: { id: true, name: true } } } },
      },
    });
  });

  response.json(expense);
}

export async function deleteExpense(request, response) {
  const id = Number(request.params.id);
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new AppError('Despesa não encontrada.', 404);
  await ensureGroupAccess(expense.groupId, request.user);

  if (request.user.role !== 'ADMIN' && expense.createdById !== request.user.id) {
    throw new AppError('Você só pode excluir despesas cadastradas por você.', 403);
  }

  await prisma.expense.delete({ where: { id } });
  response.status(204).send();
}
