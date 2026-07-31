import { Router } from 'express';
import { login, me, register, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', authenticate, asyncHandler(me));
router.patch('/me', authenticate, asyncHandler(updateProfile));
export default router;
