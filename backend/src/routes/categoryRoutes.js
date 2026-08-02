import { Router } from 'express';
import {
  atualizarCategoria, criarCategoria, excluirCategoria, listarCategorias,
} from '../controllers/categoryController.js';
import { autenticar, exigirAdministrador } from '../middlewares/auth.js';
import { tratarErrosAssincronos } from '../utils/asyncHandler.js';

const rotasCategorias = Router();
rotasCategorias.use(autenticar);
rotasCategorias.get('/', tratarErrosAssincronos(listarCategorias));
rotasCategorias.post('/', exigirAdministrador, tratarErrosAssincronos(criarCategoria));
rotasCategorias.patch('/:id', exigirAdministrador, tratarErrosAssincronos(atualizarCategoria));
rotasCategorias.delete('/:id', exigirAdministrador, tratarErrosAssincronos(excluirCategoria));
export default rotasCategorias;
