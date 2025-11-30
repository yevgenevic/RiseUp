import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../../middleware/auth.js';

const router = Router();

// GET /api/fraud/alerts - List fraud alerts
router.get('/alerts', authenticateToken, authorizeRole(['admin']), async (req: any, res) => {
  try {
    res.json({ message: 'Fraud alerts - TODO' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fraud alerts' });
  }
});

// POST /api/fraud/:id/close - Close fraud alert
router.post('/:id/close', authenticateToken, authorizeRole(['admin']), async (req: any, res) => {
  try {
    res.json({ message: 'Close fraud alert - TODO' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to close fraud alert' });
  }
});

export default router;
