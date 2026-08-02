import { Router } from 'express';
import { atualizarDespesa, excluirDespesa } from '../controllers/expenseController.js';
import { autenticar } from '../middlewares/auth.js';
import { tratarErrosAssincronos } from '../utils/asyncHandler.js';

const rotasDespesas = Router();
rotasDespesas.use(autenticar);
rotasDespesas.patch('/:id', tratarErrosAssincronos(atualizarDespesa));
rotasDespesas.delete('/:id', tratarErrosAssincronos(excluirDespesa));
export default rotasDespesas;
