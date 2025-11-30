import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { askQuestion, getCacheStats, clearCache } from './chat.controller.js';

const router = Router();

// POST /api/ai/ask - Ask AI a question (with caching)
router.post('/ask', askQuestion);

// GET /api/ai/cache/stats - Get cache statistics
router.get('/cache/stats', getCacheStats);

// DELETE /api/ai/cache - Clear cache (admin only)
router.delete('/cache', clearCache);

// POST /api/chat/message - Send message to chatbot
router.post('/message', authenticateToken, async (req: any, res) => {
  try {
    res.json({ message: 'Chatbot response - TODO' });
  } catch (error) {
    res.status(500).json({ error: 'Chat failed' });
  }
});

// GET /api/chat/history - Get chat history
router.get('/history', authenticateToken, async (req: any, res) => {
  try {
    res.json({ message: 'Chat history - TODO' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

export default router;
