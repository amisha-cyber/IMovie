import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({ email: { $in: ['testuser@example.com', 'testadmin@example.com'] } });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['testuser@example.com', 'testadmin@example.com'] } });
    await disconnectDB();
  });

  it('should register a new user with isEmailVerified: false and send verification', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Customer',
        email: 'testuser@example.com',
        password: 'Password@123',
        confirmPassword: 'Password@123',
        phone: '+919999999999'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('testuser@example.com');
    expect(res.body.data.user.isEmailVerified).toBe(false);
    expect(res.body.data.token).toBeUndefined(); // No access token issued prior to verification
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('should respond identically for duplicate registration to prevent email enumeration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate Customer',
        email: 'testuser@example.com',
        password: 'Password@123',
        confirmPassword: 'Password@123'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requiresVerification).toBe(true);
  });

  it('should reject login for unverified user with code EMAIL_NOT_VERIFIED', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'Password@123'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('should log in once email is verified', async () => {
    // Simulate user verification
    await User.updateOne({ email: 'testuser@example.com' }, { isEmailVerified: true, emailVerifiedAt: new Date() });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'Password@123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.isEmailVerified).toBe(true);
  });

  it('should reject login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'WrongPassword999'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject unauthenticated request to /api/v1/auth/me', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
