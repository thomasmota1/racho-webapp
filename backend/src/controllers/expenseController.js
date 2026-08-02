// Importa banco, erros e permissões.
import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';
import { garantirAcessoGrupo } from '../services/permissionService.js';

// Divide o valor em centavos.
function dividirValorIgualmente(valor, participantesIds) {
  // Calcula base e restante.
  const totalCentavos = Math.round(Number(valor) * 100);
  const centavosPorPessoa = Math.floor(totalCentavos / participantesIds.length);
  let centavosRestantes = totalCentavos - centavosPorPessoa * participantesIds.length;

  // Distribui centavos entre participantes.
  return participantesIds.map((usuarioId) => {
    // Adiciona centavo quando necessário.
    const centavoExtra = centavosRestantes > 0 ? 1 : 0;
    centavosRestantes -= centavoExtra;

    return {
      userId: usuarioId,
      amount: ((centavosPorPessoa + centavoExtra) / 100).toFixed(2),
    };
  });
}

// Valida dados compartilhados da despesa.
async function validarDadosDespesa(grupoId, dadosDespesa) {
  // Extrai os campos necessários.
  const {
    amount: valor,
    payerId: pagadorId,
    categoryId: categoriaId,
    participantIds: participantesIds,
  } = dadosDespesa;
  // Converte o valor recebido.
  const valorNumerico = Number(valor);

  // Exige um valor positivo.
  if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
    throw new ErroAplicacao('O valor da despesa deve ser maior que zero.');
  }

  // Remove participantes duplicados.
  const participantesUnicos = [...new Set((participantesIds || []).map(Number))];
  // Exige ao menos um participante.
  if (participantesUnicos.length === 0) {
    throw new ErroAplicacao('Selecione pelo menos um participante.');
  }

  // Busca os membros permitidos.
  const membros = await prisma.groupMember.findMany({
    where: { groupId: grupoId },
    select: { userId: true },
  });
  // Confere pagador e participantes.
  const membrosPermitidos = new Set(membros.map((membro) => membro.userId));
  const pagadorParticipa = membrosPermitidos.has(Number(pagadorId));
  const todosParticipam = participantesUnicos.every((id) => membrosPermitidos.has(id));

  // Rejeita pessoas externas ao grupo.
  if (!pagadorParticipa || !todosParticipam) {
    throw new ErroAplicacao('O pagador e os participantes precisam pertencer ao grupo.');
  }

  // Confere a categoria informada.
  const categoria = await prisma.category.findUnique({ where: { id: Number(categoriaId) } });
  if (!categoria) throw new ErroAplicacao('Categoria não encontrada.', 404);

  // Entrega os dados normalizados.
  return { valorNumerico, participantesUnicos };
}

// Define relações retornadas da despesa.
function dadosRelacionadosDaDespesa() {
  return {
    payer: { select: { id: true, name: true } },
    category: true,
    shares: { include: { user: { select: { id: true, name: true } } } },
  };
}

// Cria uma despesa no grupo.
export async function criarDespesa(requisicao, resposta) {
  // Valida o acesso ao grupo.
  const grupoId = Number(requisicao.params.groupId);
  await garantirAcessoGrupo(grupoId, requisicao.usuario);

  // Extrai os dados recebidos.
  const {
    title: titulo,
    description: descricao,
    amount: valor,
    date: data,
    payerId: pagadorId,
    categoryId: categoriaId,
    participantIds: participantesIds,
  } = requisicao.body;

  // Valida título e participantes.
  if (!titulo?.trim()) throw new ErroAplicacao('Informe o título da despesa.');
  const { valorNumerico, participantesUnicos } = await validarDadosDespesa(grupoId, {
    amount: valor,
    payerId: pagadorId,
    categoryId: categoriaId,
    participantIds: participantesIds,
  });

  // Salva despesa e divisões.
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

  // Retorna a despesa criada.
  resposta.status(201).json(despesa);
}

// Atualiza uma despesa existente.
export async function atualizarDespesa(requisicao, resposta) {
  // Busca a despesa informada.
  const despesaId = Number(requisicao.params.id);
  const despesaAtual = await prisma.expense.findUnique({
    where: { id: despesaId },
    include: { shares: true },
  });

  // Valida existência e acesso.
  if (!despesaAtual) throw new ErroAplicacao('Despesa não encontrada.', 404);
  await garantirAcessoGrupo(despesaAtual.groupId, requisicao.usuario);

  // Confere permissão de edição.
  const podeEditar = requisicao.usuario.role === 'ADMIN'
    || despesaAtual.createdById === requisicao.usuario.id;
  // Bloqueia usuários sem permissão.
  if (!podeEditar) {
    throw new ErroAplicacao('Você só pode editar despesas cadastradas por você.', 403);
  }

  // Extrai os campos alteráveis.
  const {
    title: titulo,
    description: descricao,
    amount: valor,
    date: data,
    payerId: pagadorId,
    categoryId: categoriaId,
    participantIds: participantesIds,
  } = requisicao.body;

  // Impede título vazio.
  if (titulo !== undefined && !titulo.trim()) {
    throw new ErroAplicacao('O título da despesa não pode ficar vazio.');
  }

  // Combina dados novos e atuais.
  const valorFinal = valor ?? Number(despesaAtual.amount);
  const pagadorFinalId = pagadorId ?? despesaAtual.payerId;
  const categoriaFinalId = categoriaId ?? despesaAtual.categoryId;
  const participantesFinais = participantesIds
    ?? despesaAtual.shares.map((parte) => parte.userId);
  // Valida os dados combinados.
  const { valorNumerico, participantesUnicos } = await validarDadosDespesa(
    despesaAtual.groupId,
    {
      amount: valorFinal,
      payerId: pagadorFinalId,
      categoryId: categoriaFinalId,
      participantIds: participantesFinais,
    },
  );

  // Atualiza despesa numa transação.
  const despesaAtualizada = await prisma.$transaction(async (transacao) => {
    // Remove as divisões anteriores.
    await transacao.expenseShare.deleteMany({ where: { expenseId: despesaId } });

    // Salva dados e novas divisões.
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

  // Retorna a despesa atualizada.
  resposta.json(despesaAtualizada);
}

// Exclui uma despesa existente.
export async function excluirDespesa(requisicao, resposta) {
  // Busca a despesa informada.
  const despesaId = Number(requisicao.params.id);
  const despesa = await prisma.expense.findUnique({ where: { id: despesaId } });

  // Valida existência e acesso.
  if (!despesa) throw new ErroAplicacao('Despesa não encontrada.', 404);
  await garantirAcessoGrupo(despesa.groupId, requisicao.usuario);

  // Confere permissão de exclusão.
  const podeExcluir = requisicao.usuario.role === 'ADMIN'
    || despesa.createdById === requisicao.usuario.id;
  // Bloqueia usuários sem permissão.
  if (!podeExcluir) {
    throw new ErroAplicacao('Você só pode excluir despesas cadastradas por você.', 403);
  }

  // Exclui e encerra a resposta.
  await prisma.expense.delete({ where: { id: despesaId } });
  resposta.status(204).send();
}
