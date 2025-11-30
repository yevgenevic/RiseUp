import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { applyCreditForm, getCreditStatus, getUserCreditApplications } from './credit.controller.js';

const router = Router();

// POST /api/credit/apply - Submit credit application
router.post('/apply', applyCreditForm);

// GET /api/credit/:id - Get credit application status
router.get('/:id', getCreditStatus);

// GET /api/credit/user/:userId - Get user's credit applications
router.get('/user/:userId', getUserCreditApplications);

export default router;
