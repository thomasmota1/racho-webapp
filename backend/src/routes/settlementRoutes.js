// Importa controlador e middlewares.
import { Router } from 'express';
import { atualizarStatusAcerto } from '../controllers/settlementController.js';
import { autenticar } from '../middlewares/auth.js';
import { tratarErrosAssincronos } from '../utils/asyncHandler.js';

// Cria as rotas de pagamentos.
const rotasAcertos = Router();
// Exige autenticação nas rotas.
rotasAcertos.use(autenticar);
// Atualiza o status informado.
rotasAcertos.patch('/:id/status', tratarErrosAssincronos(atualizarStatusAcerto));
// Exporta as rotas configuradas.
export default rotasAcertos;
