import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';
import { calcularSaldosGrupo, sugerirAcertos } from '../services/balanceService.js';
import { garantirAcessoGrupo, garantirGerenciaGrupo } from '../services/permissionService.js';

const INCLUSAO_COMPLETA_GRUPO = {
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

function arredondarValor(valor) {
  return Math.round(valor * 100) / 100;
}

function enriquecerGrupo(grupo) {
  const saldos = calcularSaldosGrupo(grupo);
  const totalDespesas = grupo.expenses.reduce(
    (total, despesa) => total + Number(despesa.amount),
    0,
  );

  return {
    ...grupo,
    totalExpenses: totalDespesas,
    balances: saldos,
    suggestions: sugerirAcertos(saldos),
  };
}

export async function obterDadosPainel(requisicao, resposta) {
  const grupos = await prisma.group.findMany({
    where: requisicao.usuario.role === 'ADMIN'
      ? {}
      : { members: { some: { userId: requisicao.usuario.id } } },
    include: INCLUSAO_COMPLETA_GRUPO,
    orderBy: { updatedAt: 'desc' },
  });

  let totalAReceber = 0;
  let totalADever = 0;
  let totalDespesas = 0;
  let acertosPendentes = 0;

  const cartoesGrupos = grupos.map((grupo) => {
    const grupoCompleto = enriquecerGrupo(grupo);
    const saldoUsuario = grupoCompleto.balances.find(
      (item) => item.user.id === requisicao.usuario.id,
    )?.balance ?? 0;

    if (saldoUsuario > 0) totalAReceber += saldoUsuario;
    if (saldoUsuario < 0) totalADever += Math.abs(saldoUsuario);
    totalDespesas += grupoCompleto.totalExpenses;
    acertosPendentes += grupo.settlements.filter((acerto) => (
      acerto.status === 'PENDING'
      && (acerto.payerId === requisicao.usuario.id
        || acerto.receiverId === requisicao.usuario.id)
    )).length;

    return {
      id: grupo.id,
      name: grupo.name,
      description: grupo.description,
      coverEmoji: grupo.coverEmoji,
      memberCount: grupo.members.length,
      expenseCount: grupo.expenses.length,
      totalExpenses: grupoCompleto.totalExpenses,
      ownBalance: saldoUsuario,
      updatedAt: grupo.updatedAt,
    };
  });

  resposta.json({
    summary: {
      receives: arredondarValor(totalAReceber),
      owes: arredondarValor(totalADever),
      net: arredondarValor(totalAReceber - totalADever),
      totalExpenses: arredondarValor(totalDespesas),
      groupCount: grupos.length,
      pendingSettlements: acertosPendentes,
    },
    groups: cartoesGrupos,
  });
}

export async function obterGrupo(requisicao, resposta) {
  const grupoId = Number(requisicao.params.id);
  await garantirAcessoGrupo(grupoId, requisicao.usuario);

  const grupo = await prisma.group.findUnique({
    where: { id: grupoId },
    include: INCLUSAO_COMPLETA_GRUPO,
  });
  resposta.json(enriquecerGrupo(grupo));
}

export async function criarGrupo(requisicao, resposta) {
  const {
    name: nome,
    description: descricao,
    coverEmoji: emoji = '🎉',
  } = requisicao.body;

  if (!nome?.trim()) throw new ErroAplicacao('Informe o nome do grupo.');

  const grupo = await prisma.group.create({
    data: {
      name: nome.trim(),
      description: descricao?.trim() || null,
      coverEmoji: emoji,
      createdById: requisicao.usuario.id,
      members: { create: { userId: requisicao.usuario.id } },
    },
    include: INCLUSAO_COMPLETA_GRUPO,
  });

  resposta.status(201).json(enriquecerGrupo(grupo));
}

export async function atualizarGrupo(requisicao, resposta) {
  const grupoId = Number(requisicao.params.id);
  await garantirGerenciaGrupo(grupoId, requisicao.usuario);

  const {
    name: nome,
    description: descricao,
    coverEmoji: emoji,
  } = requisicao.body;
  const dadosAtualizacao = {};

  if (nome !== undefined) {
    if (!nome.trim()) throw new ErroAplicacao('O nome do grupo não pode ficar vazio.');
    dadosAtualizacao.name = nome.trim();
  }
  if (descricao !== undefined) dadosAtualizacao.description = descricao?.trim() || null;
  if (emoji !== undefined) dadosAtualizacao.coverEmoji = emoji;

  const grupoAtualizado = await prisma.group.update({
    where: { id: grupoId },
    data: dadosAtualizacao,
    include: INCLUSAO_COMPLETA_GRUPO,
  });
  resposta.json(enriquecerGrupo(grupoAtualizado));
}

export async function excluirGrupo(requisicao, resposta) {
  const grupoId = Number(requisicao.params.id);
  await garantirGerenciaGrupo(grupoId, requisicao.usuario);
  await prisma.group.delete({ where: { id: grupoId } });
  resposta.status(204).send();
}

export async function adicionarMembro(requisicao, resposta) {
  const grupoId = Number(requisicao.params.id);
  await garantirGerenciaGrupo(grupoId, requisicao.usuario);

  const email = requisicao.body.email?.trim().toLowerCase();
  if (!email) throw new ErroAplicacao('Informe o e-mail da pessoa.');

  const usuario = await prisma.user.findUnique({ where: { email } });
  if (!usuario || !usuario.active) {
    throw new ErroAplicacao('Usuário não encontrado ou desativado.', 404);
  }

  const participacao = await prisma.groupMember.create({
    data: { groupId: grupoId, userId: usuario.id },
  });
  resposta.status(201).json(participacao);
}

export async function removerMembro(requisicao, resposta) {
  const grupoId = Number(requisicao.params.id);
  const usuarioId = Number(requisicao.params.userId);
  const grupo = await garantirGerenciaGrupo(grupoId, requisicao.usuario);

  if (grupo.createdById === usuarioId) {
    throw new ErroAplicacao('O criador não pode ser removido do próprio grupo.');
  }

  const quantidadeDespesas = await prisma.expense.count({
    where: {
      groupId: grupoId,
      OR: [{ payerId: usuarioId }, { shares: { some: { userId: usuarioId } } }],
    },
  });
  if (quantidadeDespesas > 0) {
    throw new ErroAplicacao(
      'Essa pessoa participa de despesas do grupo e não pode ser removida.',
      409,
    );
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId: grupoId, userId: usuarioId } },
  });
  resposta.status(204).send();
}
