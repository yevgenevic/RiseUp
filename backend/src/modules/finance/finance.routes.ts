import { Router } from 'express';
import { getBalance, getTransactions } from './finance.controller.js';

const router = Router();

// GET /api/finance/balance - Get user balance
router.get('/balance', getBalance);

// GET /api/finance/transactions - Get user transactions
router.get('/transactions', getTransactions);

export default router;
