import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';
import { dadosPublicosUsuario } from '../utils/serializers.js';

export async function obterResumo(_requisicao, resposta) {
  const [usuarios, usuariosAtivos, grupos, despesas, acertos, somaDespesas] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.group.count(),
    prisma.expense.count(),
    prisma.settlement.count(),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ]);

  resposta.json({
    users: usuarios,
    activeUsers: usuariosAtivos,
    groups: grupos,
    expenses: despesas,
    settlements: acertos,
    totalExpense: Number(somaDespesas._sum.amount ?? 0),
  });
}

export async function listarUsuarios(_requisicao, resposta) {
  const usuarios = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  resposta.json(usuarios.map(dadosPublicosUsuario));
}

export async function atualizarUsuario(requisicao, resposta) {
  const usuarioId = Number(requisicao.params.id);
  const { name: nome, role: perfil, active: ativo } = requisicao.body;
  const dadosAtualizacao = {};

  if (nome !== undefined) {
    if (!nome.trim()) throw new ErroAplicacao('O nome não pode ficar vazio.');
    dadosAtualizacao.name = nome.trim();
  }
  if (perfil !== undefined) {
    if (!['ADMIN', 'USER'].includes(perfil)) {
      throw new ErroAplicacao('Perfil inválido.');
    }
    dadosAtualizacao.role = perfil;
  }
  if (ativo !== undefined) {
    if (typeof ativo !== 'boolean') throw new ErroAplicacao('Status do usuário inválido.');
    dadosAtualizacao.active = ativo;
  }

  const usuarioAtualizado = await prisma.user.update({
    where: { id: usuarioId },
    data: dadosAtualizacao,
  });
  resposta.json(dadosPublicosUsuario(usuarioAtualizado));
}

export async function listarGrupos(_requisicao, resposta) {
  const grupos = await prisma.group.findMany({
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { members: true, expenses: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  resposta.json(grupos);
}
