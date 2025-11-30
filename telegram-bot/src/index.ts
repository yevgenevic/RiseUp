import TelegramBot, { InlineKeyboardButton } from 'node-telegram-bot-api';
import axios from 'axios';
import dotenv from 'dotenv';
import pino from 'pino';
import { query as dbQuery } from './config/database.js';

dotenv.config();

const logger = pino();
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

if (!TOKEN) {
  logger.error('TELEGRAM_BOT_TOKEN not set');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// Store user state for multi-step conversations
const userStates = new Map<number, any>();

// ============================================================================
// COMMAND: /start - Registration & Welcome
// ============================================================================
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || 'User';

  try {
    const user = await getUserByChatId(chatId);

    if (user && user.telegram_verified) {
      // Already verified
      await bot.sendMessage(
        chatId,
        `👋 Добро пожаловать, ${firstName}!\n\nВы уже авторизованы в RiseUp Bank.`,
        {
          reply_markup: {
            keyboard: [[{ text: '/balance' }, { text: '/transactions' }], [{ text: '/faq' }, { text: '/apply_credit' }], [{ text: '/help' }]],
            resize_keyboard: true,
          },
        }
      );
    } else {
      // New user - need verification
      await bot.sendMessage(
        chatId,
        `👋 Привет, ${firstName}!\n\n🔐 Добро пожаловать в RiseUp Bank\n\nДля привязки Telegram к вашему аккаунту:\n\n1️⃣ Откройте приложение или веб-сайт RiseUp\n2️⃣ Найдите раздел "Telegram" → "Копировать код"\n3️⃣ Отправьте код сюда\n\n⏳ Ожидаю ваш 6-значный код...`
      );

      userStates.set(chatId, { step: 'waiting_verification_code', firstName });
    }
  } catch (error) {
    logger.error('Start command error:', error);
    await bot.sendMessage(chatId, '❌ Ошибка. Попробуйте позже.');
  }
});

// ============================================================================
// Verification code handling
// ============================================================================
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const state = userStates.get(chatId);

  // Only process if waiting for code
  if (!state || state.step !== 'waiting_verification_code') {
    return;
  }

  const code = msg.text?.trim();

  if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
    await bot.sendMessage(chatId, '❌ Код должен быть 6 цифр. Попробуйте еще раз.');
    return;
  }

  try {
    // Verify code with backend
    const response = await axios.post(`${BACKEND_URL}/api/telegram/verify_code`, {
      telegramId: chatId,
      verificationCode: code,
    });

    userStates.delete(chatId);

    await bot.sendMessage(
      chatId,
      `✅ Успешно!\n\n🎉 Ваш аккаунт привязан к Telegram\n\nДоступные команды:\n/balance - Баланс\n/transactions - Последние транзакции\n/faq - FAQ\n/apply_credit - Заявка на кредит\n/help - Справка`,
      {
        reply_markup: {
          keyboard: [[{ text: '/balance' }, { text: '/transactions' }], [{ text: '/faq' }, { text: '/apply_credit' }], [{ text: '/help' }]],
          resize_keyboard: true,
        },
      }
    );

    logger.info(`User verified: ${chatId}`);
  } catch (error: any) {
    logger.error('Verification error:', error.response?.data || error.message);
    await bot.sendMessage(
      chatId,
      `❌ Неверный код. Пожалуйста, проверьте и попробуйте еще раз.`
    );
  }
});

// ============================================================================
// COMMAND: /balance - Show balance
// ============================================================================
bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await checkVerified(chatId);
    if (!user) {
      await bot.sendMessage(chatId, '❌ Сначала пройдите верификацию: /start');
      return;
    }

    const response = await axios.get(`${BACKEND_URL}/api/finance/balance`, {
      params: { telegram_id: chatId },
    });

    const { balance, currency, formatted } = response.data;

    await bot.sendMessage(
      chatId,
      `💰 <b>Ваш баланс</b>\n\n${formatted} ${currency}`,
      { parse_mode: 'HTML' }
    );
  } catch (error) {
    logger.error('Balance command error:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при получении баланса');
  }
});

