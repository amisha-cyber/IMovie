import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { isProduction, validateEnvironment, SAMPLE_JWT_SECRETS } from '../src/config/environment.js';
import { isOriginAllowed, getAllowedOrigins } from '../src/config/cors.js';
import app from '../src/app.js';
import { emailService } from '../src/services/emailService.js';
import { seedDatabase } from '../src/scripts/seed.js';

describe('Phase 1 Security & Startup Validation Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. Fail-Closed isProduction() Behavior', () => {
    it('treats undefined NODE_ENV as production (fail-closed)', () => {
      expect(isProduction(undefined)).toBe(true);
    });

    it('treats empty string NODE_ENV as production (fail-closed)', () => {
      expect(isProduction('')).toBe(true);
      expect(isProduction('   ')).toBe(true);
    });

    it('treats staging, prod, production as production', () => {
      expect(isProduction('production')).toBe(true);
      expect(isProduction('PRODUCTION')).toBe(true);
      expect(isProduction('staging')).toBe(true);
      expect(isProduction('uat')).toBe(true);
    });

    it('treats only development and test as non-production', () => {
      expect(isProduction('development')).toBe(false);
      expect(isProduction('DEVELOPMENT')).toBe(false);
      expect(isProduction('test')).toBe(false);
      expect(isProduction('TEST')).toBe(false);
    });
  });

  describe('2. Sample JWT Secret Rejection at Startup', () => {
    it('throws when JWT_ACCESS_SECRET uses the sample placeholder in production', () => {
      expect(() => {
        validateEnvironment({
          NODE_ENV: 'production',
          JWT_ACCESS_SECRET: 'imovies_super_secret_jwt_access_token_key_change_in_production_2026',
          PAYMENT_PROVIDER: 'razorpay'
        });
      }).toThrow(/sample\/default placeholder in production/);
    });

    it('throws when JWT_ACCESS_SECRET contains change_in_production in production', () => {
      expect(() => {
        validateEnvironment({
          NODE_ENV: 'production',
          JWT_ACCESS_SECRET: 'my_custom_secret_key_change_in_production_123456789',
          PAYMENT_PROVIDER: 'razorpay'
        });
      }).toThrow(/sample\/default placeholder in production/);
    });

    it('throws when JWT_ACCESS_SECRET is under 32 characters in production', () => {
      expect(() => {
        validateEnvironment({
          NODE_ENV: 'production',
          JWT_ACCESS_SECRET: 'short_key_under_32_characters',
          PAYMENT_PROVIDER: 'razorpay'
        });
      }).toThrow(/at least 32 characters long in production/);
    });

    it('throws when JWT_ACCESS_SECRET is missing in production', () => {
      expect(() => {
        validateEnvironment({
          NODE_ENV: 'production',
          JWT_ACCESS_SECRET: '',
          PAYMENT_PROVIDER: 'razorpay'
        });
      }).toThrow(/Missing required environment variable JWT_ACCESS_SECRET/);
    });

    it('throws when NODE_ENV is unset and JWT secret is a sample (fail-closed)', () => {
      expect(() => {
        validateEnvironment({
          NODE_ENV: undefined,
          JWT_ACCESS_SECRET: 'imovies_super_secret_jwt_access_token_key_change_in_production_2026',
          PAYMENT_PROVIDER: 'razorpay'
        });
      }).toThrow(/sample\/default placeholder in production/);
    });

    it('allows strong, unique, >=32 char JWT secret in production', () => {
      expect(
        validateEnvironment({
          NODE_ENV: 'production',
          JWT_ACCESS_SECRET: 'a_very_secure_high_entropy_secret_key_for_production_use_2026!',
          PAYMENT_PROVIDER: 'razorpay'
        })
      ).toBe(true);
    });

    it('allows sample secret in development and test environments', () => {
      expect(
        validateEnvironment({
          NODE_ENV: 'development',
          JWT_ACCESS_SECRET: 'imovies_super_secret_jwt_access_token_key_change_in_production_2026',
          PAYMENT_PROVIDER: 'simulated'
        })
      ).toBe(true);

      expect(
        validateEnvironment({
          NODE_ENV: 'test',
          JWT_ACCESS_SECRET: 'imovies_super_secret_jwt_access_token_key_change_in_production_2026',
          PAYMENT_PROVIDER: 'simulated'
        })
      ).toBe(true);
    });
  });

  describe('3. Simulated Payment Provider Rejection in Production', () => {
    it('throws when PAYMENT_PROVIDER is simulated in production', () => {
      expect(() => {
        validateEnvironment({
          NODE_ENV: 'production',
          JWT_ACCESS_SECRET: 'a_very_secure_high_entropy_secret_key_for_production_use_2026!',
          PAYMENT_PROVIDER: 'simulated'
        });
      }).toThrow(/PAYMENT_PROVIDER cannot be 'simulated' in production/);
    });

    it('throws when PAYMENT_PROVIDER defaults to simulated when unset in production', () => {
      expect(() => {
        validateEnvironment({
          NODE_ENV: 'production',
          JWT_ACCESS_SECRET: 'a_very_secure_high_entropy_secret_key_for_production_use_2026!'
        });
      }).toThrow(/PAYMENT_PROVIDER cannot be 'simulated' in production/);
    });

    it('allows razorpay or stripe in production', () => {
      expect(
        validateEnvironment({
          NODE_ENV: 'production',
          JWT_ACCESS_SECRET: 'a_very_secure_high_entropy_secret_key_for_production_use_2026!',
          PAYMENT_PROVIDER: 'razorpay'
        })
      ).toBe(true);

      expect(
        validateEnvironment({
          NODE_ENV: 'production',
          JWT_ACCESS_SECRET: 'a_very_secure_high_entropy_secret_key_for_production_use_2026!',
          PAYMENT_PROVIDER: 'stripe'
        })
      ).toBe(true);
    });

    it('blocks /api/v1/payments/simulate with 403 Forbidden in production', async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const res = await request(app)
          .post('/api/v1/payments/simulate')
          .send({ orderId: 'ORD_TEST_123' });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Payment simulation is disabled in production');
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });
  });

  describe('4. Strict CORS & Socket.IO Origin Whitelist', () => {
    it('rejects arbitrary *.pages.dev domains', () => {
      expect(isOriginAllowed('https://attacker.pages.dev')).toBe(false);
      expect(isOriginAllowed('https://malicious-clone.pages.dev')).toBe(false);
      expect(isOriginAllowed('https://evil.com')).toBe(false);
    });

    it('allows configured origins and requests with no origin', () => {
      expect(isOriginAllowed(null)).toBe(true);
      expect(isOriginAllowed(undefined)).toBe(true);
      expect(isOriginAllowed('')).toBe(true);
    });
  });

  describe('5. Production Database Seeding Protection', () => {
    it('refuses to seed in production without ALLOW_PRODUCTION_SEED=true', async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevAllow = process.env.ALLOW_PRODUCTION_SEED;
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_PRODUCTION_SEED;
      try {
        await expect(seedDatabase({ reset: false, closeConnection: false })).rejects.toThrow(
          /Production database seeding is blocked/
        );
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevAllow) process.env.ALLOW_PRODUCTION_SEED = prevAllow;
      }
    });
  });

  describe('6. Email Service Mock Protection in Production', () => {
    it('refuses to deliver mock verification emails in production', async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        await expect(
          emailService.sendVerificationEmail({
            to: 'test@example.com',
            name: 'Test',
            token: 'sampletoken',
            otp: '123456'
          })
        ).rejects.toThrow(/Failed to deliver verification email/);
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });
  });
});
