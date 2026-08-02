// Importa banco e erros padronizados.
import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';

// Busca participação no grupo.
export async function buscarParticipacao(grupoId, usuarioId) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: grupoId, userId: usuarioId } },
  });
}

// Garante acesso ao grupo.
export async function garantirAcessoGrupo(grupoId, usuario) {
  // Busca o grupo informado.
  const grupo = await prisma.group.findUnique({ where: { id: grupoId } });

  // Interrompe quando não existe.
  if (!grupo) {
    throw new ErroAplicacao('Grupo não encontrado.', 404);
  }

  // Libera qualquer administrador.
  if (usuario.role === 'ADMIN') {
    return grupo;
  }

  // Confere participação do usuário.
  const participacao = await buscarParticipacao(grupoId, usuario.id);
  if (!participacao) {
    throw new ErroAplicacao('Você não participa deste grupo.', 403);
  }

  return grupo;
}

// Garante gerenciamento do grupo.
export async function garantirGerenciaGrupo(grupoId, usuario) {
  // Busca o grupo informado.
  const grupo = await prisma.group.findUnique({ where: { id: grupoId } });

  // Interrompe quando não existe.
  if (!grupo) {
    throw new ErroAplicacao('Grupo não encontrado.', 404);
  }

  // Exige criador ou administrador.
  if (usuario.role !== 'ADMIN' && grupo.createdById !== usuario.id) {
    throw new ErroAplicacao('Somente o criador do grupo ou o administrador pode fazer isso.', 403);
  }

  return grupo;
}
