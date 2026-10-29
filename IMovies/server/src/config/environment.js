import dotenv from 'dotenv';
dotenv.config();

/**
 * Fail-closed production check.
 * Any environment other than explicitly 'development' or 'test' is treated as production.
 */
export const isProduction = (...args) => {
  const target = args.length > 0 ? args[0] : process.env.NODE_ENV;
  const envStr = (target || '').trim().toLowerCase();
  return envStr !== 'development' && envStr !== 'test';
};

export const SAMPLE_JWT_SECRETS = [
  'imovies_super_secret_jwt_access_token_key_change_in_production_2026',
  'imovies_super_secret_refresh_token_key_change_in_production_2026',
  'secret',
  'jwt_secret',
  'changeme',
  '12345678901234567890123456789012',
  'your_jwt_access_secret_key_here_minimum_32_characters'
];

/**
 * Validates critical environment variables.
 * Fails fast in production or fail-closed modes.
 */
export const validateEnvironment = (targetEnv = process.env) => {
  const nodeEnv = targetEnv.NODE_ENV;
  if (!isProduction(nodeEnv)) {
    return true;
  }

  const jwtSecret = targetEnv.JWT_ACCESS_SECRET;
  if (!jwtSecret || !jwtSecret.trim()) {
    throw new Error('CRITICAL CONFIG ERROR: Missing required environment variable JWT_ACCESS_SECRET in production');
  }

  if (jwtSecret.length < 32) {
    throw new Error('CRITICAL CONFIG ERROR: JWT_ACCESS_SECRET must be at least 32 characters long in production');
  }

  const isSample = SAMPLE_JWT_SECRETS.includes(jwtSecret) ||
    jwtSecret.toLowerCase().includes('change_in_production') ||
    jwtSecret.toLowerCase().includes('imovies_super_secret');
  if (isSample) {
    throw new Error('CRITICAL CONFIG ERROR: JWT_ACCESS_SECRET must not use a sample/default placeholder in production');
  }

  const paymentProvider = (targetEnv.PAYMENT_PROVIDER || 'simulated').trim().toLowerCase();
  if (paymentProvider === 'simulated') {
    throw new Error("CRITICAL CONFIG ERROR: PAYMENT_PROVIDER cannot be 'simulated' in production");
  }

  return true;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/imovies',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'imovies_super_secret_jwt_access_token_key_change_in_production_2026',
  // Access token lifetime default: 2 hours (1-2h policy)
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '2h',
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || 'simulated',
  PAYMENT_TEST_MODE: process.env.PAYMENT_TEST_MODE !== 'false',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  ADMIN_SEED_NAME: process.env.ADMIN_SEED_NAME || 'Cinema SuperAdmin',
  ADMIN_SEED_EMAIL: process.env.ADMIN_SEED_EMAIL || 'admin@imovies.com',
  ADMIN_SEED_PASSWORD: process.env.ADMIN_SEED_PASSWORD || 'Admin@123456',
  ADMIN_SEED_PHONE: process.env.ADMIN_SEED_PHONE || '+919876543210',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'IMovies Cinema <noreply@imovies.com>',
  EMAIL_VERIFICATION_TOKEN_TTL_MINUTES: parseInt(process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES, 10) || 60
};

// Fail fast at startup in production
if (isProduction()) {
  validateEnvironment(process.env);
}
