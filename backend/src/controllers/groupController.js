// Importa banco, saldos e permissões.
import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';
import { calcularSaldosGrupo, sugerirAcertos } from '../services/balanceService.js';
import { garantirAcessoGrupo, garantirGerenciaGrupo } from '../services/permissionService.js';

// Define relações completas do grupo.
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

// Adiciona totais e saldos.
function enriquecerGrupo(grupo) {
  // Calcula saldos e total gasto.
  const saldos = calcularSaldosGrupo(grupo);
  const totalDespesas = grupo.expenses.reduce(
    (total, despesa) => total + Number(despesa.amount),
    0,
  );

  // Anexa os dados calculados.
  return {
    ...grupo,
    totalExpenses: totalDespesas,
    balances: saldos,
    suggestions: sugerirAcertos(saldos),
  };
}

// Retorna o painel do usuário.
export async function obterDadosPainel(requisicao, resposta) {
  // Busca grupos visíveis ao perfil.
  const grupos = await prisma.group.findMany({
    where: requisicao.usuario.role === 'ADMIN'
      ? {}
      : { members: { some: { userId: requisicao.usuario.id } } },
    include: INCLUSAO_COMPLETA_GRUPO,
    orderBy: { updatedAt: 'desc' },
  });

  // Inicializa os totais do painel.
  let totalAReceber = 0;
  let totalADever = 0;
  let totalDespesas = 0;
  let acertosPendentes = 0;

  // Resume cada grupo encontrado.
  const cartoesGrupos = grupos.map((grupo) => {
    // Calcula o saldo do usuário.
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
  // Valida acesso ao identificador.
  const grupoId = Number(requisicao.params.id);
  await garantirAcessoGrupo(grupoId, requisicao.usuario);

  // Busca todos os relacionamentos.
  const grupo = await prisma.group.findUnique({
    where: { id: grupoId },
    include: INCLUSAO_COMPLETA_GRUPO,
  });
  // Retorna dados enriquecidos.
  resposta.json(enriquecerGrupo(grupo));
}

// Cria um grupo de despesas.
export async function criarGrupo(requisicao, resposta) {
  // Extrai os dados recebidos.
  const {
    name: nome,
    description: descricao,
    coverEmoji: emoji = '🎉',
  } = requisicao.body;

  // Exige o nome do grupo.
  if (!nome?.trim()) throw new ErroAplicacao('Informe o nome do grupo.');

  // Salva grupo e primeiro membro.
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

  // Retorna o grupo criado.
  resposta.status(201).json(enriquecerGrupo(grupo));
}

// Atualiza os dados do grupo.
export async function atualizarGrupo(requisicao, resposta) {
  // Valida permissão de gerenciamento.
  const grupoId = Number(requisicao.params.id);
  await garantirGerenciaGrupo(grupoId, requisicao.usuario);

  // Extrai os campos alteráveis.
  const {
    name: nome,
    description: descricao,
    coverEmoji: emoji,
  } = requisicao.body;
  // Acumula somente campos informados.
  const dadosAtualizacao = {};

  // Valida e atualiza o nome.
  if (nome !== undefined) {
    if (!nome.trim()) throw new ErroAplicacao('O nome do grupo não pode ficar vazio.');
    dadosAtualizacao.name = nome.trim();
  }
  if (descricao !== undefined) dadosAtualizacao.description = descricao?.trim() || null;
  if (emoji !== undefined) dadosAtualizacao.coverEmoji = emoji;

  // Salva as alterações recebidas.
  const grupoAtualizado = await prisma.group.update({
    where: { id: grupoId },
    data: dadosAtualizacao,
    include: INCLUSAO_COMPLETA_GRUPO,
  });
  // Retorna o grupo atualizado.
  resposta.json(enriquecerGrupo(grupoAtualizado));
}

// Exclui um grupo completo.
export async function excluirGrupo(requisicao, resposta) {
  // Valida permissão de gerenciamento.
  const grupoId = Number(requisicao.params.id);
  await garantirGerenciaGrupo(grupoId, requisicao.usuario);
  // Exclui e encerra a resposta.
  await prisma.group.delete({ where: { id: grupoId } });
  resposta.status(204).send();
}

// Adiciona membro ao grupo.
export async function adicionarMembro(requisicao, resposta) {
  // Valida permissão de gerenciamento.
  const grupoId = Number(requisicao.params.id);
  await garantirGerenciaGrupo(grupoId, requisicao.usuario);

  // Normaliza o e-mail recebido.
  const email = requisicao.body.email?.trim().toLowerCase();
  if (!email) throw new ErroAplicacao('Informe o e-mail da pessoa.');

  // Busca um usuário ativo.
  const usuario = await prisma.user.findUnique({ where: { email } });
  if (!usuario || !usuario.active) {
    throw new ErroAplicacao('Usuário não encontrado ou desativado.', 404);
  }

  // Salva a nova participação.
  const participacao = await prisma.groupMember.create({
    data: { groupId: grupoId, userId: usuario.id },
  });
  // Retorna a participação criada.
  resposta.status(201).json(participacao);
}

// Remove membro do grupo.
export async function removerMembro(requisicao, resposta) {
  // Obtém grupo, usuário e permissão.
  const grupoId = Number(requisicao.params.id);
  const usuarioId = Number(requisicao.params.userId);
  const grupo = await garantirGerenciaGrupo(grupoId, requisicao.usuario);

  // Protege o criador do grupo.
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
