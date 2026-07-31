import { Router } from 'express';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/categoryController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);
router.get('/', asyncHandler(listCategories));
router.post('/', requireAdmin, asyncHandler(createCategory));
router.patch('/:id', requireAdmin, asyncHandler(updateCategory));
router.delete('/:id', requireAdmin, asyncHandler(deleteCategory));
export default router;
