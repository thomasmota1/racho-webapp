import { Router } from 'express';
import {
  atualizarUsuario, listarGrupos, listarUsuarios, obterResumo,
} from '../controllers/adminController.js';
import { autenticar, exigirAdministrador } from '../middlewares/auth.js';
import { tratarErrosAssincronos } from '../utils/asyncHandler.js';

const rotasAdministracao = Router();
rotasAdministracao.use(autenticar, exigirAdministrador);
rotasAdministracao.get('/overview', tratarErrosAssincronos(obterResumo));
rotasAdministracao.get('/users', tratarErrosAssincronos(listarUsuarios));
rotasAdministracao.patch('/users/:id', tratarErrosAssincronos(atualizarUsuario));
rotasAdministracao.get('/groups', tratarErrosAssincronos(listarGrupos));
export default rotasAdministracao;
