import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';
import { garantirAcessoGrupo } from '../services/permissionService.js';

function dividirValorIgualmente(valor, participantesIds) {
  const totalCentavos = Math.round(Number(valor) * 100);
  const centavosPorPessoa = Math.floor(totalCentavos / participantesIds.length);
  let centavosRestantes = totalCentavos - centavosPorPessoa * participantesIds.length;

  return participantesIds.map((usuarioId) => {
    const centavoExtra = centavosRestantes > 0 ? 1 : 0;
    centavosRestantes -= centavoExtra;

    return {
      userId: usuarioId,
      amount: ((centavosPorPessoa + centavoExtra) / 100).toFixed(2),
    };
  });
}

async function validarDadosDespesa(grupoId, dadosDespesa) {
  const {
    amount: valor,
    payerId: pagadorId,
    categoryId: categoriaId,
    participantIds: participantesIds,
  } = dadosDespesa;
  const valorNumerico = Number(valor);

  if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
    throw new ErroAplicacao('O valor da despesa deve ser maior que zero.');
  }

  const participantesUnicos = [...new Set((participantesIds || []).map(Number))];
  if (participantesUnicos.length === 0) {
    throw new ErroAplicacao('Selecione pelo menos um participante.');
  }

  const membros = await prisma.groupMember.findMany({
    where: { groupId: grupoId },
    select: { userId: true },
  });
  const membrosPermitidos = new Set(membros.map((membro) => membro.userId));
  const pagadorParticipa = membrosPermitidos.has(Number(pagadorId));
  const todosParticipam = participantesUnicos.every((id) => membrosPermitidos.has(id));

  if (!pagadorParticipa || !todosParticipam) {
    throw new ErroAplicacao('O pagador e os participantes precisam pertencer ao grupo.');
  }

  const categoria = await prisma.category.findUnique({ where: { id: Number(categoriaId) } });
  if (!categoria) throw new ErroAplicacao('Categoria não encontrada.', 404);

  return { valorNumerico, participantesUnicos };
}

function dadosRelacionadosDaDespesa() {
  return {
    payer: { select: { id: true, name: true } },
    category: true,
    shares: { include: { user: { select: { id: true, name: true } } } },
  };
}

export async function criarDespesa(requisicao, resposta) {
  const grupoId = Number(requisicao.params.groupId);
  await garantirAcessoGrupo(grupoId, requisicao.usuario);

  const {
    title: titulo,
    description: descricao,
    amount: valor,
    date: data,
    payerId: pagadorId,
    categoryId: categoriaId,
    participantIds: participantesIds,
  } = requisicao.body;

  if (!titulo?.trim()) throw new ErroAplicacao('Informe o título da despesa.');
  const { valorNumerico, participantesUnicos } = await validarDadosDespesa(grupoId, {
    amount: valor,
    payerId: pagadorId,
    categoryId: categoriaId,
    participantIds: participantesIds,
  });

  const despesa = await prisma.expense.create({
    data: {
      groupId: grupoId,
      title: titulo.trim(),
      description: descricao?.trim() || null,
      amount: valorNumerico.toFixed(2),
      date: data ? new Date(`${data}T12:00:00`) : new Date(),
      payerId: Number(pagadorId),
      categoryId: Number(categoriaId),
      createdById: requisicao.usuario.id,
      shares: { create: dividirValorIgualmente(valorNumerico, participantesUnicos) },
    },
    include: dadosRelacionadosDaDespesa(),
  });

  resposta.status(201).json(despesa);
}

export async function atualizarDespesa(requisicao, resposta) {
  const despesaId = Number(requisicao.params.id);
  const despesaAtual = await prisma.expense.findUnique({
    where: { id: despesaId },
    include: { shares: true },
  });

  if (!despesaAtual) throw new ErroAplicacao('Despesa não encontrada.', 404);
  await garantirAcessoGrupo(despesaAtual.groupId, requisicao.usuario);

  const podeEditar = requisicao.usuario.role === 'ADMIN'
    || despesaAtual.createdById === requisicao.usuario.id;
  if (!podeEditar) {
    throw new ErroAplicacao('Você só pode editar despesas cadastradas por você.', 403);
  }

  const {
    title: titulo,
    description: descricao,
    amount: valor,
    date: data,
    payerId: pagadorId,
    categoryId: categoriaId,
    participantIds: participantesIds,
  } = requisicao.body;

  if (titulo !== undefined && !titulo.trim()) {
    throw new ErroAplicacao('O título da despesa não pode ficar vazio.');
  }

  const valorFinal = valor ?? Number(despesaAtual.amount);
  const pagadorFinalId = pagadorId ?? despesaAtual.payerId;
  const categoriaFinalId = categoriaId ?? despesaAtual.categoryId;
  const participantesFinais = participantesIds
    ?? despesaAtual.shares.map((parte) => parte.userId);
  const { valorNumerico, participantesUnicos } = await validarDadosDespesa(
    despesaAtual.groupId,
    {
      amount: valorFinal,
      payerId: pagadorFinalId,
      categoryId: categoriaFinalId,
      participantIds: participantesFinais,
    },
  );

  const despesaAtualizada = await prisma.$transaction(async (transacao) => {
    await transacao.expenseShare.deleteMany({ where: { expenseId: despesaId } });

    return transacao.expense.update({
      where: { id: despesaId },
      data: {
        title: titulo !== undefined ? titulo.trim() : undefined,
        description: descricao !== undefined ? descricao?.trim() || null : undefined,
        amount: valorNumerico.toFixed(2),
        date: data !== undefined ? new Date(`${data}T12:00:00`) : undefined,
        payerId: Number(pagadorFinalId),
        categoryId: Number(categoriaFinalId),
        shares: { create: dividirValorIgualmente(valorNumerico, participantesUnicos) },
      },
      include: dadosRelacionadosDaDespesa(),
    });
  });

  resposta.json(despesaAtualizada);
}

export async function excluirDespesa(requisicao, resposta) {
  const despesaId = Number(requisicao.params.id);
  const despesa = await prisma.expense.findUnique({ where: { id: despesaId } });

  if (!despesa) throw new ErroAplicacao('Despesa não encontrada.', 404);
  await garantirAcessoGrupo(despesa.groupId, requisicao.usuario);

  const podeExcluir = requisicao.usuario.role === 'ADMIN'
    || despesa.createdById === requisicao.usuario.id;
  if (!podeExcluir) {
    throw new ErroAplicacao('Você só pode excluir despesas cadastradas por você.', 403);
  }

  await prisma.expense.delete({ where: { id: despesaId } });
  resposta.status(204).send();
}
