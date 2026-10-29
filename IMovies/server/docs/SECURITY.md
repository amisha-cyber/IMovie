# IMovies — Security Architecture & Best Practices

This document outlines the security controls, validation mechanisms, and protective measures implemented across the IMovies platform.

---

## 1. Authentication & Session Security

- **Password Hashing**: Passwords are never stored in plaintext. They are salted and hashed using `bcryptjs` with 10 salt rounds prior to persistence.
- **JWT Protection**: Short-lived JSON Web Tokens are signed using HMAC-SHA256 with a cryptographically strong secret stored in environment variables.
- **HttpOnly Cookies**: In addition to Bearer tokens, authentication tokens are set via `HttpOnly`, `SameSite: Lax` (or `None` in production over HTTPS) cookies to prevent XSS-based theft.
- **Account Suspension Enforcement**: Suspended users are barred from both API authentication and WebSocket session participation immediately.

---

## 2. Email Verification & Activation Security

- **Cryptographic Randomness**:
  - Verification tokens are 32-byte (256-bit) cryptographically strong random hex values generated via Node.js `crypto.randomBytes(32)`.
  - Verification OTPs are 6-digit cryptographically uniform numbers generated via `crypto.randomInt(100000, 1000000)`.
- **Hashed Credentials At Rest**:
  - Raw tokens and OTPs are **never stored in the database** and **never logged in production**.
  - Only a one-way `SHA-256` digest (`hashVerificationValue`) is persisted in MongoDB (`emailVerificationTokenHash`, `emailVerificationOtpHash`).
- **Single-Use Tokens & Expiry**:
  - Verification tokens expire after a configurable TTL (`EMAIL_VERIFICATION_TOKEN_TTL_MINUTES`, default 60 minutes).
  - Tokens and OTP hashes are immediately cleared (`null`) upon successful verification to prevent replay attacks.
- **Attempt Limiting**:
  - OTP submissions are hard-capped at 5 attempts per issuance cycle (`emailVerificationAttempts >= 5`).
  - Once breached, the endpoint returns `429 Too Many Requests`, requiring a new verification code.
- **Resend Cooldown & Anti-Flooding**:
  - Re-requesting emails enforces a strict 60-second cooldown based on `emailVerificationLastSentAt`.
  - Rate limiting via `express-rate-limit` throttles IP-based abuse on verification and resend routes.
- **Access Gating**:
  - Unverified accounts cannot log in (returns `403 Forbidden` with `EMAIL_NOT_VERIFIED`).
  - No access tokens or cookies are generated on registration.
  - Protected seat-reservation and booking APIs verify `isEmailVerified: true` at the middleware level.

---

## 2. Authorization & Ownership Enforcements

- **Role-Based Access Control (RBAC)**: All administrative endpoints (`/admin/*`, `POST/PATCH/DELETE /movies`, `POST/PATCH/DELETE /theatres`, `POST /shows`) are protected by `authenticate` and `requireAdmin` middleware.
- **Ownership Verification**: Customer actions (retrieving bookings, viewing e-tickets, initiating cancellations) strictly enforce user ownership:
  ```javascript
  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return errorResponse(res, 'Access denied.', 403);
  }
  ```

---

## 3. Concurrency & Double-Booking Protection

- **Authoritative Server Pricing**: Prices are calculated strictly on the backend from `Show` and `Screen` tier configuration. Client-supplied amounts are rejected.
- **Atomic MongoDB Reservations**: Simultaneous requests for the same seat cannot succeed. The system executes atomic conditional updates:
  ```javascript
  const updateResult = await ShowSeat.updateMany(
    {
      show: showId,
      seatNumber: { $in: seatNumbers },
      $or: [
        { status: 'AVAILABLE' },
        { status: 'HELD', heldUntil: { $lt: now } }
      ]
    },
    { $set: { status: 'HELD', heldBy: user._id, heldUntil: expiresAt, holdToken } }
  );
  if (updateResult.modifiedCount !== seatNumbers.length) {
    // Automatic compensating rollback
    await ShowSeat.updateMany({ show: showId, holdToken }, { $set: { status: 'AVAILABLE' } });
    throw new Error('Conflict: Seats no longer available.');
  }
  ```
- **Unique Indexes**: Compound index `{ show: 1, seatNumber: 1 }` guarantees that duplicate seats cannot be created for any show.

---

## 4. Payment Security

- **Server-Side Verification**: Client claims of payment success are never trusted. Every transaction must be validated against the payment provider (HMAC-SHA256 signature verification for Razorpay or cryptographic simulator token).
- **No Card Storage**: Credit card numbers, CVVs, and sensitive banking credentials are never processed or retained on IMovies servers.
- **Idempotency**: Booking confirmation requests for already-confirmed transactions return the confirmed booking without duplicate billing.

---

## 5. Network, Rate Limiting & Input Validation

- **Rate Limiting**:
  - `authLimiter`: Max 30 attempts per 15 minutes per IP to mitigate brute-force attacks.
  - `apiLimiter`: Max 300 requests per 15 minutes per IP for general endpoints.
- **Helmet Headers**: Configures Content-Security-Policy, HSTS, X-Content-Type-Options, and Frameguard.
- **CORS Protection**: Restricted to explicit trusted origins (`CLIENT_URL`).
- **File Upload Protection**: Multer is restricted to image MIME types (`jpeg`, `jpg`, `png`, `webp`) with a 5MB size ceiling and randomized filenames to prevent directory traversal.
- **Safe Error Handling**: Stack traces are redacted in production environments.
