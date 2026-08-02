import { Router } from 'express';
import { atualizarStatusAcerto } from '../controllers/settlementController.js';
import { autenticar } from '../middlewares/auth.js';
import { tratarErrosAssincronos } from '../utils/asyncHandler.js';

const rotasAcertos = Router();
rotasAcertos.use(autenticar);
rotasAcertos.patch('/:id/status', tratarErrosAssincronos(atualizarStatusAcerto));
export default rotasAcertos;
