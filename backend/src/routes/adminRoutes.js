import { Router } from 'express';
import {
  listAllGroups,
  listUsers, overview, updateUser,
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate, requireAdmin);
router.get('/overview', asyncHandler(overview));
router.get('/users', asyncHandler(listUsers));
router.patch('/users/:id', asyncHandler(updateUser));
router.get('/groups', asyncHandler(listAllGroups));
export default router;
