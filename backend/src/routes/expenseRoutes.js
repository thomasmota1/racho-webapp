import { Router } from 'express';
import { deleteExpense, updateExpense } from '../controllers/expenseController.js';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);
router.patch('/:id', asyncHandler(updateExpense));
router.delete('/:id', asyncHandler(deleteExpense));
export default router;
