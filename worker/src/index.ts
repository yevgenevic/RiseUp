import Queue from 'bull';
import { query as dbQuery } from './config/database.js';
import pino from 'pino';

const logger = pino();

// Initialize Redis connection for queues
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Define job queues
const scoringQueue = new Queue('credit_scoring', redisConfig);
const notificationQueue = new Queue('notifications', redisConfig);
const ocrQueue = new Queue('ocr', redisConfig);
const reportQueue = new Queue('reports', redisConfig);

// Credit Scoring Job
scoringQueue.process(async (job) => {
  logger.info(`Processing credit scoring job: ${job.id}`);

  try {
    const { creditAppId, userId } = job.data;

    // Simulate ML scoring (in production, call actual ML service)
    const score = Math.random() * 100;
    const explain = `Credit score: ${score.toFixed(2)}/100. Based on transaction history and KYC verification.`;

    // Update credit application
    await dbQuery(
      `UPDATE credit_applications 
       SET score = $1, explain_text = $2, updated_at = NOW()
       WHERE id = $3`,
      [score, explain, creditAppId]
    );

    // Send notification
    await notificationQueue.add({ creditAppId, userId, score });

    return { success: true, score };
  } catch (error) {
    logger.error('Credit scoring error:', error);
    throw error;
  }
});

// Notification Job
notificationQueue.process(async (job) => {
  logger.info(`Sending notification for job: ${job.id}`);

  try {
    const { creditAppId, userId, score } = job.data;

    // TODO: Send email/push/telegram notifications
    logger.info(`Notification sent: user=${userId}, score=${score}`);

    return { success: true };
  } catch (error) {
    logger.error('Notification error:', error);
    throw error;
  }
});

// OCR Document Processing
ocrQueue.process(async (job) => {
  logger.info(`Processing OCR job: ${job.id}`);

  try {
    const { documentId, filePath } = job.data;

    // TODO: Call OCR service (Tesseract or cloud service)
    const extractedData = { /* extracted data */ };

    // Update KYC document
    await dbQuery(
      `UPDATE kyc_documents 
       SET extracted_data = $1, status = $2
       WHERE id = $3`,
      [JSON.stringify(extractedData), 'verified', documentId]
    );

    return { success: true };
  } catch (error) {
    logger.error('OCR error:', error);
    throw error;
  }
});

// Report Generation
reportQueue.process(async (job) => {
  logger.info(`Generating report job: ${job.id}`);

  try {
    const { reportType, userId } = job.data;

    // Generate report based on type
    logger.info(`Report generated: type=${reportType}, user=${userId}`);

    return { success: true };
  } catch (error) {
    logger.error('Report generation error:', error);
    throw error;
  }
});

// Listen to job events
scoringQueue.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

scoringQueue.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed: ${error.message}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down worker...');
  await scoringQueue.close();
  await notificationQueue.close();
  await ocrQueue.close();
  await reportQueue.close();
  process.exit(0);
});

logger.info('Worker service started');
