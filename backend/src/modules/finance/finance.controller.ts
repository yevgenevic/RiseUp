import { Request, Response } from 'express';
import { query } from '../../config/database.js';
import logger from '../../config/logger.js';

/**
 * Get user balance
 * GET /api/finance/balance
 * Headers: Authorization: Bearer jwt_token or ?telegram_id=xxx
 */
export const getBalance = async (req: Request, res: Response) => {
  try {
    let userId: string | null = null;

    // Try to get from JWT (if authenticated)
    if ((req as any).userId) {
      userId = (req as any).userId;
    }
    // Try to get from telegram_id query param (for bot)
    else if (req.query.telegram_id) {
      const telegramIdResult = await query(
        `SELECT id FROM users WHERE telegram_id = $1 AND telegram_verified = TRUE`,
        [req.query.telegram_id]
      );
      if (telegramIdResult.rows.length > 0) {
        userId = telegramIdResult.rows[0].id;
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get balance
    const accountResult = await query(
      `SELECT balance, currency FROM accounts WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );

    if (accountResult.rows.length === 0) {
      return res.json({ balance: 0, currency: 'UZS' });
    }

    const { balance, currency } = accountResult.rows[0];

    res.json({
      balance: parseFloat(balance),
      currency,
      formatted: new Intl.NumberFormat('uz-UZ').format(parseFloat(balance)),
    });
  } catch (error) {
    logger.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
};

/**
 * Get transactions
 * GET /api/finance/transactions?n=10
 * Headers: Authorization: Bearer jwt_token or ?telegram_id=xxx
 */
export const getTransactions = async (req: Request, res: Response) => {
  try {
    let userId: string | null = null;

    // Try to get from JWT (if authenticated)
    if ((req as any).userId) {
      userId = (req as any).userId;
    }
    // Try to get from telegram_id query param (for bot)
    else if (req.query.telegram_id) {
      const telegramIdResult = await query(
        `SELECT id FROM users WHERE telegram_id = $1 AND telegram_verified = TRUE`,
        [req.query.telegram_id]
      );
      if (telegramIdResult.rows.length > 0) {
        userId = telegramIdResult.rows[0].id;
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = Math.min(parseInt(req.query.n as string) || 10, 100);

    // Get recent transactions
    const txResult = await query(
      `SELECT t.id, t.amount, t.currency, t.type, t.description, t.status, t.created_at
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE a.user_id = $1
       ORDER BY t.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    const transactions = txResult.rows.map((tx: any) => ({
      id: tx.id,
      amount: parseFloat(tx.amount),
      currency: tx.currency,
      type: tx.type,
      description: tx.description || '—',
      status: tx.status,
      date: new Date(tx.created_at).toLocaleDateString('uz-UZ'),
      time: new Date(tx.created_at).toLocaleTimeString('uz-UZ'),
      formatted: new Intl.NumberFormat('uz-UZ').format(parseFloat(tx.amount)),
    }));

    res.json({
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
};
