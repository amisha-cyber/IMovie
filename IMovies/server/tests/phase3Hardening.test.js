import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Movie } from '../src/models/Movie.js';
import { Theatre } from '../src/models/Theatre.js';
import { Screen } from '../src/models/Screen.js';
import { Show } from '../src/models/Show.js';
import { Booking } from '../src/models/Booking.js';
import { Payment } from '../src/models/Payment.js';
import { ShowSeat } from '../src/models/ShowSeat.js';
import { generateAccessToken } from '../src/utils/token.js';
import { seatReservationService } from '../src/services/seatReservationService.js';
import { BOOKING_STATUS, PAYMENT_STATUS, SEAT_STATUS } from '../src/utils/constants.js';

describe('Phase 3 Security, Concurrency & Data Integrity Suite', () => {
  let customerUser, attackerUser, adminUser;
  let customerToken, attackerToken, adminToken;
  let movie, theatre, screen, show;

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({ email: { $in: ['p3_user@test.com', 'p3_attacker@test.com', 'p3_admin@test.com'] } });
    await Movie.deleteMany({ title: { $regex: /P3 Test Movie/ } });
    await Theatre.deleteMany({ name: { $regex: /P3 Test Theatre/ } });

    customerUser = await User.create({
      name: 'Customer P3',
      email: 'p3_user@test.com',
      passwordHash: 'dummy_hash',
      role: 'user',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    customerToken = generateAccessToken(customerUser);

    attackerUser = await User.create({
      name: 'Attacker P3',
      email: 'p3_attacker@test.com',
      passwordHash: 'dummy_hash',
      role: 'user',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    attackerToken = generateAccessToken(attackerUser);

    adminUser = await User.create({
      name: 'Admin P3',
      email: 'p3_admin@test.com',
      passwordHash: 'dummy_hash',
      role: 'admin',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    adminToken = generateAccessToken(adminUser);

    movie = await Movie.create({
      title: 'P3 Test Movie',
      slug: 'p3-test-movie',
      synopsis: 'Security test movie',
      posterUrl: 'https://image.tmdb.org/t/p/w500/test.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w500/backdrop.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      genres: ['Action'],
      languages: ['English'],
      duration: 120,
      releaseDate: new Date()
    });

    theatre = await Theatre.create({
      name: 'P3 Test Theatre',
      slug: 'p3-test-theatre',
      address: 'Test Blvd',
      city: 'Metropolis'
    });

    screen = await Screen.create({
      theatre: theatre._id,
      name: 'P3 Screen 1',
      totalSeats: 2,
      seatingLayout: {
        rows: [
          {
            rowLetter: 'A',
            category: 'SILVER',
            priceMultiplier: 1,
            seats: [
              { seatNumber: 'A1', number: 1, isAisle: false },
              { seatNumber: 'A2', number: 2, isAisle: false }
            ]
          }
        ]
      }
    });

    show = await Show.create({
      movie: movie._id,
      theatre: theatre._id,
      screen: screen._id,
      startTime: new Date(Date.now() + 24 * 3600 * 1000),
      endTime: new Date(Date.now() + 26 * 3600 * 1000),
      basePrice: 200,
      seatPricing: { silver: 200, gold: 260, platinum: 360 },
      status: 'scheduled'
    });

    await seatReservationService.initializeShowSeats(show._id);
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['p3_user@test.com', 'p3_attacker@test.com', 'p3_admin@test.com'] } });
    if (show) await ShowSeat.deleteMany({ show: show._id });
    if (show) await Show.deleteOne({ _id: show._id });
    if (screen) await Screen.deleteOne({ _id: screen._id });
    if (theatre) await Theatre.deleteOne({ _id: theatre._id });
    if (movie) await Movie.deleteOne({ _id: movie._id });
    await disconnectDB();
  });

  describe('1. Payment Confirm Integrity: Expiry, Owner, Amount, Idempotency & Refund Path', () => {
    it('rejects confirmation and triggers automatic refund path when seat hold has expired', async () => {
      // Create a booking with an expired seat hold
      const booking = await Booking.create({
        bookingReference: `IMV-EXP-${Date.now().toString(36).toUpperCase()}`,
        user: customerUser._id,
        show: show._id,
        seats: [{ seatNumber: 'A1', category: 'SILVER', price: 200 }],
        totalAmount: 200,
        convenienceFee: 25,
        grandTotal: 225,
        status: BOOKING_STATUS.PENDING,
        paymentStatus: PAYMENT_STATUS.PENDING,
        holdToken: 'HOLD_EXPIRED_TEST_TOKEN',
        expiresAt: new Date(Date.now() - 10000) // Expired in the past
      });

      // ShowSeat is also expired
      await ShowSeat.updateOne(
        { show: show._id, seatNumber: 'A1' },
        {
          status: SEAT_STATUS.HELD,
          heldBy: customerUser._id,
          heldUntil: new Date(Date.now() - 10000),
          holdToken: 'HOLD_EXPIRED_TEST_TOKEN'
        }
      );

      const confirmRes = await request(app)
        .post('/api/v1/bookings/confirm')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id.toString(),
          orderId: 'SIM_ORD_EXPIRED',
          paymentId: 'SIM_PAY_EXPIRED_REFUND_1',
          method: 'card',
          amount: 225
        });

      expect(confirmRes.status).toBe(410);
      expect(confirmRes.body.message).toContain('seat hold has expired');
      expect(confirmRes.body.message).toContain('refund has been initiated');

      // Verify DB state: booking marked as EXPIRED and paymentStatus REFUNDED
      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking.status).toBe(BOOKING_STATUS.EXPIRED);
      expect(updatedBooking.paymentStatus).toBe(PAYMENT_STATUS.REFUNDED);

      // Verify seat released back to AVAILABLE
      const seat = await ShowSeat.findOne({ show: show._id, seatNumber: 'A1' });
      expect(seat.status).toBe(SEAT_STATUS.AVAILABLE);
    });

    it('rejects booking confirmation when accessed by non-owner user', async () => {
      const booking = await Booking.create({
        bookingReference: `IMV-OWN-${Date.now().toString(36).toUpperCase()}`,
        user: customerUser._id,
        show: show._id,
        seats: [{ seatNumber: 'A2', category: 'SILVER', price: 200 }],
        totalAmount: 200,
        convenienceFee: 25,
        grandTotal: 225,
        status: BOOKING_STATUS.PENDING,
        paymentStatus: PAYMENT_STATUS.PENDING,
        holdToken: 'HOLD_OWN_TEST',
        expiresAt: new Date(Date.now() + 600000)
      });

      await ShowSeat.updateOne(
        { show: show._id, seatNumber: 'A2' },
        {
          status: SEAT_STATUS.HELD,
          heldBy: customerUser._id,
          heldUntil: new Date(Date.now() + 600000),
          holdToken: 'HOLD_OWN_TEST'
        }
      );

      // Attacker tries to confirm customer's booking
      const res = await request(app)
        .post('/api/v1/bookings/confirm')
        .set('Authorization', `Bearer ${attackerToken}`)
        .send({
          bookingId: booking._id.toString(),
          orderId: 'SIM_ORD_ATTACK',
          paymentId: 'SIM_PAY_ATTACK',
          method: 'card',
          amount: 225
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Unauthorized booking confirmation attempt');
    });

    it('rejects confirmation when payment amount does not match booking grandTotal', async () => {
      const booking = await Booking.findOne({ holdToken: 'HOLD_OWN_TEST' });

      const res = await request(app)
        .post('/api/v1/bookings/confirm')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id.toString(),
          orderId: 'SIM_ORD_MISMATCH',
          paymentId: 'SIM_PAY_MISMATCH',
          method: 'card',
          amount: 10 // Tampered amount
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Payment amount mismatch');
    });

    it('enforces idempotency and rejects duplicate payment ID reuse across different bookings', async () => {
      // Create a confirmed payment
      const usedPaymentId = `SIM_PAY_IDEMPOTENT_${Date.now()}`;
      await Payment.create({
        booking: show._id, // placeholder id
        user: customerUser._id,
        amount: 225,
        providerPaymentId: usedPaymentId,
        status: PAYMENT_STATUS.SUCCESS
      });

      const booking = await Booking.findOne({ holdToken: 'HOLD_OWN_TEST' });

      // Attempting to reuse the exact same paymentId on a new booking is rejected
      const res = await request(app)
        .post('/api/v1/bookings/confirm')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id.toString(),
          orderId: 'SIM_ORD_REUSED',
          paymentId: usedPaymentId,
          method: 'card',
          amount: 225
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already been utilized');
    });

    it('handles double confirm idempotently when called twice for the same booking and payment', async () => {
      const booking = await Booking.create({
        bookingReference: `IMV-DBL-${Date.now().toString(36).toUpperCase()}`,
        user: customerUser._id,
        show: show._id,
        seats: [{ seatNumber: 'A1', category: 'SILVER', price: 200 }],
        totalAmount: 200,
        convenienceFee: 25,
        grandTotal: 225,
        status: BOOKING_STATUS.PENDING,
        paymentStatus: PAYMENT_STATUS.PENDING,
        holdToken: 'HOLD_DBL_TEST',
        expiresAt: new Date(Date.now() + 600000)
      });

      await ShowSeat.updateOne(
        { show: show._id, seatNumber: 'A1' },
        {
          status: SEAT_STATUS.HELD,
          heldBy: customerUser._id,
          heldUntil: new Date(Date.now() + 600000),
          holdToken: 'HOLD_DBL_TEST'
        }
      );

      const paymentId = `SIM_PAY_DBL_${Date.now()}`;

      // First confirmation
      const res1 = await request(app)
        .post('/api/v1/bookings/confirm')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id.toString(),
          orderId: 'SIM_ORD_DBL',
          paymentId,
          method: 'card',
          amount: 225
        });

      expect(res1.status).toBe(200);
      expect(res1.body.data.status).toBe(BOOKING_STATUS.CONFIRMED);

      // Second confirmation (double confirm with identical bookingId and payment)
      const res2 = await request(app)
        .post('/api/v1/bookings/confirm')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id.toString(),
          orderId: 'SIM_ORD_DBL',
          paymentId,
          method: 'card',
          amount: 225
        });

      expect(res2.status).toBe(200);
      expect(res2.body.data.status).toBe(BOOKING_STATUS.CONFIRMED);
    });
  });

  describe('2. Payment Webhook Raw-Body Signature & Replay Protection', () => {
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || 'imovies_webhook_secret_key_2026';

    it('rejects webhooks with missing signature header', async () => {
      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .send({ event: 'payment.captured' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Missing webhook signature');
    });

    it('rejects webhooks with invalid HMAC signature', async () => {
      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-webhook-signature', 'deadbeefcafebabe0123456789abcdef0123456789abcdef0123456789abcdef')
        .set('x-webhook-timestamp', String(Date.now()))
        .send({ event: 'payment.captured' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid webhook signature');
    });

    it('rejects replayed webhooks with expired timestamps (>300 seconds)', async () => {
      const payload = JSON.stringify({ event: 'payment.captured', id: 'evt_old_1' });
      const signature = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
      const expiredTimestamp = String(Date.now() - 400 * 1000); // 400s in the past

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-webhook-signature', signature)
        .set('x-webhook-timestamp', expiredTimestamp)
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('replay protection');
    });

    it('accepts valid signed webhooks with fresh timestamps and processes idempotently', async () => {
      const eventId = `evt_valid_${Date.now()}`;
      const payload = JSON.stringify({ event: 'payment.authorized', id: eventId });
      const signature = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
      const freshTimestamp = String(Date.now());

      const res1 = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-webhook-signature', signature)
        .set('x-webhook-timestamp', freshTimestamp)
        .set('x-webhook-id', eventId)
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);

      // Replay of same eventId is handled idempotently
      const res2 = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-webhook-signature', signature)
        .set('x-webhook-timestamp', freshTimestamp)
        .set('x-webhook-id', eventId)
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res2.status).toBe(200);
      expect(res2.body.data.duplicate).toBe(true);
    });
  });

  describe('3. Request Body Limit (100kb)', () => {
    it('rejects oversized JSON payload (>100kb) with 413 Payload Too Large', async () => {
      const hugeData = 'x'.repeat(110 * 1024); // 110 KB
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', data: hugeData });

      expect(res.status).toBe(413);
    });
  });

  describe('4. Media URL Restrictions & Upload Hardening', () => {
    it('rejects movie creation with non-YouTube trailer URL', async () => {
      const res = await request(app)
        .post('/api/v1/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Malicious Trailer Movie',
          synopsis: 'Test',
          duration: 100,
          releaseDate: '2026-05-01',
          posterUrl: 'https://image.tmdb.org/t/p/w500/test.jpg',
          trailerUrl: 'https://vimeo.com/12345678' // Disallowed host
        });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'trailerUrl')).toBe(true);
    });

    it('rejects movie creation with untrusted poster host URL', async () => {
      const res = await request(app)
        .post('/api/v1/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Malicious Poster Movie',
          synopsis: 'Test',
          duration: 100,
          releaseDate: '2026-05-01',
          posterUrl: 'http://insecure-http-host.com/image.jpg' // Insecure HTTP & untrusted domain
        });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'posterUrl')).toBe(true);
    });

    it('rejects SVG file uploads with security error', async () => {
      const res = await request(app)
        .post('/api/v1/movies/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'exploit.svg');

      expect(res.status).toBe(500); // Multer fileFilter error triggers error handler
      expect(res.text || res.body.message).toContain('SVG');
    });
  });

  describe('5. Regex Escaping in Movie Search', () => {
    it('safely handles special regex characters without throwing ReDoS or regex errors', async () => {
      const specialQuery = '.*+?^${}()|[]\\';
      const res = await request(app)
        .get(`/api/v1/movies?search=${encodeURIComponent(specialQuery)}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('6. Authorization, IDOR, Mass Assignment, NoSQL Injection & Timing Tests', () => {
    it('rejects booking lookup attempt by non-owner attacker (IDOR protection on GET /api/v1/bookings/:id)', async () => {
      const booking = await Booking.create({
        bookingReference: `IMV-IDOR-${Date.now().toString(36).toUpperCase()}`,
        user: customerUser._id,
        show: show._id,
        seats: [{ seatNumber: 'A2', category: 'SILVER', price: 200 }],
        totalAmount: 200,
        convenienceFee: 25,
        grandTotal: 225,
        status: BOOKING_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.SUCCESS
      });

      const res = await request(app)
        .get(`/api/v1/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${attackerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    it('blocks regular authenticated user from accessing admin routes (GET /api/v1/admin/analytics)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    it('prevents privilege escalation and protected field modification (role, isEmailVerified, accountStatus, tokenVersion) via profile update', async () => {
      const targetUser = await User.create({
        name: 'Mass Assign Target',
        email: `mass_${Date.now()}@test.com`,
        passwordHash: 'dummy_hash',
        role: 'user',
        isEmailVerified: true,
        accountStatus: 'active',
        tokenVersion: 0
      });
      const token = generateAccessToken(targetUser);

      const res = await request(app)
        .patch('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          role: 'admin',
          isEmailVerified: false,
          accountStatus: 'suspended',
          tokenVersion: 999
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Updated Name');
      expect(res.body.data.user.role).toBe('user');

      const reloadedUser = await User.findById(targetUser._id);
      expect(reloadedUser.role).toBe('user');
      expect(reloadedUser.isEmailVerified).toBe(true);
      expect(reloadedUser.accountStatus).toBe('active');
      expect(reloadedUser.tokenVersion).toBe(0);

      await User.deleteOne({ _id: targetUser._id });
    });

    it('sanitizes NoSQL operator injection payloads without authentication bypass or unhandled crash', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: { $gt: '' },
          password: 'Password123!'
        });

      expect([400, 401]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('performs constant-time dummy bcrypt verification for unknown emails during login', async () => {
      const t0 = Date.now();
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent_user_for_timing@test.com', password: 'WrongPassword123!' });
      const elapsedUnknown = Date.now() - t0;

      // Both unknown user and invalid password run bcrypt comparison with cost 12
      expect(elapsedUnknown).toBeGreaterThan(15);
    });
  });
});

