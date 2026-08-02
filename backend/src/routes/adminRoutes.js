// Importa controladores e middlewares.
import { Router } from 'express';
import {
  atualizarUsuario, listarGrupos, listarUsuarios, obterResumo,
} from '../controllers/adminController.js';
import { autenticar, exigirAdministrador } from '../middlewares/auth.js';
import { tratarErrosAssincronos } from '../utils/asyncHandler.js';

// Cria as rotas administrativas.
const rotasAdministracao = Router();
// Exige acesso administrativo.
rotasAdministracao.use(autenticar, exigirAdministrador);
// Retorna números gerais.
rotasAdministracao.get('/overview', tratarErrosAssincronos(obterResumo));
// Lista usuários cadastrados.
rotasAdministracao.get('/users', tratarErrosAssincronos(listarUsuarios));
// Atualiza acesso do usuário.
rotasAdministracao.patch('/users/:id', tratarErrosAssincronos(atualizarUsuario));
// Lista todos os grupos.
rotasAdministracao.get('/groups', tratarErrosAssincronos(listarGrupos));
// Exporta as rotas configuradas.
export default rotasAdministracao;
