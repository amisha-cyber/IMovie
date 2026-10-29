import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Movie } from '../src/models/Movie.js';
import { Theatre } from '../src/models/Theatre.js';
import { Screen } from '../src/models/Screen.js';
import { Show } from '../src/models/Show.js';
import { ShowSeat } from '../src/models/ShowSeat.js';
import { seatReservationService } from '../src/services/seatReservationService.js';
import { generateAccessToken } from '../src/utils/token.js';

describe('Seat Reservation & Concurrency Tests', () => {
  let user1, user2, token1, token2;
  let testShow, testMovie, testTheatre, testScreen;

  beforeAll(async () => {
    await connectDB();

    // Create 2 test users
    user1 = await User.create({
      name: 'User One',
      email: `user1_${Date.now()}@test.com`,
      passwordHash: 'dummyhash',
      role: 'user',
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    });
    token1 = generateAccessToken(user1);

    user2 = await User.create({
      name: 'User Two',
      email: `user2_${Date.now()}@test.com`,
      passwordHash: 'dummyhash',
      role: 'user',
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    });
    token2 = generateAccessToken(user2);

    // Create movie, theatre, screen, and future show
    testMovie = await Movie.create({
      title: 'Test Concurrency Cinema',
      slug: `test-concurrency-${Date.now()}`,
      synopsis: 'A test movie for seat concurrency',
      posterUrl: 'https://example.com/poster.jpg',
      genres: ['Action'],
      languages: ['English'],
      duration: 120,
      releaseDate: new Date()
    });

    testTheatre = await Theatre.create({
      name: 'Test Concurrency Theatre',
      slug: `theatre-concurrency-${Date.now()}`,
      address: '123 Cinema Way',
      city: 'Mumbai',
      state: 'Maharashtra'
    });

    testScreen = await Screen.create({
      theatre: testTheatre._id,
      name: 'Audi Concurrency',
      totalSeats: 20,
      seatingLayout: {
        rows: [
          {
            rowLetter: 'A',
            category: 'SILVER',
            priceMultiplier: 1.0,
            seats: [
              { seatNumber: 'A1', number: 1, isAisle: false },
              { seatNumber: 'A2', number: 2, isAisle: false },
              { seatNumber: 'A3', number: 3, isAisle: false },
              { seatNumber: 'A4', number: 4, isAisle: false }
            ]
          }
        ]
      }
    });

    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    testShow = await Show.create({
      movie: testMovie._id,
      theatre: testTheatre._id,
      screen: testScreen._id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 150 * 60 * 1000),
      basePrice: 200,
      seatPricing: { silver: 200, gold: 250, platinum: 350 },
      status: 'scheduled'
    });

    await seatReservationService.initializeShowSeats(testShow._id);
  });

  afterAll(async () => {
    if (testShow?._id) {
      await ShowSeat.deleteMany({ show: testShow._id });
      await Show.findByIdAndDelete(testShow._id);
    }
    if (testScreen?._id) {
      await Screen.findByIdAndDelete(testScreen._id);
    }
    if (testTheatre?._id) {
      await Theatre.findByIdAndDelete(testTheatre._id);
    }
    if (testMovie?._id) {
      await Movie.findByIdAndDelete(testMovie._id);
    }
    if (user1?._id) {
      await User.findByIdAndDelete(user1._id);
    }
    if (user2?._id) {
      await User.findByIdAndDelete(user2._id);
    }
    await disconnectDB();
  });

  it('should fetch authoritative seats for the show', async () => {
    const res = await request(app).get(`/api/v1/shows/${testShow._id}/seats`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.seats.length).toBe(4);
    expect(res.body.data.seats[0].status).toBe('AVAILABLE');
  });

  it('should hold an available seat successfully', async () => {
    const res = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        showId: testShow._id,
        seats: ['A1']
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.holdToken).toBeDefined();
    expect(res.body.data.grandTotal).toBe(225); // 200 + 25 fee
  });

  it('should reject a second user attempting to hold the same seat A1', async () => {
    const res = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        showId: testShow._id,
        seats: ['A1']
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('no longer available');
  });

  it('should handle race conditions with concurrent requests for seat A2', async () => {
    // Both user1 and user2 try to reserve seat A2 simultaneously
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/bookings/hold')
        .set('Authorization', `Bearer ${token1}`)
        .send({ showId: testShow._id, seats: ['A2'] }),
      request(app)
        .post('/api/v1/bookings/hold')
        .set('Authorization', `Bearer ${token2}`)
        .send({ showId: testShow._id, seats: ['A2'] })
    ]);

    // Exactly one must succeed (201) and one must be rejected (409)
    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);
  });
});
