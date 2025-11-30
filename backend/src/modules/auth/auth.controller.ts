import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';
import { generateToken } from '../../config/jwt.js';
import logger from '../../config/logger.js';

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, password, passwordConfirm } = req.body;

    // Validation
    if (!fullName || !email || !password || !passwordConfirm) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    await query(
      `INSERT INTO users (id, full_name, email, phone, hashed_password, kyc_status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, fullName, email, phone || null, hashedPassword, 'pending']
    );

    // Create user profile
    await query(
      `INSERT INTO user_profiles (user_id, metadata)
       VALUES ($1, $2)`,
      [userId, JSON.stringify({ registration_source: 'web' })]
    );

    // Create default account
    const accountNumber = `ACC-${uuidv4().substring(0, 8)}`;
    await query(
      `INSERT INTO accounts (user_id, account_number, currency, balance, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, accountNumber, 'UZS', 0, 'active']
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, payload)
       VALUES ($1, $2, $3, $4)`,
      [
        'user_registered',
        'users',
        userId,
        JSON.stringify({ email, fullName, registration_method: 'email_password' }),
      ]
    );

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      message: 'Registration successful',
      userId,
      email,
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user
    const userResult = await query(
      `SELECT id, full_name, email, hashed_password, kyc_status, is_active
       FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.hashed_password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // Audit log
    await query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'user_login', 'users', user.id]
    );

    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        kycStatus: user.kyc_status,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // TODO: Implement refresh token logic
    res.json({ message: 'Token refreshed' });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};
