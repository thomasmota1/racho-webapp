// Importa controladores e middlewares.
import { Router } from 'express';
import { atualizarDespesa, excluirDespesa } from '../controllers/expenseController.js';
import { autenticar } from '../middlewares/auth.js';
import { tratarErrosAssincronos } from '../utils/asyncHandler.js';

// Cria as rotas de despesas.
const rotasDespesas = Router();
// Exige autenticação nas rotas.
rotasDespesas.use(autenticar);
// Atualiza a despesa informada.
rotasDespesas.patch('/:id', tratarErrosAssincronos(atualizarDespesa));
// Exclui a despesa informada.
rotasDespesas.delete('/:id', tratarErrosAssincronos(excluirDespesa));
// Exporta as rotas configuradas.
export default rotasDespesas;
