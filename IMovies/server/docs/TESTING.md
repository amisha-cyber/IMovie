# IMovies — Automated Testing Strategy & Execution Results

This document records the automated testing strategy, executed test suites, and actual verified test results for both the backend REST API and frontend React client.

---

## 1. Testing Frameworks & Setup

- **Backend**: `Vitest` with `Supertest` and embedded in-memory MongoDB runner (`mongodb-memory-server`) for zero-dependency isolated database execution.
- **Frontend**: `Vitest` with `@testing-library/react` and `jsdom`.

---

## 2. Test Execution Commands

```bash
# Run all test suites across server and client
npm test

# Run backend integration tests only
npm run test:server

# Run frontend tests only
npm run test:client
```

---

## 3. Backend Test Results (Verified)

### Suite 1: Authentication & Authorization (`server/tests/auth.test.js`)
- `✓ should register a new user successfully`
  - Validates password hashing, user record creation, JWT issuance, and removal of `passwordHash` from payload.
- `✓ should reject registration with duplicate email`
  - Returns `409 Conflict` when registering an existing email.
- `✓ should log in with valid credentials`
  - Validates bcrypt comparison and returns access token.
- `✓ should reject login with incorrect password`
  - Returns `401 Unauthorized` on credential mismatch.
- `✓ should reject unauthenticated request to /api/v1/auth/me`
  - Enforces `authenticate` middleware.

### Suite 2: Seat Reservation & Concurrency (`server/tests/seatReservation.test.js`)
- `✓ should fetch authoritative seats for the show`
  - Returns seat layout with tier prices and initial `AVAILABLE` status.
- `✓ should hold an available seat successfully`
  - Atomically locks seat `A1`, returns hold token, expiry, and authoritative grand total (ticket + fee).
- `✓ should reject a second user attempting to hold the same seat A1`
  - Returns `409 Conflict` with clear message that seat `A1` is no longer available.
- `✓ should handle race conditions with concurrent requests for seat A2`
  - Simulates simultaneous parallel reservation attempts (`Promise.all`) by two competing users for the same seat `A2`.
  - **Result Verified**: Exactly **1 request succeeds (`201 Created`)** and exactly **1 request fails (`409 Conflict`)**. Zero double-bookings possible!

**Backend Test Summary**:
- **Total Tests**: 9 passed
- **Status**: 100% Pass

---

## 4. Frontend Test Results (Verified)

### Suite 1: Booking Redux State (`client/src/test/bookingSlice.test.js`)
- `✓ should handle initial state`
- `✓ should toggle seat selection` (selecting and deselecting seats)
- `✓ should enforce maximum of 10 seats per booking order`
- `✓ should clear seat selection`
- `✓ should set and clear hold data`

### Suite 2: SeatLegend Component (`client/src/test/SeatLegend.test.jsx`)
- `✓ renders all seat states and tier prices` (Available, Selected, Reserved, Sold Out, Silver, Gold, Platinum)

### Suite 3: MovieCard Component (`client/src/test/MovieCard.test.jsx`)
- `✓ renders movie title, certification, duration, and book tickets button`

**Frontend Test Summary**:
- **Total Tests**: 7 passed
- **Status**: 100% Pass

---

## 5. Production Build Verification

- **Command**: `npm run build --prefix client`
- **Result**: `✓ built in 5.16s`
- **Output**:
  - `dist/index.html` (1.25 kB)
  - `dist/assets/index.css` (250 kB)
  - `dist/assets/index.js` (535 kB)
  - Zero build errors or unhandled modules.
