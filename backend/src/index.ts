import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'express-async-errors';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import { initializeDatabase } from './config/database.js';
import { initializeRedis } from './config/redis.js';
import authRoutes from './modules/auth/auth.routes.js';
import accountsRoutes from './modules/accounts/accounts.routes.js';
import kycRoutes from './modules/kyc/kyc.routes.js';
import creditRoutes from './modules/credit/credit.routes.js';
import branchesRoutes from './modules/branches/branches.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import fraudRoutes from './modules/fraud/fraud.routes.js';
import telegramRoutes from './modules/telegram/telegram.routes.js';
import financeRoutes from './modules/finance/finance.routes.js';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('combined', { stream: { write: (msg: string) => logger.info(msg.trim()) } }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/credit', creditRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', chatRoutes); // Alias for AI endpoints
app.use('/api/fraud', fraudRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/finance', financeRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/metrics', (req: Request, res: Response) => {
  // Placeholder for Prometheus metrics
  res.set('Content-Type', 'text/plain');
  res.send('# No metrics yet\n');
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
  });
});

// Initialize and start server
const startServer = async () => {
  try {
    logger.info('Initializing database...');
    await initializeDatabase();

    logger.info('Initializing Redis...');
    await initializeRedis();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
