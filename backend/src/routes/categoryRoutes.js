// Importa controladores e middlewares.
import { Router } from 'express';
import {
  atualizarCategoria, criarCategoria, excluirCategoria, listarCategorias,
} from '../controllers/categoryController.js';
import { autenticar, exigirAdministrador } from '../middlewares/auth.js';
import { tratarErrosAssincronos } from '../utils/asyncHandler.js';

// Cria as rotas de categorias.
const rotasCategorias = Router();
// Exige autenticação nas rotas.
rotasCategorias.use(autenticar);
// Lista categorias disponíveis.
rotasCategorias.get('/', tratarErrosAssincronos(listarCategorias));
// Permite criar somente ao administrador.
rotasCategorias.post('/', exigirAdministrador, tratarErrosAssincronos(criarCategoria));
// Permite editar somente ao administrador.
rotasCategorias.patch('/:id', exigirAdministrador, tratarErrosAssincronos(atualizarCategoria));
// Permite excluir somente ao administrador.
rotasCategorias.delete('/:id', exigirAdministrador, tratarErrosAssincronos(excluirCategoria));
// Exporta as rotas configuradas.
export default rotasCategorias;
