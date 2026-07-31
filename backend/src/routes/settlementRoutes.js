import { Router } from 'express';
import { updateSettlementStatus } from '../controllers/settlementController.js';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);
router.patch('/:id/status', asyncHandler(updateSettlementStatus));
export default router;
