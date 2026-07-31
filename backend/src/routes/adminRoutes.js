import { Router } from 'express';
import {
  deleteUser, listAllExpenses, listAllGroups,
  listUsers, overview, updateUser,
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate, requireAdmin);
router.get('/overview', asyncHandler(overview));
router.get('/users', asyncHandler(listUsers));
router.patch('/users/:id', asyncHandler(updateUser));
router.delete('/users/:id', asyncHandler(deleteUser));
router.get('/groups', asyncHandler(listAllGroups));
router.get('/expenses', asyncHandler(listAllExpenses));
export default router;
