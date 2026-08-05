import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';

export async function buscarParticipacao(grupoId, usuarioId) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: grupoId, userId: usuarioId } },
  });
}

export async function garantirAcessoGrupo(grupoId, usuario) {
  // busca grupo
  const grupo = await prisma.group.findUnique({ where: { id: grupoId } });

  if (!grupo) {
    throw new ErroAplicacao('Grupo não encontrado.', 404);
  }

  if (usuario.role === 'ADMIN') {
    return grupo;
  }

  const participacao = await buscarParticipacao(grupoId, usuario.id);
  if (!participacao) {
    throw new ErroAplicacao('Você não participa deste grupo.', 403);
  }

  return grupo;
}

export async function garantirGerenciaGrupo(grupoId, usuario) {
  const grupo = await prisma.group.findUnique({ where: { id: grupoId } });

  if (!grupo) {
    throw new ErroAplicacao('Grupo não encontrado.', 404);
  }

  // exige criador ou adm
  if (usuario.role !== 'ADMIN' && grupo.createdById !== usuario.id) {
    throw new ErroAplicacao('Somente o criador do grupo ou o administrador pode fazer isso.', 403);
  }

  return grupo;
}
