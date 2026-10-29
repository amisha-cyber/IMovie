# IMovies — REST API Specification (`/api/v1`)

All endpoints are prefixed with `/api/v1`. All requests with a body must include `Content-Type: application/json`. Protected endpoints require an `Authorization: Bearer <token>` header or a valid `token` cookie.

---

## 1. Authentication (`/api/v1/auth`)

### 1.1 Register
- **Endpoint**: `POST /auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password@123",
    "confirmPassword": "Password@123",
    "phone": "+919876543210"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Registration successful! A verification email has been sent to your email address.",
    "data": {
      "user": {
        "_id": "67161b9e5f4d1c9e4c000001",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "user",
        "isEmailVerified": false
      },
      "email": "jane@example.com",
      "requiresVerification": true
    }
  }
  ```

### 1.2 Verify Email
- **Endpoint**: `POST /auth/verify-email`
- **Access**: Public
- **Request Body (Option A - Verification Token Link)**:
  ```json
  {
    "token": "e02777d2da6cbc06f9a8704e5480ebc44d3990a0a09d82918fe6e366924ed91b"
  }
  ```
- **Request Body (Option B - 6-Digit OTP Code)**:
  ```json
  {
    "email": "jane@example.com",
    "otp": "327637"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Your email address has been verified successfully! You can now log in.",
    "data": {
      "user": {
        "_id": "67161b9e5f4d1c9e4c000001",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "isEmailVerified": true,
        "emailVerifiedAt": "2026-10-21T10:45:33.093Z"
      }
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `TOKEN_EXPIRED`, `OTP_EXPIRED`, `INVALID_TOKEN`, or `INVALID_OTP` (returns `attemptsRemaining`)
  - `429 Too Many Requests`: `TOO_MANY_ATTEMPTS` (after 5 failed OTP attempts)

### 1.3 Resend Verification Email
- **Endpoint**: `POST /auth/resend-verification`
- **Access**: Public (Subject to 60-second cooldown and IP rate limiting)
- **Request Body**:
  ```json
  {
    "email": "jane@example.com"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "A new verification email has been sent to your email address."
  }
  ```
- **Error Responses**:
  - `429 Too Many Requests` (`COOLDOWN_ACTIVE`): Returns `retryAfter` seconds remaining before another request can be initiated.
  - `400 Bad Request` (`ALREADY_VERIFIED`): Account is already verified.

### 1.4 Login
- **Endpoint**: `POST /auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password@123"
  }
  ```
- **Response (200 OK - Verified User)**:
  ```json
  {
    "success": true,
    "message": "Welcome back! Login successful.",
    "data": {
      "user": {
        "_id": "67161b9e5f4d1c9e4c000001",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "isEmailVerified": true
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    }
  }
  ```
- **Response (403 Forbidden - Unverified User)**:
  ```json
  {
    "success": false,
    "code": "EMAIL_NOT_VERIFIED",
    "email": "jane@example.com",
    "message": "Your email address is not verified. Please verify your email before logging in."
  }
  ```

### 1.5 Current User Profile
- **Endpoint**: `GET /auth/me`
- **Access**: Authenticated

### 1.4 Update Profile
- **Endpoint**: `PATCH /auth/profile`
- **Access**: Authenticated
- **Request Body**: `{ "name": "Jane Updated", "phone": "+919988776655" }`

### 1.5 Logout
- **Endpoint**: `POST /auth/logout`
- **Access**: Authenticated

---

## 2. Movies (`/api/v1/movies`)

### 2.1 Get Movies
- **Endpoint**: `GET /movies`
- **Access**: Public
- **Query Parameters**:
  - `status`: `now_showing` | `coming_soon` | `all`
  - `genre`: e.g. `Action`, `Sci-Fi`
  - `language`: e.g. `English`, `Hindi`
  - `search`: Keyword string
  - `sort`: `-releaseDate` | `-rating` | `title` | `duration`
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 12)

### 2.2 Get Movie by ID or Slug
- **Endpoint**: `GET /movies/:id`
- **Access**: Public

### 2.3 Create Movie
- **Endpoint**: `POST /movies`
- **Access**: Admin only

### 2.4 Update Movie
- **Endpoint**: `PATCH /movies/:id`
- **Access**: Admin only

### 2.5 Delete Movie
- **Endpoint**: `DELETE /movies/:id`
- **Access**: Admin only

### 2.6 Upload Media Image
- **Endpoint**: `POST /movies/upload`
- **Access**: Admin only
- **Content-Type**: `multipart/form-data` (`image` field)

---

## 3. Theatres & Screens (`/api/v1/theatres`, `/api/v1/screens`)

### 3.1 Get Theatres
- **Endpoint**: `GET /theatres`
- **Query**: `city`, `search`

### 3.2 Get Theatre by ID
- **Endpoint**: `GET /theatres/:id` (includes populated active screens)

### 3.3 Create Theatre
- **Endpoint**: `POST /theatres` (Admin only)

### 3.4 Create Screen in Theatre
- **Endpoint**: `POST /theatres/:theatreId/screens` (Admin only)
- Automatically provisions auditorium layout.

---

## 4. Shows (`/api/v1/shows`)

### 4.1 Get Shows
- **Endpoint**: `GET /shows`
- **Query**: `movieId`, `theatreId`, `city`, `date`, `status`

### 4.2 Schedule New Show
- **Endpoint**: `POST /shows`
- **Access**: Admin only
- **Validation**: Automatically validates that no other show overlaps on the same screen during the requested time window. Generates 60 authoritative `ShowSeat` inventory documents.

---

## 5. Seat Inventory (`/api/v1/shows/:showId/seats`)

### 5.1 Get Authoritative Seats
- **Endpoint**: `GET /shows/:showId/seats`
- **Access**: Public (authenticates optionally to highlight seats held by current user)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "show": {
        "id": "...",
        "movieTitle": "Interstellar: Beyond Time",
        "theatreName": "IMovies Grand IMAX",
        "screenType": "Dolby Atmos",
        "startTime": "2026-10-22T14:30:00.000Z"
      },
      "stats": { "total": 60, "available": 58, "held": 0, "booked": 2 },
      "seats": [
        {
          "seatNumber": "A1",
          "row": "A",
          "number": 1,
          "category": "SILVER",
          "price": 200,
          "status": "AVAILABLE",
          "isHeldByMe": false
        }
      ]
    }
  }
  ```

---

## 6. Bookings & Real-Time Holds (`/api/v1/bookings`)

### 6.1 Create Temporary Seat Hold
- **Endpoint**: `POST /bookings/hold`
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "showId": "67161b9e5f4d1c9e4c000020",
    "seats": ["C4", "C5"]
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Seats held temporarily! Please complete payment within the time limit.",
    "data": {
      "bookingId": "67161b9e5f4d1c9e4c000035",
      "bookingReference": "IMV-M3K9P-4X12",
      "holdToken": "HOLD_a8c2f10d94e1",
      "expiresAt": "2026-10-21T07:15:00.000Z",
      "seats": [
        { "seatNumber": "C4", "category": "GOLD", "price": 260 },
        { "seatNumber": "C5", "category": "GOLD", "price": 260 }
      ],
      "totalAmount": 520,
      "convenienceFee": 50,
      "grandTotal": 570
    }
  }
  ```
- **Conflict Response (409 Conflict)**:
  ```json
  {
    "success": false,
    "message": "The following seat(s) are no longer available: C4. Please choose different seats."
  }
  ```

### 6.2 Create Payment Order
- **Endpoint**: `POST /bookings/create-order`
- **Request Body**: `{ "bookingId": "..." }`

### 6.3 Confirm Booking & Verify Payment
- **Endpoint**: `POST /bookings/confirm`
- **Request Body**:
  ```json
  {
    "bookingId": "...",
    "orderId": "SIM_ORD_12345",
    "paymentId": "SIM_PAY_98765",
    "signature": "simulated_valid_signature",
    "method": "card"
  }
  ```

### 6.4 My Bookings History
- **Endpoint**: `GET /bookings/my`
- Returns all customer bookings sorted by date with populated show, movie, and theatre.

### 6.5 Cancel Booking
- **Endpoint**: `POST /bookings/:id/cancel`
- Enforces cancellation cutoff rules (at least 2 hours before showtime). Releases seats back to `AVAILABLE` and initiates refund.

---

## 7. Administration (`/api/v1/admin`)

- `GET /admin/analytics`: Real-time aggregated stats (revenue, confirmed bookings, active movies, users, cancellations, recent feed).
- `GET /admin/bookings`: Searchable, filterable audit of customer bookings.
- `GET /admin/users`: Searchable directory of registered users.
- `PATCH /admin/users/:id/status`: Toggle account suspension.
