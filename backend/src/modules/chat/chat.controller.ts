import { Request, Response } from 'express';
import { createHash } from 'crypto';
import { query } from '../../config/database.js';
import logger from '../../config/logger.js';
import axios from 'axios';

const AI_API_URL = process.env.AI_API_URL || 'http://localhost:3002';
const AI_API_KEY = process.env.AI_API_KEY || '';

/**
 * Ask AI a question with caching
 * POST /api/ai/ask
 * Body: { user_id, question }
 */
export const askQuestion = async (req: Request, res: Response) => {
  try {
    const { userId, question } = req.body;

    if (!userId || !question) {
      return res.status(400).json({ error: 'user_id and question required' });
    }

    // Create hash of question
    const questionHash = createHash('sha256').update(question.toLowerCase().trim()).digest('hex');

    // Check cache first
    const cacheResult = await query(
      `SELECT answer FROM ai_cache WHERE question_hash = $1`,
      [questionHash]
    );

    if (cacheResult.rows.length > 0) {
      logger.info(`Cache hit for question: ${question.substring(0, 50)}`);
      return res.json({
        answer: cacheResult.rows[0].answer,
        cached: true,
        questionHash,
      });
    }

    // Call AI API
    logger.info(`Cache miss - calling AI API for: ${question.substring(0, 50)}`);
    
    let aiResponse: string;
    
    try {
      const response = await axios.post(
        `${AI_API_URL}/api/ask`,
        { question },
        {
          headers: {
            'Authorization': `Bearer ${AI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      aiResponse = response.data.answer || response.data.response || 'No answer';
    } catch (aiError) {
      logger.error('AI API error:', aiError);
      // Fallback response
      aiResponse = `Извините, я не смог обработать ваш вопрос. Пожалуйста, попробуйте позже или свяжитесь с поддержкой.`;
    }

    // Save to cache
    try {
      await query(
        `INSERT INTO ai_cache (user_id, question_hash, question_original, answer)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [userId, questionHash, question, aiResponse]
      );
    } catch (cacheError) {
      logger.error('Error saving to cache:', cacheError);
      // Continue anyway
    }

    res.json({
      answer: aiResponse,
      cached: false,
      questionHash,
    });
  } catch (error) {
    logger.error('Ask question error:', error);
    res.status(500).json({ error: 'Failed to get answer' });
  }
};

/**
 * Get AI cache statistics
 * GET /api/ai/cache/stats
 */
export const getCacheStats = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as total, COUNT(DISTINCT question_hash) as unique_questions
       FROM ai_cache`
    );

    const stats = result.rows[0];

    res.json({
      totalCachedResponses: parseInt(stats.total),
      uniqueQuestions: parseInt(stats.unique_questions),
    });
  } catch (error) {
    logger.error('Cache stats error:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
};

/**
 * Clear AI cache (admin only)
 * DELETE /api/ai/cache
 */
export const clearCache = async (req: Request, res: Response) => {
  try {
    await query(`TRUNCATE TABLE ai_cache`);
    res.json({ message: 'AI cache cleared' });
  } catch (error) {
    logger.error('Clear cache error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
};
