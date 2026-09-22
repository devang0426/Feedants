import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { resolveLang } from './middleware/lang.js';
import { router } from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import { postRazorpayWebhook } from './controllers/webhookController.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins.includes('*') ? true : env.corsOrigins,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Admin-Key'],
    })
  );
  // Gateway webhooks are signed over the raw bytes, so they bypass the JSON parser.
  app.post('/api/v1/webhooks/razorpay', express.raw({ type: '*/*', limit: '100kb' }), postRazorpayWebhook);
  app.use(express.json({ limit: '100kb' }));
  if (!env.isTest) {
    app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/v1/health' } }));
  }
  app.use(resolveLang);

  app.use('/api/v1', router);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
