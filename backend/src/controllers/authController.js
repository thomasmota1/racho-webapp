import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { ErroAplicacao } from '../utils/AppError.js';
import { dadosPublicosUsuario } from '../utils/serializers.js';

function criarToken(usuario) {
  return jwt.sign(
    { userId: usuario.id, role: usuario.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' },
  );
}

export async function cadastrar(requisicao, resposta) {
  const { name: nome, email, password: senha } = requisicao.body;

  if (!nome?.trim() || !email?.trim() || !senha) {
    throw new ErroAplicacao('Nome, e-mail e senha são obrigatórios.');
  }
  if (senha.length < 6) {
    throw new ErroAplicacao('A senha precisa ter pelo menos 6 caracteres.');
  }

  const emailNormalizado = email.trim().toLowerCase();
  const usuarioExistente = await prisma.user.findUnique({ where: { email: emailNormalizado } });

  if (usuarioExistente) {
    throw new ErroAplicacao('Já existe uma conta com esse e-mail.', 409);
  }

  const usuario = await prisma.user.create({
    data: {
      name: nome.trim(),
      email: emailNormalizado,
      passwordHash: await bcrypt.hash(senha, 10),
    },
  });

  resposta.status(201).json({
    token: criarToken(usuario),
    user: dadosPublicosUsuario(usuario),
  });
}

export async function entrar(requisicao, resposta) {
  const { email, password: senha } = requisicao.body;

  if (!email || !senha) {
    throw new ErroAplicacao('Informe e-mail e senha.');
  }

  const usuario = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  const senhaCorreta = usuario && await bcrypt.compare(senha, usuario.passwordHash);

  if (!usuario || !senhaCorreta) {
    throw new ErroAplicacao('E-mail ou senha incorretos.', 401);
  }
  if (!usuario.active) {
    throw new ErroAplicacao('Esta conta foi desativada pelo administrador.', 403);
  }

  resposta.json({
    token: criarToken(usuario),
    user: dadosPublicosUsuario(usuario),
  });
}

export async function obterPerfil(requisicao, resposta) {
  resposta.json(dadosPublicosUsuario(requisicao.usuario));
}

export async function atualizarPerfil(requisicao, resposta) {
  const {
    name: nome,
    email,
    currentPassword: senhaAtual,
    newPassword: novaSenha,
  } = requisicao.body;
  const dadosAtualizacao = {};

  if (nome !== undefined) {
    if (!nome.trim()) throw new ErroAplicacao('O nome não pode ficar vazio.');
    dadosAtualizacao.name = nome.trim();
  }

  if (email !== undefined) {
    if (!email.trim()) throw new ErroAplicacao('O e-mail não pode ficar vazio.');
    dadosAtualizacao.email = email.trim().toLowerCase();
  }

  if (novaSenha) {
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

  const usuarioAtualizado = await prisma.user.update({
    where: { id: requisicao.usuario.id },
    data: dadosAtualizacao,
  });
  resposta.json(dadosPublicosUsuario(usuarioAtualizado));
}
