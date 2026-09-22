import dotenv from 'dotenv';

dotenv.config();

const toInt = (value, fallback) => {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
};

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: toInt(process.env.PORT, 4000),
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminApiKey: process.env.ADMIN_API_KEY || 'admin-dev-key',
  reservationTtlSeconds: toInt(process.env.RESERVATION_TTL_SECONDS, 600),
  reservationSweepIntervalMs: toInt(process.env.RESERVATION_SWEEP_INTERVAL_MS, 15000),
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim()),
  referralBaseUrl: process.env.REFERRAL_BASE_URL || 'https://feedants.com/r',
  razorpay: Object.freeze({
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  }),
});
