// Importa banco e erros padronizados.
import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';

// Lista categorias permitidas ao usuário.
export async function listarCategorias(requisicao, resposta) {
  // Filtra categorias conforme o perfil.
  const categorias = await prisma.category.findMany({
    where: requisicao.usuario.role === 'ADMIN' ? {} : { active: true },
    orderBy: { name: 'asc' },
  });
  // Retorna as categorias encontradas.
  resposta.json(categorias);
}

// Cria uma categoria global.
export async function criarCategoria(requisicao, resposta) {
  // Extrai e valida os dados.
  const { name: nome, icon: icone = '🧾', color: cor = '#6558d3' } = requisicao.body;
  if (!nome?.trim()) throw new ErroAplicacao('Informe o nome da categoria.');

  // Salva a nova categoria.
  const categoria = await prisma.category.create({
    data: { name: nome.trim(), icon: icone, color: cor },
  });
  // Retorna a categoria criada.
  resposta.status(201).json(categoria);
}

// Atualiza uma categoria existente.
export async function atualizarCategoria(requisicao, resposta) {
  // Extrai identificador e alterações.
  const categoriaId = Number(requisicao.params.id);
  const {
    name: nome,
    icon: icone,
    color: cor,
    active: ativa,
  } = requisicao.body;
  // Acumula somente campos informados.
  const dadosAtualizacao = {};

  // Valida e atualiza o nome.
  if (nome !== undefined) {
    if (!nome.trim()) throw new ErroAplicacao('O nome da categoria não pode ficar vazio.');
    dadosAtualizacao.name = nome.trim();
  }
  // Atualiza ícone e cor opcionais.
  if (icone !== undefined) dadosAtualizacao.icon = icone;
  if (cor !== undefined) dadosAtualizacao.color = cor;
  // Valida e atualiza o status.
  if (ativa !== undefined) {
    if (typeof ativa !== 'boolean') throw new ErroAplicacao('Status da categoria inválido.');
    dadosAtualizacao.active = ativa;
  }

  // Salva as alterações recebidas.
  const categoriaAtualizada = await prisma.category.update({
    where: { id: categoriaId },
    data: dadosAtualizacao,
  });
  // Retorna a categoria atualizada.
  resposta.json(categoriaAtualizada);
}

// Exclui uma categoria livre.
export async function excluirCategoria(requisicao, resposta) {
  // Obtém o identificador recebido.
  const categoriaId = Number(requisicao.params.id);
  // Conta despesas relacionadas.
  const quantidadeDespesas = await prisma.expense.count({ where: { categoryId: categoriaId } });

  // Impede exclusão quando utilizada.
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
