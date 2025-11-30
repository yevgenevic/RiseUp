import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

// POST /api/kyc/upload - Upload KYC document
router.post('/upload', authenticateToken, async (req: any, res) => {
  try {
    res.json({ message: 'KYC upload - TODO' });
  } catch (error) {
    res.status(500).json({ error: 'KYC upload failed' });
  }
});

// GET /api/kyc/status - Get KYC status
router.get('/status', authenticateToken, async (req: any, res) => {
  try {
    res.json({ message: 'KYC status - TODO' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

export default router;
