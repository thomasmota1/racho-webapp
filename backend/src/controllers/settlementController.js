// Importa banco, erros e permissões.
import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';
import { garantirAcessoGrupo } from '../services/permissionService.js';

// Registra um novo pagamento.
export async function criarAcerto(requisicao, resposta) {
  // Valida o acesso ao grupo.
  const grupoId = Number(requisicao.params.groupId);
  await garantirAcessoGrupo(grupoId, requisicao.usuario);

  // Extrai os dados recebidos.
  const {
    payerId: pagadorId,
    receiverId: recebedorId,
    amount: valor,
    method: forma = 'PIX',
    note: observacao,
  } = requisicao.body;
  // Converte valores numéricos recebidos.
  const pagadorIdNumerico = Number(pagadorId);
  const recebedorIdNumerico = Number(recebedorId);
  const valorNumerico = Number(valor);

  // Exige pessoas diferentes.
  if (!pagadorIdNumerico || !recebedorIdNumerico || pagadorIdNumerico === recebedorIdNumerico) {
    throw new ErroAplicacao('Selecione pessoas diferentes para pagar e receber.');
  }
  // Exige um valor positivo.
  if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
    throw new ErroAplicacao('Informe um valor de pagamento válido.');
  }
  // Restringe pagamentos de terceiros.
  if (requisicao.usuario.role !== 'ADMIN' && pagadorIdNumerico !== requisicao.usuario.id) {
    throw new ErroAplicacao('Você só pode informar pagamentos feitos por você.', 403);
  }

  // Confere participantes do grupo.
  const quantidadeMembros = await prisma.groupMember.count({
    where: {
      groupId: grupoId,
      userId: { in: [pagadorIdNumerico, recebedorIdNumerico] },
    },
  });
  // Exige ambos como participantes.
  if (quantidadeMembros !== 2) {
    throw new ErroAplicacao('As duas pessoas precisam participar do grupo.');
  }

  // Salva o pagamento pendente.
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
  // Retorna o pagamento criado.
  resposta.status(201).json(acerto);
}

// Atualiza o status do pagamento.
export async function atualizarStatusAcerto(requisicao, resposta) {
  // Extrai identificador e status.
  const acertoId = Number(requisicao.params.id);
  const { status } = requisicao.body;

  // Valida o status informado.
  if (!['PENDING', 'CONFIRMED', 'REJECTED'].includes(status)) {
    throw new ErroAplicacao('Status de pagamento inválido.');
  }

  // Busca e valida o pagamento.
  const acerto = await prisma.settlement.findUnique({ where: { id: acertoId } });
  if (!acerto) throw new ErroAplicacao('Acerto não encontrado.', 404);
  await garantirAcessoGrupo(acerto.groupId, requisicao.usuario);

  // Confere permissão de confirmação.
  const usuarioPodeConfirmar = requisicao.usuario.role === 'ADMIN'
    || acerto.receiverId === requisicao.usuario.id;
  // Bloqueia usuários sem permissão.
  if (!usuarioPodeConfirmar) {
    throw new ErroAplicacao('Somente quem recebe pode confirmar ou recusar o pagamento.', 403);
  }

  // Salva status e confirmação.
  const acertoAtualizado = await prisma.settlement.update({
    where: { id: acertoId },
    data: {
      status,
      confirmedAt: status === 'CONFIRMED' ? new Date() : null,
    },
  });
  // Retorna o pagamento atualizado.
  resposta.json(acertoAtualizado);
}
