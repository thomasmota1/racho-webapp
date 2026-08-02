// Importa segurança, banco e serialização.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';
import { dadosPublicosUsuario } from '../utils/serializers.js';

// Gera o token da sessão.
function criarToken(usuario) {
  return jwt.sign(
    { userId: usuario.id, role: usuario.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' },
  );
}

// Cadastra um novo usuário.
export async function cadastrar(requisicao, resposta) {
  // Extrai os dados recebidos.
  const { name: nome, email, password: senha } = requisicao.body;

  // Valida os campos obrigatórios.
  if (!nome?.trim() || !email?.trim() || !senha) {
    throw new ErroAplicacao('Nome, e-mail e senha são obrigatórios.');
  }
  // Exige o tamanho mínimo.
  if (senha.length < 6) {
    throw new ErroAplicacao('A senha precisa ter pelo menos 6 caracteres.');
  }

  // Normaliza e pesquisa o e-mail.
  const emailNormalizado = email.trim().toLowerCase();
  const usuarioExistente = await prisma.user.findUnique({ where: { email: emailNormalizado } });

  // Impede e-mails duplicados.
  if (usuarioExistente) {
    throw new ErroAplicacao('Já existe uma conta com esse e-mail.', 409);
  }

  // Criptografa e salva o usuário.
  const usuario = await prisma.user.create({
    data: {
      name: nome.trim(),
      email: emailNormalizado,
      passwordHash: await bcrypt.hash(senha, 10),
    },
  });

  // Retorna token e usuário público.
  resposta.status(201).json({
    token: criarToken(usuario),
    user: dadosPublicosUsuario(usuario),
  });
}

// Autentica um usuário cadastrado.
export async function entrar(requisicao, resposta) {
  // Extrai as credenciais recebidas.
  const { email, password: senha } = requisicao.body;

  // Exige ambas as credenciais.
  if (!email || !senha) {
    throw new ErroAplicacao('Informe e-mail e senha.');
  }

  // Busca usuário e confere senha.
  const usuario = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  const senhaCorreta = usuario && await bcrypt.compare(senha, usuario.passwordHash);

  // Rejeita credenciais incorretas.
  if (!usuario || !senhaCorreta) {
    throw new ErroAplicacao('E-mail ou senha incorretos.', 401);
  }
  // Bloqueia contas desativadas.
  if (!usuario.active) {
    throw new ErroAplicacao('Esta conta foi desativada pelo administrador.', 403);
  }

  // Retorna token e usuário público.
  resposta.json({
    token: criarToken(usuario),
    user: dadosPublicosUsuario(usuario),
  });
}

// Retorna o perfil autenticado.
export async function obterPerfil(requisicao, resposta) {
  resposta.json(dadosPublicosUsuario(requisicao.usuario));
}

// Atualiza dados e senha.
export async function atualizarPerfil(requisicao, resposta) {
  // Extrai os campos alteráveis.
  const {
    name: nome,
    email,
    currentPassword: senhaAtual,
    newPassword: novaSenha,
  } = requisicao.body;
  // Acumula somente campos informados.
  const dadosAtualizacao = {};

  // Valida e atualiza o nome.
  if (nome !== undefined) {
    if (!nome.trim()) throw new ErroAplicacao('O nome não pode ficar vazio.');
    dadosAtualizacao.name = nome.trim();
  }

  // Valida e atualiza o e-mail.
  if (email !== undefined) {
    if (!email.trim()) throw new ErroAplicacao('O e-mail não pode ficar vazio.');
    dadosAtualizacao.email = email.trim().toLowerCase();
  }

  // Valida e atualiza a senha.
  if (novaSenha) {
    // Confere a senha atual.
    const senhaAtualCorreta = senhaAtual
      && await bcrypt.compare(senhaAtual, requisicao.usuario.passwordHash);

    if (!senhaAtualCorreta) {
      throw new ErroAplicacao('A senha atual está incorreta.', 401);
    }
    if (novaSenha.length < 6) {
      throw new ErroAplicacao('A nova senha precisa ter 6 caracteres.');
    }
    dadosAtualizacao.passwordHash = await bcrypt.hash(novaSenha, 10);
  }

  // Salva todas as alterações.
  const usuarioAtualizado = await prisma.user.update({
    where: { id: requisicao.usuario.id },
    data: dadosAtualizacao,
  });
  // Retorna o perfil atualizado.
  resposta.json(dadosPublicosUsuario(usuarioAtualizado));
}
