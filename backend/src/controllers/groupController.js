import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';
import { calcularSaldosGrupo, sugerirAcertos } from '../services/balanceService.js';
import { garantirAcessoGrupo, garantirGerenciaGrupo } from '../services/permissionService.js';

// define relações completas do grupo
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

// Arredonda valores para centavos.
function arredondarValor(valor) {
  return Math.round(valor * 100) / 100;
}

// adiciona totais e saldos
function enriquecerGrupo(grupo) {
  const saldos = calcularSaldosGrupo(grupo);
  const totalDespesas = grupo.expenses.reduce(
    (total, despesa) => total + Number(despesa.amount),
    0,
  );

  // anexa os dados calculados.
  return {
    ...grupo,
    totalExpenses: totalDespesas,
    balances: saldos,
    suggestions: sugerirAcertos(saldos),
  };
}

// Retorna o painel do usuário.
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

  // Resume cada grupo encontrado.
  const cartoesGrupos = grupos.map((grupo) => {
    const grupoCompleto = enriquecerGrupo(grupo);
    const saldoUsuario = grupoCompleto.balances.find(
      (item) => item.user.id === requisicao.usuario.id,
    )?.balance ?? 0;

    // Acumula os totais gerais.
    if (saldoUsuario > 0) totalAReceber += saldoUsuario;
    if (saldoUsuario < 0) totalADever += Math.abs(saldoUsuario);
    totalDespesas += grupoCompleto.totalExpenses;
    acertosPendentes += grupo.settlements.filter((acerto) => (
      acerto.status === 'PENDING'
      && (acerto.payerId === requisicao.usuario.id
        || acerto.receiverId === requisicao.usuario.id)
    )).length;

    // Monta o cartão resumido.
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

  // Retorna resumo e cartões.
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

// Retorna um grupo completo.
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
  // extrai os dados recebidos
  const {
    name: nome,
    description: descricao,
    coverEmoji: emoji = '🎉',
  } = requisicao.body;

  if (!nome?.trim()) throw new ErroAplicacao('Informe o nome do grupo.');

  // salva grupo e primeiro membro
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

  // retorna o grupo criado
  resposta.status(201).json(enriquecerGrupo(grupo));
}


export async function atualizarGrupo(requisicao, resposta) {
  // valida permissão de gerenciamento
  const grupoId = Number(requisicao.params.id);
  await garantirGerenciaGrupo(grupoId, requisicao.usuario);

  const {
    name: nome,
    description: descricao,
    coverEmoji: emoji,
  } = requisicao.body;
  // acumula somente campos informados
  const dadosAtualizacao = {};

  if (nome !== undefined) {
    if (!nome.trim()) throw new ErroAplicacao('O nome do grupo não pode ficar vazio.');
    dadosAtualizacao.name = nome.trim();
  }
  if (descricao !== undefined) dadosAtualizacao.description = descricao?.trim() || null;
  if (emoji !== undefined) dadosAtualizacao.coverEmoji = emoji;

  // salva as alterações
  const grupoAtualizado = await prisma.group.update({
    where: { id: grupoId },
    data: dadosAtualizacao,
    include: INCLUSAO_COMPLETA_GRUPO,
  });
  // retorna o grupo atualizado
  resposta.json(enriquecerGrupo(grupoAtualizado));
}

export async function excluirGrupo(requisicao, resposta) {
  const grupoId = Number(requisicao.params.id);
  await garantirGerenciaGrupo(grupoId, requisicao.usuario);
  // exclui e encerra a resposta
  await prisma.group.delete({ where: { id: grupoId } });
  resposta.status(204).send();
}

export async function adicionarMembro(requisicao, resposta) {
  // Valida permissão de gerenciamento.
  const grupoId = Number(requisicao.params.id);
  await garantirGerenciaGrupo(grupoId, requisicao.usuario);

  const email = requisicao.body.email?.trim().toLowerCase();
  if (!email) throw new ErroAplicacao('Informe o e-mail da pessoa.');

  // ativo ou nao
  const usuario = await prisma.user.findUnique({ where: { email } });
  if (!usuario || !usuario.active) {
    throw new ErroAplicacao('Usuário não encontrado ou desativado.', 404);
  }

  // salva nova participacao
  const participacao = await prisma.groupMember.create({
    data: { groupId: grupoId, userId: usuario.id },
  });
  // retorna a participação criada
  resposta.status(201).json(participacao);
}

export async function removerMembro(requisicao, resposta) {
  // analisa grupo, usuário e permissão
  const grupoId = Number(requisicao.params.id);
  const usuarioId = Number(requisicao.params.userId);
  const grupo = await garantirGerenciaGrupo(grupoId, requisicao.usuario);

  // Protege o criador do grupo
  if (grupo.createdById === usuarioId) {
    throw new ErroAplicacao('O criador não pode ser removido do próprio grupo.');
  }

  // Conta despesas do participante.
  const quantidadeDespesas = await prisma.expense.count({
    where: {
      groupId: grupoId,
      OR: [{ payerId: usuarioId }, { shares: { some: { userId: usuarioId } } }],
    },
  });
  // Preserva participantes com despesas.
  if (quantidadeDespesas > 0) {
    throw new ErroAplicacao(
      'Essa pessoa participa de despesas do grupo e não pode ser removida.',
      409,
    );
  }

  // Remove e encerra a resposta.
  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId: grupoId, userId: usuarioId } },
  });
  resposta.status(204).send();
}