// ============================================================================
// COMMAND: /transactions - Show recent transactions
// ============================================================================
bot.onText(/\/transactions(\s+(\d+))?/, async (msg) => {
  const chatId = msg.chat.id;
  const match = msg.text?.match(/\/transactions\s+(\d+)?/);
  const n = match && match[1] ? Math.min(parseInt(match[1]), 50) : 10;

  try {
    const user = await checkVerified(chatId);
    if (!user) {
      await bot.sendMessage(chatId, '❌ Сначала пройдите верификацию: /start');
      return;
    }

    const response = await axios.get(`${BACKEND_URL}/api/finance/transactions`, {
      params: { telegram_id: chatId, n },
    });

    const { transactions } = response.data;

    if (transactions.length === 0) {
      await bot.sendMessage(chatId, '📋 У вас нет транзакций');
      return;
    }

    let text = `<b>📋 Последние ${transactions.length} транзакции</b>\n\n`;

    transactions.forEach((tx: any) => {
      const icon = tx.type === 'credit' ? '➕' : '➖';
      const statusIcon = tx.status === 'completed' ? '✅' : '⏳';
      text += `${icon} ${tx.formatted} ${tx.currency}\n`;
      text += `   ${tx.description}\n`;
      text += `   ${tx.date} ${tx.time} ${statusIcon}\n\n`;
    });

    await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
  } catch (error) {
    logger.error('Transactions command error:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при получении транзакций');
  }
});

// ============================================================================
// COMMAND: /faq - AI Chat
// ============================================================================
bot.onText(/\/faq/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await checkVerified(chatId);
    if (!user) {
      await bot.sendMessage(chatId, '❌ Сначала пройдите верификацию: /start');
      return;
    }

    await bot.sendMessage(
      chatId,
      `🤖 <b>FAQ - Задайте мне вопрос</b>\n\nЯ помогу вам с информацией о кредитах, аккаунтах, KYC и другом.\n\n<i>Просто напишите ваш вопрос на русском языке.</i>`,
      { parse_mode: 'HTML' }
    );

    userStates.set(chatId, { step: 'waiting_faq_question' });
  } catch (error) {
    logger.error('FAQ command error:', error);
    await bot.sendMessage(chatId, '❌ Ошибка');
  }
});

// ============================================================================
// FAQ question handling
// ============================================================================
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const state = userStates.get(chatId);

  if (!state || state.step !== 'waiting_faq_question') {
    return;
  }

  const question = msg.text?.trim();
  if (!question) {
    return;
  }

  try {
    const user = await checkVerified(chatId);
    if (!user) {
      await bot.sendMessage(chatId, '❌ Сначала пройдите верификацию: /start');
      userStates.delete(chatId);
      return;
    }

    // Show loading
    const loadingMsg = await bot.sendMessage(chatId, '⏳ Ищу ответ...');

    // Ask AI
    const response = await axios.post(`${BACKEND_URL}/api/ai/ask`, {
      userId: user.id,
      question,
    });

    const { answer, cached } = response.data;

    // Delete loading message
    try {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
    } catch (e) {
      // Ignore
    }

    const cacheLabel = cached ? '📦 (из кэша)' : '🤖 (свежий ответ)';

    await bot.sendMessage(
      chatId,
      `<b>❓ Вопрос:</b> ${question}\n\n<b>💬 Ответ:</b> ${answer}\n\n<i>${cacheLabel}</i>\n\n/faq - задать еще вопрос`,
      { parse_mode: 'HTML' }
    );

    userStates.delete(chatId);
  } catch (error: any) {
    logger.error('FAQ processing error:', error.response?.data || error.message);
    await bot.sendMessage(chatId, '❌ Ошибка при обработке вопроса. Попробуйте еще раз.');
    userStates.delete(chatId);
  }
});

// ============================================================================
// COMMAND: /apply_credit - Credit application form
// ============================================================================
bot.onText(/\/apply_credit/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await checkVerified(chatId);
    if (!user) {
      await bot.sendMessage(chatId, '❌ Сначала пройдите верификацию: /start');
      return;
    }

    await bot.sendMessage(
      chatId,
      `📋 <b>Заявка на кредит</b>\n\n1. Какую сумму вы хотите получить?\n\nОтвет в числах (например: 5000000)`,
      { parse_mode: 'HTML' }
    );

    userStates.set(chatId, {
      step: 'credit_form_amount',
      userId: user.id,
      formData: {},
    });
  } catch (error) {
    logger.error('Apply credit command error:', error);
    await bot.sendMessage(chatId, '❌ Ошибка');
  }
});

