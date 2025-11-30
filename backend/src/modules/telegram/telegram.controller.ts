import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';
import logger from '../../config/logger.js';
import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Verify Telegram code and link account
 * POST /api/telegram/verify_code
 */
export const verifyTelegramCode = async (req: Request, res: Response) => {
  try {
    const { telegramId, verificationCode } = req.body;

    if (!telegramId || !verificationCode) {
      return res.status(400).json({ error: 'telegram_id and verification_code required' });
    }

    // Find user by verification code
    const userResult = await query(
      `SELECT id, telegram_id FROM users WHERE telegram_verification_code = $1`,
      [verificationCode]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const user = userResult.rows[0];

    // Check if telegram_id is already linked to another user
    const existingTelegramResult = await query(
      `SELECT user_id FROM users WHERE telegram_id = $1 AND id != $2`,
      [telegramId, user.id]
    );

    if (existingTelegramResult.rows.length > 0) {
      return res.status(400).json({ error: 'This Telegram account is already linked to another user' });
    }

    // Update user with telegram_id and mark as verified
    await query(
      `UPDATE users 
       SET telegram_id = $1, telegram_verified = TRUE, telegram_verification_code = NULL
       WHERE id = $2`,
      [telegramId, user.id]
    );

    // Send welcome message to user via Telegram
    await sendTelegramMessage(
      telegramId,
      `✅ Ваш аккаунт успешно привязан к Telegram!\n\nДоступные команды:\n/balance - Баланс\n/transactions - Последние транзакции\n/faq - Вопросы и ответы\n/apply_credit - Заявка на кредит\n/help - Справка`
    );

    logger.info(`Telegram verified for user: ${user.id}`);

    res.json({
      message: 'Telegram account verified successfully',
      userId: user.id,
      telegramId,
    });
  } catch (error) {
    logger.error('Telegram verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

/**
 * Generate verification code for a user
 * POST /api/telegram/generate_code
 */
export const generateVerificationCode = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'user_id required' });
    }

    // Check user exists
    const userResult = await query(`SELECT id FROM users WHERE id = $1`, [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save code
    await query(`UPDATE users SET telegram_verification_code = $1 WHERE id = $2`, [verificationCode, userId]);

    logger.info(`Generated verification code for user: ${userId}`);

    res.json({
      verificationCode,
      message: 'Verification code generated. User should enter this in Telegram.',
    });
  } catch (error) {
    logger.error('Code generation error:', error);
    res.status(500).json({ error: 'Code generation failed' });
  }
};

/**
 * Send message to user via Telegram
 * POST /api/telegram/send
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { telegramId, message } = req.body;

    if (!telegramId || !message) {
      return res.status(400).json({ error: 'telegram_id and message required' });
    }

    await sendTelegramMessage(telegramId, message);

    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ error: 'Message sending failed' });
  }
};

/**
 * Notify about suspicious transaction
 * POST /api/telegram/notify_suspicious_transaction
 */
export const notifySuspiciousTransaction = async (req: Request, res: Response) => {
  try {
    const { userId, amount, transactionId } = req.body;

    if (!userId || !amount || !transactionId) {
      return res.status(400).json({ error: 'user_id, amount, and transaction_id required' });
    }

    // Get telegram_id from user
    const userResult = await query(`SELECT telegram_id FROM users WHERE id = $1 AND telegram_verified = TRUE`, [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User or telegram_id not found' });
    }

    const telegramId = userResult.rows[0].telegram_id;
    const formattedAmount = new Intl.NumberFormat('uz-UZ').format(amount);

    const message = `⚠️ Обнаружена подозрительная транзакция\n\nСумма: ${formattedAmount} UZS\n\nЭто вы?`;

    // Send message with inline buttons
    await sendTelegramMessageWithButtons(telegramId, message, [
      { text: '✅ Да, это я', callback_data: `confirm_txn_${transactionId}` },
      { text: '❌ Нет, заблокировать карту', callback_data: `block_txn_${transactionId}` },
    ]);

    logger.info(`Sent suspicious transaction notification to user: ${userId}`);

    res.json({ message: 'Notification sent' });
  } catch (error) {
    logger.error('Suspicious transaction notification error:', error);
    res.status(500).json({ error: 'Notification failed' });
  }
};

/**
 * Handle callback query responses (user clicks buttons)
 * POST /api/telegram/callback
 */
export const handleCallback = async (req: Request, res: Response) => {
  try {
    const { callbackQueryId, userId, callbackData } = req.body;

    if (!callbackData) {
      return res.status(400).json({ error: 'callback_data required' });
    }

    if (callbackData.startsWith('confirm_txn_')) {
      const transactionId = callbackData.replace('confirm_txn_', '');
      // Mark as legitimate
      await query(
        `UPDATE fraud_alerts SET status = $1, comments = $2 WHERE transaction_id = $3`,
        ['false_positive', 'User confirmed legitimate transaction', transactionId]
      );

      // Send confirmation
      const telegramId = await getUserTelegramId(userId);
      if (telegramId) {
        await sendTelegramMessage(telegramId, '✅ Спасибо! Транзакция отмечена как легитимная.');
      }
    } else if (callbackData.startsWith('block_txn_')) {
      const transactionId = callbackData.replace('block_txn_', '');
      // Mark for blocking
      await query(`UPDATE fraud_alerts SET status = $1, comments = $2 WHERE transaction_id = $3`, [
        'investigating',
        'User reported as fraud',
        transactionId,
      ]);

      // Notify about account block
      const telegramId = await getUserTelegramId(userId);
      if (telegramId) {
        await sendTelegramMessage(
          telegramId,
          '🔒 Ваша карта заблокирована. Свяжитесь с поддержкой: +998 71 200 00 00'
        );
      }
    }

    res.json({ ok: true });
  } catch (error) {
    logger.error('Callback handling error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
};

/**
 * Webhook for receiving updates from Telegram
 * POST /api/telegram/webhook
 */
export const webhookReceiver = async (req: Request, res: Response) => {
  try {
    const update = req.body;

    // Handle callback query (button clicks)
    if (update.callback_query) {
      const { id, data, from } = update.callback_query;

      // Find user by telegram_id
      const userResult = await query(
        `SELECT id FROM users WHERE telegram_id = $1 AND telegram_verified = TRUE`,
        [from.id]
      );

      if (userResult.rows.length > 0) {
        await handleCallback({
          body: { callbackQueryId: id, userId: userResult.rows[0].id, callbackData: data },
        } as any, res);
      }
    }

    res.json({ ok: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(200).json({ ok: true }); // Always return 200 to Telegram
  }
};

/**
 * Helper: Send plain message to Telegram
 */
export async function sendTelegramMessage(telegramId: number | string, text: string): Promise<void> {
  try {
    await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: telegramId,
      text,
      parse_mode: 'HTML',
    });
  } catch (error) {
    logger.error('Failed to send telegram message:', error);
  }
}

/**
 * Helper: Send message with inline buttons
 */
export async function sendTelegramMessageWithButtons(
  telegramId: number | string,
  text: string,
  buttons: Array<{ text: string; callback_data: string }>
): Promise<void> {
  try {
    await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: telegramId,
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[...buttons]],
      },
    });
  } catch (error) {
    logger.error('Failed to send telegram message with buttons:', error);
  }
}

/**
 * Helper: Get telegram_id from user_id
 */
async function getUserTelegramId(userId: string): Promise<number | null> {
  try {
    const result = await query(`SELECT telegram_id FROM users WHERE id = $1 AND telegram_verified = TRUE`, [userId]);
    return result.rows.length > 0 ? result.rows[0].telegram_id : null;
  } catch (error) {
    logger.error('Error getting telegram_id:', error);
    return null;
  }
}
