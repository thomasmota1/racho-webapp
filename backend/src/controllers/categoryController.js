import prisma from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

export async function listCategories(request, response) {
  const categories = await prisma.category.findMany({
    where: request.user.role === 'ADMIN' ? {} : { active: true },
    orderBy: { name: 'asc' },
  });
  response.json(categories);
}

export async function createCategory(request, response) {
  const { name, icon = '🧾', color = '#6558d3' } = request.body;
  if (!name?.trim()) throw new AppError('Informe o nome da categoria.');

  const category = await prisma.category.create({
    data: { name: name.trim(), icon, color },
  });
  response.status(201).json(category);
}

export async function updateCategory(request, response) {
  const id = Number(request.params.id);
  const { name, icon, color, active } = request.body;
  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (icon !== undefined) data.icon = icon;
  if (color !== undefined) data.color = color;
  if (active !== undefined) data.active = Boolean(active);

  const category = await prisma.category.update({ where: { id }, data });
  response.json(category);
}

export async function deleteCategory(request, response) {
  const id = Number(request.params.id);
  const expenseCount = await prisma.expense.count({ where: { categoryId: id } });
  if (expenseCount > 0) {
    throw new AppError('Essa categoria já está sendo usada. Desative-a em vez de excluir.', 409);
  }
  await prisma.category.delete({ where: { id } });
  response.status(204).send();
}
