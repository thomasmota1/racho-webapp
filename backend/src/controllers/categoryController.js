import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';

export async function listarCategorias(requisicao, resposta) {
  const categorias = await prisma.category.findMany({
    where: requisicao.usuario.role === 'ADMIN' ? {} : { active: true },
    orderBy: { name: 'asc' },
  });
  resposta.json(categorias);
}

export async function criarCategoria(requisicao, resposta) {
  const { name: nome, icon: icone = '🧾', color: cor = '#6558d3' } = requisicao.body;
  if (!nome?.trim()) throw new ErroAplicacao('Informe o nome da categoria.');

  const categoria = await prisma.category.create({
    data: { name: nome.trim(), icon: icone, color: cor },
  });
  resposta.status(201).json(categoria);
}

export async function atualizarCategoria(requisicao, resposta) {
  const categoriaId = Number(requisicao.params.id);
  const {
    name: nome,
    icon: icone,
    color: cor,
    active: ativa,
  } = requisicao.body;
  const dadosAtualizacao = {};

  if (nome !== undefined) {
    if (!nome.trim()) throw new ErroAplicacao('O nome da categoria não pode ficar vazio.');
    dadosAtualizacao.name = nome.trim();
  }
  if (icone !== undefined) dadosAtualizacao.icon = icone;
  if (cor !== undefined) dadosAtualizacao.color = cor;
  // Valida e atualiza o status.
  if (ativa !== undefined) {
    if (typeof ativa !== 'boolean') throw new ErroAplicacao('Status da categoria inválido.');
    dadosAtualizacao.active = ativa;
  }

  const categoriaAtualizada = await prisma.category.update({
    where: { id: categoriaId },
    data: dadosAtualizacao,
  });
  resposta.json(categoriaAtualizada);
}

// Exclui uma categoria livre.
export async function excluirCategoria(requisicao, resposta) {
  const categoriaId = Number(requisicao.params.id);
  const quantidadeDespesas = await prisma.expense.count({ where: { categoryId: categoriaId } });

  // Impede exclusão quando utilizada
  if (quantidadeDespesas > 0) {
    throw new ErroAplicacao(
      'Essa categoria já está sendo usada. Desative-a em vez de excluir.',
      409,
    );
  }

  // Exclui e encerra a resposta.
  await prisma.category.delete({ where: { id: categoriaId } });
  resposta.status(204).send();
}
