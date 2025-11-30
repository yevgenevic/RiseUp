import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';
import logger from '../../config/logger.js';

/**
 * Apply for credit
 * POST /api/credit/apply
 * Body: { userId, amount, termMonths, purpose }
 */
export const applyCreditForm = async (req: Request, res: Response) => {
  try {
    const { userId, amount, termMonths, purpose } = req.body;

    if (!userId || !amount || !termMonths) {
      return res.status(400).json({ error: 'user_id, amount, and term_months required' });
    }

    // Validate amount
    if (amount < 100000 || amount > 1000000000) {
      return res.status(400).json({ error: 'Amount must be between 100,000 and 1,000,000,000' });
    }

    // Validate term
    if (![3, 6, 12, 24, 36, 48, 60].includes(termMonths)) {
      return res.status(400).json({ error: 'Invalid term' });
    }

    // Check user exists
    const userResult = await query(`SELECT id FROM users WHERE id = $1`, [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create application
    const applicationId = uuidv4();
    const score = Math.floor(Math.random() * 100); // TODO: Real scoring logic
    const status = score > 60 ? 'approved' : 'pending';

    await query(
      `INSERT INTO credit_applications (id, user_id, amount, currency, term_months, purpose, status, score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [applicationId, userId, amount, 'UZS', termMonths, purpose || '', status, score]
    );

    logger.info(`Credit application created: ${applicationId}`);

    res.json({
      applicationId,
      score,
      status,
      amount,
      termMonths,
      message: status === 'approved' ? 'Credit approved!' : 'Application under review',
    });
  } catch (error) {
    logger.error('Credit application error:', error);
    res.status(500).json({ error: 'Credit application failed' });
  }
};

/**
 * Get credit application status
 * GET /api/credit/:id
 */
export const getCreditStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, user_id, amount, currency, term_months, purpose, status, score, approved_by, rejection_reason, created_at, updated_at
       FROM credit_applications WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const app = result.rows[0];

    res.json({
      id: app.id,
      userId: app.user_id,
      amount: app.amount,
      currency: app.currency,
      termMonths: app.term_months,
      purpose: app.purpose,
      status: app.status,
      score: app.score,
      approvedBy: app.approved_by,
      rejectionReason: app.rejection_reason,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
    });
  } catch (error) {
    logger.error('Get credit status error:', error);
    res.status(500).json({ error: 'Failed to fetch credit status' });
  }
};

/**
 * List user's credit applications
 * GET /api/credit/user/:userId
 */
export const getUserCreditApplications = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT id, amount, currency, term_months, status, score, created_at
       FROM credit_applications 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      applications: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    logger.error('Get user credit applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};
