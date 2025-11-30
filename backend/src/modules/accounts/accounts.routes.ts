import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

// GET /api/accounts - List user accounts
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    res.json({ message: 'Accounts list - TODO' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// GET /api/accounts/:id/transactions - List transactions
router.get('/:id/transactions', authenticateToken, async (req: any, res) => {
  try {
    res.json({ message: 'Transactions list - TODO' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /api/accounts/:id/transfer - Transfer money
router.post('/:id/transfer', authenticateToken, async (req: any, res) => {
  try {
    res.json({ message: 'Transfer - TODO' });
  } catch (error) {
    res.status(500).json({ error: 'Transfer failed' });
  }
});

export default router;
