// Importa banco, erros e serialização.
import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';
import { dadosPublicosUsuario } from '../utils/serializers.js';

// Retorna números gerais da aplicação.
export async function obterResumo(_requisicao, resposta) {
  // Conta os registros em paralelo.
  const [usuarios, usuariosAtivos, grupos, despesas, acertos, somaDespesas] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.group.count(),
    prisma.expense.count(),
    prisma.settlement.count(),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ]);

  // Organiza o resumo retornado.
  resposta.json({
    users: usuarios,
    activeUsers: usuariosAtivos,
    groups: grupos,
    expenses: despesas,
    settlements: acertos,
    totalExpense: Number(somaDespesas._sum.amount ?? 0),
  });
}

// Lista todos os usuários.
export async function listarUsuarios(_requisicao, resposta) {
  // Busca usuários mais recentes.
  const usuarios = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  // Remove dados sensíveis retornados.
  resposta.json(usuarios.map(dadosPublicosUsuario));
}

// Atualiza acesso de um usuário.
export async function atualizarUsuario(requisicao, resposta) {
  // Extrai identificador e alterações.
  const usuarioId = Number(requisicao.params.id);
  const { name: nome, role: perfil, active: ativo } = requisicao.body;
  // Acumula somente campos informados.
  const dadosAtualizacao = {};

  // Valida e atualiza o nome.
  if (nome !== undefined) {
    if (!nome.trim()) throw new ErroAplicacao('O nome não pode ficar vazio.');
    dadosAtualizacao.name = nome.trim();
  }
  // Valida e atualiza o perfil.
  if (perfil !== undefined) {
    if (!['ADMIN', 'USER'].includes(perfil)) {
      throw new ErroAplicacao('Perfil inválido.');
    }
    dadosAtualizacao.role = perfil;
  }
  // Valida e atualiza o status.
  if (ativo !== undefined) {
    if (typeof ativo !== 'boolean') throw new ErroAplicacao('Status do usuário inválido.');
    dadosAtualizacao.active = ativo;
  }

  // Salva as alterações recebidas.
  const usuarioAtualizado = await prisma.user.update({
    where: { id: usuarioId },
    data: dadosAtualizacao,
  });
  // Retorna o usuário atualizado.
  resposta.json(dadosPublicosUsuario(usuarioAtualizado));
}

// Lista todos os grupos.
export async function listarGrupos(_requisicao, resposta) {
  // Busca criadores e contagens relacionadas.
  const grupos = await prisma.group.findMany({
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { members: true, expenses: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  // Retorna os grupos encontrados.
  resposta.json(grupos);
}
