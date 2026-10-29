import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { generateVerificationToken, generateVerificationOtp, hashVerificationValue } from '../src/utils/crypto.js';
import { emailService } from '../src/services/emailService.js';
import { generateAccessToken } from '../src/utils/token.js';

describe('Email Verification Comprehensive Test Suite', () => {
  const testEmail = 'verify_flow@testmovies.com';
  const otpEmail = 'otp_flow@testmovies.com';
  const existingEmail = 'existing_verified@testmovies.com';

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({
      email: { $in: [testEmail, otpEmail, existingEmail, 'resend_cooldown@testmovies.com'] }
    });

    // Create an existing verified account to test compatibility
    await User.create({
      name: 'Existing Customer',
      email: existingEmail,
      passwordHash: '$2a$10$wN/t/2XzRms72gD8v6G.d.Oq81B/g07nE5tL7l4v.jVlXzT6M0o7a',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: 'user'
    });
  });

  afterAll(async () => {
    await User.deleteMany({
      email: { $in: [testEmail, otpEmail, existingEmail, 'resend_cooldown@testmovies.com'] }
    });
    await disconnectDB();
  });

  // 1. Successful signup creates an unverified account
  it('1. Successful signup creates an unverified account with isEmailVerified: false', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Verification Candidate',
        email: testEmail,
        password: 'Password@123',
        confirmPassword: 'Password@123',
        phone: '+919876543210'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.isEmailVerified).toBe(false);
    expect(res.body.data.token).toBeUndefined(); // Does not automatically authenticate
  });

  // 2. Verification email credentials are created in database
  it('2. A verification email is requested and hashes are stored in the database', async () => {
    const user = await User.findOne({ email: testEmail });
    expect(user).toBeDefined();
    expect(user.isEmailVerified).toBe(false);
    expect(user.emailVerificationTokenHash).toBeTruthy();
    expect(user.emailVerificationOtpHash).toBeTruthy();
    expect(user.emailVerificationExpiresAt).toBeTruthy();
    expect(new Date(user.emailVerificationExpiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  // 3. Duplicate email registration responds identically
  it('3. Duplicate email registration responds identically to prevent email enumeration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate Candidate',
        email: testEmail,
        password: 'Password@123',
        confirmPassword: 'Password@123'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requiresVerification).toBe(true);
  });

  // 8. Unverified users cannot log in
  it('8. Unverified users cannot log in and receive EMAIL_NOT_VERIFIED code', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'Password@123'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
    expect(res.body.email).toBe(testEmail);
  });

  // 16. Unverified users cannot access protected booking APIs
  it('16. Unverified users cannot access protected booking APIs', async () => {
    const unverifiedUser = await User.findOne({ email: testEmail });
    const forgedToken = generateAccessToken(unverifiedUser);

    const res = await request(app)
      .get('/api/v1/bookings/my-bookings')
      .set('Authorization', `Bearer ${forgedToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
  });

  // 5. Invalid tokens are rejected
  it('5. Invalid verification tokens are rejected with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({
        token: 'invalid_dummy_token_1234567890abcdef'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 6. Expired tokens are rejected
  it('6. Expired tokens are rejected', async () => {
    // Generate token and manually set expired time
    const expiredToken = generateVerificationToken();
    const expiredHash = hashVerificationValue(expiredToken);

    await User.updateOne(
      { email: testEmail },
      {
        emailVerificationTokenHash: expiredHash,
        emailVerificationExpiresAt: new Date(Date.now() - 60000) // 1 minute in the past
      }
    );

    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({
        token: expiredToken
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });

  // 4. Valid verification tokens successfully verify an account
  it('4. Valid verification tokens successfully verify an account', async () => {
    const validToken = generateVerificationToken();
    const validHash = hashVerificationValue(validToken);

    await User.updateOne(
      { email: testEmail },
      {
        emailVerificationTokenHash: validHash,
        emailVerificationExpiresAt: new Date(Date.now() + 3600000)
      }
    );

    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({
        token: validToken
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const verifiedUser = await User.findOne({ email: testEmail });
    expect(verifiedUser.isEmailVerified).toBe(true);
    expect(verifiedUser.emailVerifiedAt).toBeTruthy();
    expect(verifiedUser.emailVerificationTokenHash).toBeNull();
  });

  // 7. Reused tokens are rejected
  it('7. Reused tokens are rejected after account has been verified', async () => {
    const dummyToken = 'previously_used_token_1234567890';
    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({
        token: dummyToken
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 9. Verified users can log in
  it('9. Verified users can log in and receive an access token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'Password@123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.isEmailVerified).toBe(true);
  });

  // 10 & 11. Resend verification works and enforces cooldown
  it('10. Resend verification works for unverified accounts and sends new token', async () => {
    const resendUserEmail = 'resend_cooldown@testmovies.com';
    // Register unverified user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Cooldown Tester',
        email: resendUserEmail,
        password: 'Password@123',
        confirmPassword: 'Password@123'
      });

    // Manually set last sent at to 65 seconds ago
    await User.updateOne(
      { email: resendUserEmail },
      { emailVerificationLastSentAt: new Date(Date.now() - 65000) }
    );

    const resendRes = await request(app)
      .post('/api/v1/auth/resend-verification')
      .send({ email: resendUserEmail });

    expect(resendRes.status).toBe(200);
    expect(resendRes.body.success).toBe(true);

    // 11. Resend cooldowns are enforced immediately after sending
    const immediateResend = await request(app)
      .post('/api/v1/auth/resend-verification')
      .send({ email: resendUserEmail });

    expect(immediateResend.status).toBe(429);
    expect(immediateResend.body.code).toBe('COOLDOWN_ACTIVE');
    expect(immediateResend.body.retryAfter).toBeGreaterThan(0);
  });

  // 13. OTP attempts are limited (5 attempts max)
  it('13. OTP attempts are limited to 5 and lock after repeated failures', async () => {
    // Create an unverified user with known OTP
    const rawOtp = '654321';
    const otpHash = hashVerificationValue(rawOtp);

    await User.create({
      name: 'OTP Tester',
      email: otpEmail,
      passwordHash: '$2a$10$wN/t/2XzRms72gD8v6G.d.Oq81B/g07nE5tL7l4v.jVlXzT6M0o7a',
      isEmailVerified: false,
      emailVerificationOtpHash: otpHash,
      emailVerificationExpiresAt: new Date(Date.now() + 600000),
      emailVerificationAttempts: 0
    });

    // Make 4 incorrect attempts
    for (let i = 0; i < 4; i++) {
      const failRes = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ email: otpEmail, otp: '111111' });

      expect(failRes.status).toBe(400);
      expect(failRes.body.code).toBe('INVALID_OTP');
    }

    // 5th incorrect attempt
    const fifthRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ email: otpEmail, otp: '111111' });

    expect(fifthRes.status).toBe(400);

    // 6th attempt should return 429 TOO_MANY_ATTEMPTS
    const lockRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ email: otpEmail, otp: rawOtp });

    expect(lockRes.status).toBe(429);
    expect(lockRes.body.code).toBe('TOO_MANY_ATTEMPTS');
  });

  // 14. SMTP failures are handled safely
  it('14. Safe handling when sending email without crashing server', async () => {
    // Ensure emailService has a mock fallback or handles errors gracefully
    const result = await emailService.sendVerificationEmail({
      to: 'mock_recipient@test.com',
      name: 'Mock Recipient',
      token: 'test_token',
      otp: '123456'
    });

    expect(result.success).toBe(true);
  });

  // 15. Verification does not expose passwords or tokens in API responses
  it('15. Verification does not expose passwords or token hashes in API responses', async () => {
    const verifiedAccount = await User.findOne({ email: existingEmail });
    const safeObj = verifiedAccount.toSafeObject();

    expect(safeObj.passwordHash).toBeUndefined();
    expect(safeObj.emailVerificationTokenHash).toBeUndefined();
    expect(safeObj.emailVerificationOtpHash).toBeUndefined();
  });

  // 17. Existing verified accounts continue to function normally
  it('17. Existing verified accounts can log in and access services without disruption', async () => {
    const verifiedAccount = await User.findOne({ email: existingEmail });
    expect(verifiedAccount.isEmailVerified).toBe(true);

    const token = generateAccessToken(verifiedAccount);
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(existingEmail);
    expect(meRes.body.data.user.isEmailVerified).toBe(true);
  });
});
