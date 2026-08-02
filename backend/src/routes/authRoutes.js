import { Router } from 'express';
import { atualizarPerfil, cadastrar, entrar, obterPerfil } from '../controllers/authController.js';
import { autenticar } from '../middlewares/auth.js';
import { tratarErrosAssincronos } from '../utils/asyncHandler.js';

const rotasAutenticacao = Router();
rotasAutenticacao.post('/register', tratarErrosAssincronos(cadastrar));
rotasAutenticacao.post('/login', tratarErrosAssincronos(entrar));
rotasAutenticacao.get('/me', autenticar, tratarErrosAssincronos(obterPerfil));
rotasAutenticacao.patch('/me', autenticar, tratarErrosAssincronos(atualizarPerfil));
export default rotasAutenticacao;
