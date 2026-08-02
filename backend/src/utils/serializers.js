export function dadosPublicosUsuario(usuario) {
  return {
    id: usuario.id,
    name: usuario.name,
    email: usuario.email,
    role: usuario.role,
    active: usuario.active,
    createdAt: usuario.createdAt,
  };
}
