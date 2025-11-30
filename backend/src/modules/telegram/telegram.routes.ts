import { Router } from 'express';
import {
  verifyTelegramCode,
  generateVerificationCode,
  sendMessage,
  notifySuspiciousTransaction,
  webhookReceiver,
} from './telegram.controller.js';

const router = Router();

// POST /api/telegram/verify_code - Verify code and link telegram account
router.post('/verify_code', verifyTelegramCode);

// POST /api/telegram/generate_code - Generate verification code for user
router.post('/generate_code', generateVerificationCode);

// POST /api/telegram/send - Send message to user
router.post('/send', sendMessage);

// POST /api/telegram/notify_suspicious_transaction - Notify about suspicious transaction
router.post('/notify_suspicious_transaction', notifySuspiciousTransaction);

// POST /api/telegram/webhook - Telegram webhook for updates
router.post('/webhook', webhookReceiver);

export default router;
