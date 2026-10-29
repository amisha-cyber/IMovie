# Project Documentation

The app and npm workspace are in [IMovies/](IMovies/), with the client in IMovies/client/ and backend in IMovies/server/. Run project commands after changing into IMovies/. Technical guides and reports are in [IMovies/server/docs/](IMovies/server/docs/). See [Phase-wise Documentation](Phase-wise%20Documentation.md) for the development stages.

---

# IMovies — Full-Stack Cinema Management & Online Movie Ticket Booking Platform

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208.x-brightgreen.svg)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black.svg)](https://socket.io/)
[![Build Status](https://img.shields.io/badge/Build-Passing-success.svg)]()
[![Tests](https://img.shields.io/badge/Tests-34%20Passed%20(100%25)-success.svg)]()

**IMovies** is a full-stack cinema management and real-time movie ticket booking platform built with the MERN stack (MongoDB, Express.js, React.js with Vite, and Node.js). It offers real-time seat availability updates via WebSockets, atomic concurrency-controlled reservation holds, a development payment simulator, printable tickets with dynamic QR codes, and a comprehensive administration dashboard.

---

## 🌟 Features

### 🎬 Customer Discovery & Experience
- **Cinematic Visuals**: Dark obsidian theme with rich crimson accents, movie backdrops, and trailer modal previews.
- **Dynamic Search & Filtering**: Debounced search by title, director, or cast; filters by status (Now Showing / Coming Soon), genres, and languages; multiple sorting modes.
- **Theatre & Showtime Discovery**: Browse auditoriums (IMAX Laser, 4DX, Dolby Atmos) and multi-day showtimes across major metro cities.
- **Authoritative Real-Time Seat Selection**: Interactive curved auditorium layout with silver, gold, and platinum tiers, aisle gaps, and live seat locks.
- **Instant WebSocket Synchronization**: Real-time broadcast of seat holds, releases, and confirmations using show-scoped Socket.IO rooms.

### 🛡️ Booking Engine & Concurrency Protection
- **Atomic Seat Holds**: Server-authoritative locks prevent race conditions and double bookings through atomic conditional MongoDB operations.
- **Hold Expiry Countdown**: Visual countdown timer (8-minute hold window) with background job release and on-the-fly cleanup.
- **Server-Authoritative Pricing**: Ticket pricing and convenience fees are computed exclusively on the server.
- **Payment Sandbox / Simulator**: Out-of-the-box interactive payment simulator supporting Card, UPI, and NetBanking with simulated decline tests, plus Razorpay and Stripe compatibility.
- **Printable E-Tickets with QR Code**: Base64 verification QR code with clean printable stylesheet.
- **Cancellations & Refunds**: Cancellation cutoff policy (up to 2 hours prior to showtime) with automatic seat inventory release and refund tracking.

### 👑 Administration Dashboard
- **Database-Derived Analytics**: Real metrics for total revenue (verified payments only), confirmed bookings, active movies, upcoming shows, and registered users.
- **Full Movie CRUD**: Create, edit, and delete movies with poster URLs and metadata.
- **Theatre & Screen Layout Configuration**: Customize seating layouts, rows, and screen amenities.
- **Show Scheduling with Overlap Prevention**: Intelligent scheduler that blocks conflicting shows on the same screen during the same time window.
- **Audit & Cancellation Override**: Search customer bookings and perform administrative refunds.
- **User Management**: View user accounts and toggle suspensions.

---

## 💻 Technology Stack

- **Frontend**: React 18, Vite, React Router v6, Redux Toolkit, Axios, Bootstrap 5, Lucide React, React Toastify, Socket.IO client, Canvas-Confetti.
- **Backend**: Node.js 22 LTS, Express.js, MongoDB / Mongoose 8, Socket.IO, JSON Web Tokens (JWT), bcryptjs, Helmet, express-rate-limit, Multer, QRCode.
- **Testing**: Vitest, Supertest, React Testing Library, and MongoMemoryServer.

---

## 📋 Prerequisites

- **Node.js**: v20+ LTS (Tested on Node v22.19.0).
- **npm**: v10+.
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/imovies`) OR MongoDB Atlas connection string.  
  *(Note: If a local MongoDB daemon is not detected, the server automatically boots an embedded in-memory MongoDB runner so you can develop and evaluate immediately with zero setup hurdles!)*

---

## 🚀 Quick Start & Installation

### 1. Clone & Install Dependencies
```bash
cd IMovies
npm run install:all
```

### 2. Environment Configuration
Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env` inside `IMovies/`, then fill in your local values. Do not commit the resulting `.env` files.
- `server/.env`:
  ```env
  PORT=5000
  CLIENT_URL=http://localhost:5173
  MONGODB_URI=mongodb://127.0.0.1:27017/imovies
  JWT_ACCESS_SECRET=replace_with_a_long_random_secret
  PAYMENT_PROVIDER=simulated
  ADMIN_SEED_EMAIL=admin@imovies.com
  ADMIN_SEED_PASSWORD=choose_a_strong_password
  ```
- `client/.env`:
  ```env
  VITE_API_BASE_URL=http://localhost:5000/api/v1
  VITE_SOCKET_URL=http://localhost:5000
  ```

### 3. Seed Database with Realistic Cinema Data
```bash
npm run seed
```
This populates:
- 5 feature movies (Interstellar, Cyberpunk 2099, Shadows of the Realm, etc.)
- 3 flagship multiplexes across Mumbai, Delhi, and Bengaluru
- 6 auditoriums with 60-seat layouts (Rows A–F with Silver, Gold, Platinum pricing)
- 72 scheduled shows across today and subsequent days
- Initialized 4,320 seat inventory records
- Pre-configured demo accounts.

### 4. Create or Update Administrator
```bash
npm run seed:admin
```
- **Admin Email**: `admin@imovies.com`
- **Admin Password**: `Admin@123456`
- **Demo User Email**: `john@example.com`
- **Demo User Password**: `User@123456`

### 5. Launch the Application
```bash
# Concurrently start both backend (port 5000) and frontend (port 5173):
npm run dev
```

Visit **http://localhost:5173** in your browser!

---

## 🧪 Running Automated Tests

```bash
# Run all automated tests (backend + frontend)
npm test

# Run backend integration tests (Auth, Seat concurrency, Double-booking protection)
npm run test:server

# Run frontend tests (Redux slices, SeatLegend, MovieCard components)
npm run test:client

# Verify frontend production build
npm run build
```

---

## 📧 Email Verification System & SMTP Configuration

IMovies features an end-to-end, cryptographically secure **Email Verification System** during user registration.

### Verification Workflow
1. **User Sign Up**: User enters their Name, Email, Password, and Confirm Password. Passwords must match and have at least 6 characters.
2. **Account Creation**: The user account is created with `isEmailVerified: false`. No access tokens or session cookies are issued to unverified accounts.
3. **Dual Credential Generation**:
   - A 32-byte cryptographically secure random token (Node.js `crypto.randomBytes(32)`).
   - A 6-digit numeric OTP code (`crypto.randomInt(100000, 1000000)`).
   - Only **SHA-256 hashes** (`emailVerificationTokenHash` and `emailVerificationOtpHash`) are stored in MongoDB. Raw tokens and OTPs are never stored at rest.
4. **Branded Verification Email**: Nodemailer sends an email containing both a one-click verification button (`/verify-email?token=...`) and a highlighted 6-digit OTP code.
5. **Account Activation**:
   - Clicking the link auto-validates the token on the frontend `/verify-email` page.
   - Alternatively, entering the 6-digit OTP manually verifies the account.
   - Upon verification, `isEmailVerified: true` and `emailVerifiedAt: Date` are recorded, and token hashes are invalidated.
6. **Access Control**: Unverified users cannot log in (returns `403 Forbidden` with code `EMAIL_NOT_VERIFIED`) or hold cinema seats.

---

### SMTP Configuration & Gmail App Passwords

The email engine supports any standard SMTP provider (Gmail, SendGrid, Amazon SES, Mailgun, Postmark, or custom SMTP servers).

#### 1. Gmail SMTP Setup (Recommended for Development)
To use your Gmail account for sending verification emails:
1. Go to your [Google Account](https://myaccount.google.com/) -> **Security**.
2. Under "How you sign in to Google", ensure **2-Step Verification** is turned **ON**.
3. Search for or navigate to **App passwords** (`https://myaccount.google.com/apppasswords`).
4. Enter an App Name (e.g. `IMovies Cinema`) and click **Create**.
5. Copy the generated 16-character app password (e.g., `abcd efgh ijkl mnop`).
6. Update `server/.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_gmail@gmail.com
   SMTP_PASS=abcdefghijklmnop
   EMAIL_FROM="IMovies Cinema" <your_gmail@gmail.com>
   CLIENT_URL=http://localhost:5173
   EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=60
   ```

#### 2. Local Development Mock Transport (Zero Configuration)
If `SMTP_USER` and `SMTP_PASS` are left empty or omitted, IMovies automatically runs in **Development Mock Mode**:
- Verification emails are safely simulated without crashing or connecting to external servers.
- The 6-digit OTP and the direct verification link are logged clearly to the server terminal:
  ```
  📧 [DEV EMAIL MOCK] Verification Email for user@example.com
  🔑 6-Digit OTP: 810977
  🔗 Direct Verification Link: http://localhost:5173/verify-email?token=...
  ```
- You can copy-paste the link or the OTP directly into the browser to test the full flow!

#### 3. Important: SMTP Acceptance vs. Inbox Delivery
- When Nodemailer reports success (`250 OK`), it means the SMTP relay server **accepted** the message for delivery.
- If an email does not appear in your inbox:
  - Check the **Spam / Junk** folder.
  - In production, configure SPF (`v=spf1 include:... ~all`), DKIM, and DMARC DNS records for your domain to prevent mailbox providers from filtering transactional emails.

---

## 💳 Payment Sandbox & Simulator

IMovies includes an interactive payment simulator that accurately mimics the real-world checkout lifecycle without requiring real credit cards:
1. When selecting seats and clicking **Hold & Checkout**, the backend atomically reserves the seats and returns an order payload.
2. The **Payment Modal** presents Card, UPI, and NetBanking options.
3. Users can check the **Simulate decline** toggle to verify payment rejection handling.
4. On confirmation, the server verifies the payment and issues an e-ticket with a scannable QR code.

For production or sandbox Razorpay testing, set `PAYMENT_PROVIDER=razorpay` and supply `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `server/.env`.

---

## ⚡ WebSocket Event Overview

All real-time seat inventory events are scoped to individual shows via `show:${showId}`:
- `join-show`: Emitted by client upon opening a seat map; server responds with authoritative `seat-availability-updated`.
- `leave-show`: Emitted upon navigation away from the auditorium.
- `seat-hold-created`: Emitted to room when a user claims seats; turns seats to amber/held for all other viewers.
- `seat-hold-released`: Emitted when a hold expires or is cancelled; returns seats to green/available.
- `booking-confirmed`: Emitted upon verified payment; permanently marks seats as booked.

---

## 🌐 Production Deployment (Cloudflare Pages + Render + MongoDB Atlas)

Complete instructions for deploying the production build can be found in [Deployment Guide](IMovies/server/docs/DEPLOYMENT_GUIDE.md):
- **Frontend**: Cloudflare Pages connected to GitHub (`amisha-cyber/IMovie.git`) with automatic client-side SPA routing (`IMovies/client/public/_redirects`).
- **Backend**: Render Web Service (Node.js 22 LTS, Express, Socket.IO) using dynamic port binding and robust CORS origins.
- **Database**: Cloud-hosted MongoDB Atlas cluster with automatic reconnection resilience.

---

## 📁 Monorepo Structure

```
repository/
├── README.md                       # Project documentation
├── Phase-wise Documentation.md     # Development phases
└── IMovies/
    ├── client/                     # Frontend source and assets
    ├── server/                     # Backend source and tests
    │   ├── docs/                   # Reports and technical guides
    │   └── postman/                # API collection
    ├── package.json                # Workspace scripts
    ├── package-lock.json
    └── wrangler.jsonc              # Frontend deployment config
```

---

## 🤝 Troubleshooting

1. **Port in use (5000 or 5173)**: Change `PORT` in `server/.env` and update `VITE_API_BASE_URL` in `client/.env`.
2. **MongoDB not installed locally**: No problem! The server automatically falls back to an embedded in-memory MongoDB runner in development mode.
3. **Session Expired**: If credentials expire, click **Sign In** and use the quick demo credential buttons.


