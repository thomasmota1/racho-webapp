// Importa controladores e middlewares.
import { Router } from 'express';
import {
  adicionarMembro, atualizarGrupo, criarGrupo, excluirGrupo, obterDadosPainel,
  obterGrupo, removerMembro,
} from '../controllers/groupController.js';
import { criarDespesa } from '../controllers/expenseController.js';
import { criarAcerto } from '../controllers/settlementController.js';
import { autenticar } from '../middlewares/auth.js';
import { tratarErrosAssincronos } from '../utils/asyncHandler.js';

// Cria as rotas de grupos.
const rotasGrupos = Router();
// Exige autenticação nas rotas.
rotasGrupos.use(autenticar);
// Retorna dados do painel.
rotasGrupos.get('/dashboard', tratarErrosAssincronos(obterDadosPainel));
// Cria um novo grupo.
rotasGrupos.post('/', tratarErrosAssincronos(criarGrupo));
// Retorna os detalhes do grupo.
rotasGrupos.get('/:id', tratarErrosAssincronos(obterGrupo));
// Atualiza o grupo informado.
rotasGrupos.patch('/:id', tratarErrosAssincronos(atualizarGrupo));
// Exclui o grupo informado.
rotasGrupos.delete('/:id', tratarErrosAssincronos(excluirGrupo));
// Adiciona membro ao grupo.
rotasGrupos.post('/:id/members', tratarErrosAssincronos(adicionarMembro));
// Remove membro do grupo.
rotasGrupos.delete('/:id/members/:userId', tratarErrosAssincronos(removerMembro));
// Cria despesa no grupo.
rotasGrupos.post('/:groupId/expenses', tratarErrosAssincronos(criarDespesa));
// Registra pagamento no grupo.
rotasGrupos.post('/:groupId/settlements', tratarErrosAssincronos(criarAcerto));
// Exporta as rotas configuradas.
export default rotasGrupos;
