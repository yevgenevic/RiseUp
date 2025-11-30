import { Router } from 'express';

const router = Router();

// GET /api/branches - List all branches
router.get('/', async (req, res) => {
  try {
    res.json({ message: 'Branches list - TODO' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// GET /api/branches/:id/queue/status - Get queue status
router.get('/:id/queue/status', async (req, res) => {
  try {
    res.json({ message: 'Queue status - TODO' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch queue status' });
  }
});

// POST /api/branches/:id/queue - Take a queue number
router.post('/:id/queue', async (req, res) => {
  try {
    res.json({ message: 'Queue booking - TODO' });
  } catch (error) {
    res.status(500).json({ error: 'Queue booking failed' });
  }
});

export default router;
