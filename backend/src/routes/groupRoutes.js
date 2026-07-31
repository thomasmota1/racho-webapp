import { Router } from 'express';
import {
  addMember, createGroup, dashboard, deleteGroup, getGroup,
  listGroups, removeMember, updateGroup,
} from '../controllers/groupController.js';
import { createExpense } from '../controllers/expenseController.js';
import { createSettlement } from '../controllers/settlementController.js';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);
router.get('/dashboard', asyncHandler(dashboard));
router.get('/', asyncHandler(listGroups));
router.post('/', asyncHandler(createGroup));
router.get('/:id', asyncHandler(getGroup));
router.patch('/:id', asyncHandler(updateGroup));
router.delete('/:id', asyncHandler(deleteGroup));
router.post('/:id/members', asyncHandler(addMember));
router.delete('/:id/members/:userId', asyncHandler(removeMember));
router.post('/:groupId/expenses', asyncHandler(createExpense));
router.post('/:groupId/settlements', asyncHandler(createSettlement));
export default router;
