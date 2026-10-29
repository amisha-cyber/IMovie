import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { env } from '../src/config/environment.js';
import { emailService } from '../src/services/emailService.js';
import { generateVerificationOtp, hashVerificationValue } from '../src/utils/crypto.js';

describe('Phase 2 Auth & Session Hardening Test Suite', () => {
  const legacyUserEmail = 'legacy_session@testmovies.com';
  const shortPassEmail = 'short_pwd@testmovies.com';
  const parallelOtpEmail = 'parallel_otp@testmovies.com';
  const rollbackUserEmail = 'smtp_rollback@testmovies.com';
  const resetUserEmail = 'pwd_reset@testmovies.com';

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({
      email: {
        $in: [
          legacyUserEmail,
          shortPassEmail,
          parallelOtpEmail,
          rollbackUserEmail,
          resetUserEmail
        ]
      }
    });
  });

  afterAll(async () => {
    await User.deleteMany({
      email: {
        $in: [
          legacyUserEmail,
          shortPassEmail,
          parallelOtpEmail,
          rollbackUserEmail,
          resetUserEmail
        ]
      }
    });
    await disconnectDB();
  });

  describe('1. Legacy Token Backward Compatibility (Missing Claim = 0)', () => {
    it('accepts tokens generated without a tokenVersion claim when user tokenVersion is 0', async () => {
      const user = await User.create({
        name: 'Legacy Token User',
        email: legacyUserEmail,
        passwordHash: await bcrypt.hash('Secure@123456', 10),
        role: 'user',
        tokenVersion: 0,
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      });

      // Craft an old token without tokenVersion claim
      const legacyToken = jwt.sign(
        {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          name: user.name
        },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${legacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(legacyUserEmail);
    });
  });

  describe('2. Old Short Passwords & Bcrypt Rehash at Login', () => {
    it('allows existing users with old short 6-char passwords to log in and upgrades salt rounds to 12', async () => {
      // Old password "secret" (6 chars) hashed with 8 rounds
      const oldSalt = await bcrypt.genSalt(8);
      const oldHash = await bcrypt.hash('secret', oldSalt);
      expect(bcrypt.getRounds(oldHash)).toBe(8);

      const user = await User.create({
        name: 'Short Password User',
        email: shortPassEmail,
        passwordHash: oldHash,
        role: 'user',
        tokenVersion: 0,
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      });

      // Old short password can still log in
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: shortPassEmail,
          password: 'secret'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();

      // Check database: bcrypt hash was automatically upgraded to 12 rounds
      const updatedUser = await User.findById(user._id);
      const newRounds = bcrypt.getRounds(updatedUser.passwordHash);
      expect(newRounds).toBe(12);

      // Verify that the user can continue logging in with the upgraded hash
      const followUpRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: shortPassEmail,
          password: 'secret'
        });
      expect(followUpRes.status).toBe(200);
    });
  });

  describe('3. Logout Invalidates Existing Token via tokenVersion', () => {
    it('invalidates the token immediately upon logout', async () => {
      // 1. Log in to get active token
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: legacyUserEmail,
          password: 'Secure@123456'
        });

      expect(loginRes.status).toBe(200);
      const token = loginRes.body.data.token;
      expect(token).toBeDefined();

      // 2. Token works on protected endpoint
      const meBefore = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(meBefore.status).toBe(200);

      // 3. Perform logout
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);
      expect(logoutRes.status).toBe(200);

      // 4. Old token is now rejected on protected endpoint
      const meAfter = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(meAfter.status).toBe(401);
      expect(meAfter.body.message).toContain('Session expired or invalidated');
    });
  });

  describe('4. Atomic OTP Counter & Race Condition Protection', () => {
    it('parallel incorrect OTP attempts atomically hit the lock without race conditions', async () => {
      const correctOtp = '888888';
      const otpHash = hashVerificationValue(correctOtp);

      const user = await User.create({
        name: 'Parallel OTP Candidate',
        email: parallelOtpEmail,
        passwordHash: await bcrypt.hash('Secure@123456', 10),
        role: 'user',
        isEmailVerified: false,
        emailVerificationOtpHash: otpHash,
        emailVerificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        emailVerificationAttempts: 0,
        emailVerificationLockedUntil: null
      });

      // Fire 10 parallel incorrect attempts
      const parallelRequests = Array.from({ length: 10 }).map((_, idx) =>
        request(app)
          .post('/api/v1/auth/verify-email')
          .send({
            email: parallelOtpEmail,
            otp: `00000${idx}`
          })
      );

      const responses = await Promise.all(parallelRequests);
      const statuses = responses.map((r) => r.status);

      // Exactly 5 attempts should consume remaining chances (status 400),
      // and subsequent parallel attempts must be locked out with status 429
      const error400s = statuses.filter((s) => s === 400);
      const error429s = statuses.filter((s) => s === 429);

      expect(error400s.length).toBe(5);
      expect(error429s.length).toBe(5);

      // Verify that the user record has the temporary lock active
      const lockedUser = await User.findById(user._id);
      expect(lockedUser.emailVerificationAttempts).toBeGreaterThanOrEqual(5);
      expect(lockedUser.emailVerificationLockedUntil).toBeDefined();
      expect(new Date(lockedUser.emailVerificationLockedUntil).getTime()).toBeGreaterThan(Date.now());

      // Even submitting the correct OTP while locked must be rejected with 429
      const lockedAttempt = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({
          email: parallelOtpEmail,
          otp: correctOtp
        });
      expect(lockedAttempt.status).toBe(429);
      expect(lockedAttempt.body.code).toBe('TOO_MANY_ATTEMPTS');
    });
  });

  describe('5. Production SMTP Failure Account Rollback', () => {
    it('rolls back half-created user if SMTP fails during production registration', async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const emailSpy = vi.spyOn(emailService, 'sendVerificationEmail').mockRejectedValue(
        new Error('Simulated SMTP Connection Refused')
      );

      try {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            name: 'Rollback Candidate',
            email: rollbackUserEmail,
            password: 'StrongPassword@123',
            confirmPassword: 'StrongPassword@123'
          });

        expect(res.status).toBe(502);
        expect(res.body.success).toBe(false);

        // Account must NOT exist in MongoDB
        const orphan = await User.findOne({ email: rollbackUserEmail });
        expect(orphan).toBeNull();
      } finally {
        emailSpy.mockRestore();
        process.env.NODE_ENV = prevEnv;
      }
    });
  });

  describe('6. Password Reset Flow with Session Invalidation', () => {
    it('generates reset token, resets password with complexity check, and invalidates older sessions', async () => {
      const user = await User.create({
        name: 'Reset Candidate',
        email: resetUserEmail,
        passwordHash: await bcrypt.hash('OldSecure@123', 10),
        role: 'user',
        tokenVersion: 0,
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      });

      // Generate active session
      const preResetLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: resetUserEmail,
          password: 'OldSecure@123'
        });
      const preResetToken = preResetLogin.body.data.token;

      // 1. Request forgot password
      const forgotRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: resetUserEmail });

      expect(forgotRes.status).toBe(200);
      expect(forgotRes.body.success).toBe(true);

      // Verify token hash stored in DB
      const userWithReset = await User.findById(user._id);
      expect(userWithReset.passwordResetTokenHash).toBeDefined();
      expect(userWithReset.passwordResetExpiresAt).toBeDefined();

      // Test reset endpoint with weak password (fails policy)
      const weakResetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'dummy_token',
          password: 'weak',
          confirmPassword: 'weak'
        });
      expect(weakResetRes.status).toBe(400);

      // Test reset with valid token and strong password
      // For testing, mock the raw token that matches the hash
      const testRawToken = 'test_reset_token_raw_hex_string_12345';
      const crypto = await import('crypto');
      const testHash = crypto.createHash('sha256').update(testRawToken).digest('hex');
      userWithReset.passwordResetTokenHash = testHash;
      await userWithReset.save();

      const validResetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: testRawToken,
          password: 'NewStrongPassword@2026!',
          confirmPassword: 'NewStrongPassword@2026!'
        });

      expect(validResetRes.status).toBe(200);
      expect(validResetRes.body.success).toBe(true);

      // Old session token is now invalidated!
      const meWithOldToken = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${preResetToken}`);
      expect(meWithOldToken.status).toBe(401);

      // 4. Test Single-Use: Reusing the same reset token must be rejected with 400
      const reusedResetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: testRawToken,
          password: 'AnotherPassword@2026!',
          confirmPassword: 'AnotherPassword@2026!'
        });
      expect(reusedResetRes.status).toBe(400);
      expect(reusedResetRes.body.message).toContain('Invalid or expired password reset token');
    });

    it('rejects expired password reset tokens', async () => {
      const expiredRawToken = 'expired_raw_token_hex_string_67890';
      const crypto = await import('crypto');
      const expiredHash = crypto.createHash('sha256').update(expiredRawToken).digest('hex');

      await User.updateOne(
        { email: resetUserEmail },
        {
          passwordResetTokenHash: expiredHash,
          passwordResetExpiresAt: new Date(Date.now() - 60 * 1000) // 1 minute in the past
        }
      );

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: expiredRawToken,
          password: 'ValidPassword1234!',
          confirmPassword: 'ValidPassword1234!'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid or expired password reset token');
    });

    it('returns identical generic responses for forgot-password for existing and non-existing emails', async () => {
      const resExisting = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: resetUserEmail });

      const resNonExisting = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent_account_xyz@testmovies.com' });

      expect(resExisting.status).toBe(200);
      expect(resNonExisting.status).toBe(200);
      expect(resExisting.body.message).toBe(resNonExisting.body.message);
      expect(resExisting.body.success).toBe(true);
      expect(resNonExisting.body.success).toBe(true);
    });
  });

  describe('7. CSRF Protection for Cookie Authentication on Mutating Endpoints', () => {
    it('blocks mutating requests using cookie authentication without CSRF header', async () => {
      const user = await User.findOne({ email: legacyUserEmail });
      const token = jwt.sign(
        {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          tokenVersion: user.tokenVersion || 0
        },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

      // 1. Mutating POST using Cookie without CSRF header is rejected with 403
      const blockedRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', [`token=${token}`]);

      expect(blockedRes.status).toBe(403);
      expect(blockedRes.body.message).toContain('CSRF protection check failed for cookie authentication');

      // 2. Mutating POST using Cookie with X-IMovies-Client header succeeds
      const allowedRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', [`token=${token}`])
        .set('X-IMovies-Client', '1');

      expect(allowedRes.status).toBe(200);
    });
  });

  describe('8. HS256 Algorithm Pinning and Rejection of Non-HS256 Tokens', () => {
    it('pins HS256 algorithm and rejects tokens verified with other algorithms or none', async () => {
      const { verifyAccessToken } = await import('../src/utils/token.js');
      // Token signed with 'none' algorithm must fail verification
      const forgedNoneToken = jwt.sign(
        { id: '123456789012345678901234', email: 'forged@test.com' },
        '',
        { algorithm: 'none' }
      );

      const verified = verifyAccessToken(forgedNoneToken);
      expect(verified).toBeNull();
    });
  });

  describe('9. Auth Middleware Suspended & Deleted User Enforcement on Every Request', () => {
    it('rejects suspended users on every request immediately even with valid token', async () => {
      const suspendedEmail = 'suspended_user@testmovies.com';
      const user = await User.create({
        name: 'Suspended Candidate',
        email: suspendedEmail,
        passwordHash: await bcrypt.hash('SecurePassword@123', 10),
        role: 'user',
        tokenVersion: 0,
        isEmailVerified: true,
        accountStatus: 'active'
      });

      const { generateAccessToken } = await import('../src/utils/token.js');
      const token = generateAccessToken(user);

      // Initially active request succeeds
      const okRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(okRes.status).toBe(200);

      // Suspend user in DB
      await User.updateOne({ _id: user._id }, { accountStatus: 'suspended' });

      // Immediate subsequent request must fail with 401
      const blockedRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(blockedRes.status).toBe(401);
      expect(blockedRes.body.message).toContain('User account is not active, suspended, or deleted');
    });
  });
});
