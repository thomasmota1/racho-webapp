import { Router } from 'express';
import {
  adicionarMembro, atualizarGrupo, criarGrupo, excluirGrupo, obterDadosPainel,
  obterGrupo, removerMembro,
} from '../controllers/groupController.js';
import { criarDespesa } from '../controllers/expenseController.js';
import { criarAcerto } from '../controllers/settlementController.js';
import { autenticar } from '../middlewares/auth.js';
import { tratarErrosAssincronos } from '../utils/asyncHandler.js';

const rotasGrupos = Router();
rotasGrupos.use(autenticar);
rotasGrupos.get('/dashboard', tratarErrosAssincronos(obterDadosPainel));
rotasGrupos.post('/', tratarErrosAssincronos(criarGrupo));
rotasGrupos.get('/:id', tratarErrosAssincronos(obterGrupo));
rotasGrupos.patch('/:id', tratarErrosAssincronos(atualizarGrupo));
rotasGrupos.delete('/:id', tratarErrosAssincronos(excluirGrupo));
rotasGrupos.post('/:id/members', tratarErrosAssincronos(adicionarMembro));
rotasGrupos.delete('/:id/members/:userId', tratarErrosAssincronos(removerMembro));
rotasGrupos.post('/:groupId/expenses', tratarErrosAssincronos(criarDespesa));
rotasGrupos.post('/:groupId/settlements', tratarErrosAssincronos(criarAcerto));
export default rotasGrupos;