// ============================================================================
// Credit form steps
// ============================================================================
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const state = userStates.get(chatId);
  const text = msg.text?.trim() || '';

  if (!state) return;

  try {
    if (state.step === 'credit_form_amount') {
      const amount = parseInt(text);
      if (isNaN(amount) || amount < 100000) {
        await bot.sendMessage(chatId, '❌ Введите сумму больше 100,000');
        return;
      }

      state.formData.amount = amount;
      state.step = 'credit_form_term';

      await bot.sendMessage(
        chatId,
        `2. На какой срок (в месяцах)?\n\nОтвет: 3, 6, 12, 24, 36`
      );
    } else if (state.step === 'credit_form_term') {
      const term = parseInt(text);
      if (![3, 6, 12, 24, 36].includes(term)) {
        await bot.sendMessage(chatId, '❌ Выберите из предложенных вариантов: 3, 6, 12, 24, 36');
        return;
      }

      state.formData.term = term;
      state.step = 'credit_form_purpose';

      await bot.sendMessage(
        chatId,
        `3. Цель кредита?\n\nНапример: образование, автомобиль, ремонт`
      );
    } else if (state.step === 'credit_form_purpose') {
      state.formData.purpose = text;
      state.step = 'credit_form_complete';

      // Submit application
      try {
        const response = await axios.post(`${BACKEND_URL}/api/credit/apply`, {
          userId: state.userId,
          amount: state.formData.amount,
          termMonths: state.formData.term,
          purpose: state.formData.purpose,
        });

        const { applicationId, score, status } = response.data;

        const statusText = status === 'approved' ? '✅ ОДОБРЕНА' : '⏳ На рассмотрении';

        await bot.sendMessage(
          chatId,
          `✅ <b>Заявка создана!</b>\n\nID: ${applicationId}\nСтатус: ${statusText}\nОценка: ${score}/100\n\n🔗 <a href="https://riseup.app/application/${applicationId}">Перейти в приложение</a>`,
          { parse_mode: 'HTML', disable_web_page_preview: false }
        );
      } catch (error: any) {
        await bot.sendMessage(
          chatId,
          `❌ Ошибка при создании заявки: ${error.response?.data?.error || error.message}`
        );
      }

      userStates.delete(chatId);
    }
  } catch (error) {
    logger.error('Credit form processing error:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при обработке формы');
    userStates.delete(chatId);
  }
});

// ============================================================================
// COMMAND: /help - Show help
// ============================================================================
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
    `<b>📚 Справка</b>\n\n<b>Доступные команды:</b>\n\n/start - Верификация аккаунта\n/balance - Ваш баланс\n/transactions [n] - Последние n транзакций (по умолчанию 10)\n/faq - Вопросы и ответы\n/apply_credit - Подать заявку на кредит\n/help - Эта справка\n\n<b>Примеры:</b>\n/transactions 5 - показать последние 5 транзакций\n/transactions 20 - показать последние 20 транзакций`,
    { parse_mode: 'HTML' }
  );
});

// ============================================================================
// Handle callback queries (button clicks)
// ============================================================================
bot.on('callback_query', async (query) => {
  const { data, from, id: queryId } = query;
  const chatId = from.id;

  try {
    const user = await getUserByChatId(chatId);

    if (!user) {
      await bot.answerCallbackQuery(queryId, {
        text: 'Пройдите верификацию: /start',
        show_alert: true,
      });
      return;
    }

    // Handle transaction confirmation
    if (data?.startsWith('confirm_txn_') || data?.startsWith('block_txn_')) {
      await axios.post(`${BACKEND_URL}/api/telegram/callback`, {
        callbackQueryId: queryId,
        userId: user.id,
        callbackData: data,
      });

      await bot.answerCallbackQuery(queryId, { text: '✅ Ответ принят' });
    }
  } catch (error) {
    logger.error('Callback query error:', error);
    await bot.answerCallbackQuery(queryId, {
      text: 'Ошибка',
      show_alert: true,
    });
  }
});

// ============================================================================
// Helper functions
// ============================================================================

async function checkVerified(chatId: number): Promise<any | null> {
  try {
    const result = await dbQuery(
      `SELECT id, telegram_id FROM users WHERE telegram_id = $1 AND telegram_verified = TRUE`,
      [chatId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    logger.error('Check verified error:', error);
    return null;
  }
}

async function getUserByChatId(chatId: number): Promise<any | null> {
  try {
    const result = await dbQuery(
      `SELECT id, telegram_id, telegram_verified FROM users WHERE telegram_id = $1`,
      [chatId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    logger.error('Get user error:', error);
    return null;
  }
}

// ============================================================================
// Bot start
// ============================================================================
logger.info(`🤖 Telegram bot started!`);
logger.info(`Token: ${TOKEN?.substring(0, 20)}...`);
logger.info(`Backend URL: ${BACKEND_URL}`);
