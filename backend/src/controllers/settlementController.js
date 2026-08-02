import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';
import { garantirAcessoGrupo } from '../services/permissionService.js';

export async function criarAcerto(requisicao, resposta) {
  const grupoId = Number(requisicao.params.groupId);
  await garantirAcessoGrupo(grupoId, requisicao.usuario);

  const {
    payerId: pagadorId,
    receiverId: recebedorId,
    amount: valor,
    method: forma = 'PIX',
    note: observacao,
  } = requisicao.body;
  const pagadorIdNumerico = Number(pagadorId);
  const recebedorIdNumerico = Number(recebedorId);
  const valorNumerico = Number(valor);

  if (!pagadorIdNumerico || !recebedorIdNumerico || pagadorIdNumerico === recebedorIdNumerico) {
    throw new ErroAplicacao('Selecione pessoas diferentes para pagar e receber.');
  }
  if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
    throw new ErroAplicacao('Informe um valor de pagamento válido.');
  }
  if (requisicao.usuario.role !== 'ADMIN' && pagadorIdNumerico !== requisicao.usuario.id) {
    throw new ErroAplicacao('Você só pode informar pagamentos feitos por você.', 403);
  }

  const quantidadeMembros = await prisma.groupMember.count({
    where: {
      groupId: grupoId,
      userId: { in: [pagadorIdNumerico, recebedorIdNumerico] },
    },
  });
  if (quantidadeMembros !== 2) {
    throw new ErroAplicacao('As duas pessoas precisam participar do grupo.');
  }

  const acerto = await prisma.settlement.create({
    data: {
      groupId: grupoId,
      payerId: pagadorIdNumerico,
      receiverId: recebedorIdNumerico,
      createdById: requisicao.usuario.id,
      amount: valorNumerico.toFixed(2),
      method: forma,
      note: observacao?.trim() || null,
    },
    include: {
      payer: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
  });
  resposta.status(201).json(acerto);
}

export async function atualizarStatusAcerto(requisicao, resposta) {
  const acertoId = Number(requisicao.params.id);
  const { status } = requisicao.body;

  if (!['PENDING', 'CONFIRMED', 'REJECTED'].includes(status)) {
    throw new ErroAplicacao('Status de pagamento inválido.');
  }

  const acerto = await prisma.settlement.findUnique({ where: { id: acertoId } });
  if (!acerto) throw new ErroAplicacao('Acerto não encontrado.', 404);
  await garantirAcessoGrupo(acerto.groupId, requisicao.usuario);

  const usuarioPodeConfirmar = requisicao.usuario.role === 'ADMIN'
    || acerto.receiverId === requisicao.usuario.id;
  if (!usuarioPodeConfirmar) {
    throw new ErroAplicacao('Somente quem recebe pode confirmar ou recusar o pagamento.', 403);
  }

  const acertoAtualizado = await prisma.settlement.update({
    where: { id: acertoId },
    data: {
      status,
      confirmedAt: status === 'CONFIRMED' ? new Date() : null,
    },
  });
  resposta.json(acertoAtualizado);
}
