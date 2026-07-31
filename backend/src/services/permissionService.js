import prisma from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

export async function getMembership(groupId, userId) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

export async function ensureGroupAccess(groupId, user) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });

  if (!group) {
    throw new AppError('Grupo não encontrado.', 404);
  }

  if (user.role === 'ADMIN') {
    return group;
  }

  const membership = await getMembership(groupId, user.id);
  if (!membership) {
    throw new AppError('Você não participa deste grupo.', 403);
  }

  return group;
}

export async function ensureGroupManager(groupId, user) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });

  if (!group) {
    throw new AppError('Grupo não encontrado.', 404);
  }

  if (user.role !== 'ADMIN' && group.createdById !== user.id) {
    throw new AppError('Somente o criador do grupo ou o administrador pode fazer isso.', 403);
  }

  return group;
}
