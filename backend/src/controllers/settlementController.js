import prisma from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { ensureGroupAccess } from '../services/permissionService.js';

export async function createSettlement(request, response) {
  const groupId = Number(request.params.groupId);
  await ensureGroupAccess(groupId, request.user);
  const { payerId, receiverId, amount, method = 'PIX', note } = request.body;
  const numericPayer = Number(payerId);
  const numericReceiver = Number(receiverId);
  const numericAmount = Number(amount);

  if (!numericPayer || !numericReceiver || numericPayer === numericReceiver) {
    throw new AppError('Selecione pessoas diferentes para pagar e receber.');
  }
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new AppError('Informe um valor de pagamento válido.');
  }
  if (request.user.role !== 'ADMIN' && numericPayer !== request.user.id) {
    throw new AppError('Você só pode informar pagamentos feitos por você.', 403);
  }

  const memberCount = await prisma.groupMember.count({
    where: { groupId, userId: { in: [numericPayer, numericReceiver] } },
  });
  if (memberCount !== 2) throw new AppError('As duas pessoas precisam participar do grupo.');

  const settlement = await prisma.settlement.create({
    data: {
      groupId,
      payerId: numericPayer,
      receiverId: numericReceiver,
      createdById: request.user.id,
      amount: numericAmount.toFixed(2),
      method,
      note: note?.trim() || null,
    },
    include: {
      payer: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
  });
  response.status(201).json(settlement);
}

export async function updateSettlementStatus(request, response) {
  const id = Number(request.params.id);
  const { status } = request.body;
  if (!['PENDING', 'CONFIRMED', 'REJECTED'].includes(status)) {
    throw new AppError('Status de pagamento inválido.');
  }

  const settlement = await prisma.settlement.findUnique({ where: { id } });
  if (!settlement) throw new AppError('Acerto não encontrado.', 404);
  await ensureGroupAccess(settlement.groupId, request.user);

  if (request.user.role !== 'ADMIN' && settlement.receiverId !== request.user.id) {
    throw new AppError('Somente quem recebe pode confirmar ou recusar o pagamento.', 403);
  }

  const updated = await prisma.settlement.update({
    where: { id },
    data: {
      status,
      confirmedAt: status === 'CONFIRMED' ? new Date() : null,
    },
  });
  response.json(updated);
}
