import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../../middleware/auth.js';

const router = Router();

// GET /api/admin/users - List users (admin only)
router.get('/users', authenticateToken, authorizeRole(['admin']), async (req: any, res) => {
  try {
    res.json({ message: 'Admin users list - TODO' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/credit/applications - List credit applications
router.get('/credit/applications', authenticateToken, authorizeRole(['admin']), async (req: any, res) => {
  try {
    res.json({ message: 'Credit applications - TODO' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET /api/admin/fraud/alerts - List fraud alerts
router.get('/fraud/alerts', authenticateToken, authorizeRole(['admin']), async (req: any, res) => {
  try {
    res.json({ message: 'Fraud alerts - TODO' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fraud alerts' });
  }
});

export default router;
