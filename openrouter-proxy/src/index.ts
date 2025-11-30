import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pino from 'pino';
import { callOpenRouter, generateCacheKey } from './services/llm.service.js';
import { getRedisClient } from './config/redis.js';
import { query as dbQuery } from './config/database.js';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3002;
const logger = pino();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', service: 'openrouter-proxy' });
});

// Main LLM endpoint
app.post('/api/llm/chat', async (req: Request, res: Response) => {
  try {
    const { userId, service, message, context = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Generate cache key
    const cacheKey = generateCacheKey(service, message);

    // Try to get from cache
    const redis = getRedisClient();
    const cachedResponse = await redis.get(cacheKey);

    if (cachedResponse) {
      logger.info(`Cache hit for ${service}`);
      return res.json({
        response: JSON.parse(cachedResponse),
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Call OpenRouter API
    const response = await callOpenRouter(message, context, service);

    // Cache the response (24 hours TTL)
    await redis.setEx(cacheKey, 86400, JSON.stringify(response));

    // Log the request
    await dbQuery(
      `INSERT INTO ai_requests (user_id, service, prompt_text, model_response, cost_estimate, tokens_used, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId || null,
        service,
        message,
        JSON.stringify(response),
        response.cost || 0,
        response.tokens || 0,
        'success',
      ]
    );

    res.json({
      response,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('LLM request failed:', error);

    const userId = req.body?.userId;
    const service = req.body?.service || 'unknown';

    // Log error
    await dbQuery(
      `INSERT INTO ai_requests (user_id, service, status, error_message)
       VALUES ($1, $2, $3, $4)`,
      [userId || null, service, 'error', error.message]
    );

    res.status(500).json({
      error: 'LLM request failed',
      message: error.message,
    });
  }
});

// FAQ search endpoint (for RAG)
app.get('/api/llm/faq-search', async (req: Request, res: Response) => {
  try {
    const { query: searchQuery, limit = 5 } = req.query;

    if (!searchQuery) {
      return res.status(400).json({ error: 'Query required' });
    }

    // Search in documents table
    const result = await dbQuery(
      `SELECT title, content, category FROM documents 
       WHERE to_tsvector('russian', content) @@ plainto_tsquery('russian', $1)
       LIMIT $2`,
      [searchQuery, parseInt(limit as string)]
    );

    res.json({
      results: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    logger.error('FAQ search failed:', error);
    res.status(500).json({ error: 'FAQ search failed' });
  }
});

// Metrics endpoint
app.get('/api/llm/metrics', async (req: Request, res: Response) => {
  try {
    const result = await dbQuery(
      `SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as failed,
        SUM(CAST(cost_estimate AS FLOAT)) as total_cost,
        AVG(tokens_used) as avg_tokens
       FROM ai_requests
       WHERE created_at > NOW() - INTERVAL '24 hours'`
    );

    res.json({
      metrics: result.rows[0],
      period: '24h',
    });
  } catch (error: any) {
    logger.error('Metrics failed:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

app.listen(PORT, () => {
  logger.info(`OpenRouter Proxy running on port ${PORT}`);
});

export default app;
