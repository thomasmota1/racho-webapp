// Importa controladores e middlewares.
import { Router } from 'express';
import { atualizarPerfil, cadastrar, entrar, obterPerfil } from '../controllers/authController.js';
import { autenticar } from '../middlewares/auth.js';
import { tratarErrosAssincronos } from '../utils/asyncHandler.js';

// Cria as rotas de autenticação.
const rotasAutenticacao = Router();
// Cadastra novas contas.
rotasAutenticacao.post('/register', tratarErrosAssincronos(cadastrar));
// Autentica credenciais recebidas.
rotasAutenticacao.post('/login', tratarErrosAssincronos(entrar));
// Retorna o perfil autenticado.
rotasAutenticacao.get('/me', autenticar, tratarErrosAssincronos(obterPerfil));
// Atualiza perfil e senha.
rotasAutenticacao.patch('/me', autenticar, tratarErrosAssincronos(atualizarPerfil));
// Exporta as rotas configuradas.
export default rotasAutenticacao;
