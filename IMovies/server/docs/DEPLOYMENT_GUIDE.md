# 🚀 IMovies — Production Deployment Guide

This guide details the step-by-step procedures to deploy the IMovies MERN cinema booking application using **Cloudflare Pages** for the React Vite frontend and **Render** (or any Node.js cloud platform) for the Express Socket.IO backend, connected to your **MongoDB Atlas** database.

---

## 🏗 System Architecture

```
┌─────────────────────────────────┐        REST / JSON API       ┌────────────────────────────────┐
│        Cloudflare Pages         ├──────────────────────────────►│         Render Service         │
│     (React 18 + Vite SPA)       │◄─────────────────────────────┤    (Express + Socket.IO)       │
│  https://<project>.pages.dev    │      Real-Time WebSocket     │  https://<backend>.onrender.com│
└────────────────┬────────────────┘                              └───────────────┬────────────────┘
                 │                                                               │
        _redirects SPA Rule                                             Mongoose / TLS (SRV)
      (/* -> /index.html 200)                                                    │
                                                                                 ▼
                                                                  ┌──────────────────────────────┐
                                                                  │      MongoDB Atlas Cloud     │
                                                                  │   (Multiplexes, Shows, Auth) │
                                                                  └──────────────────────────────┘
```

---

## 🔒 1. Git & Security Audit Results

1. **No Credentials Committed in History**:
   - The `IMoive!` project folder has never had tracked git files or committed secrets.
   - Local `.env` files are ignored by `.gitignore` across root, `client/`, and `server/`.
2. **Watertight `.gitignore`**:
   - Ignores `.env`, `.env.*`, `node_modules/`, `dist/`, build artifacts, and user uploads.
   - Only `.env.example` templates are tracked.
3. **If You Ever Expose a Secret**:
   - **MongoDB Atlas**: Go to Atlas Dashboard → *Database Access* → Edit User → change password immediately. Update backend environment variables.
   - **JWT Secrets**: Generate new random 64-character strings and update the backend environment variables (active tokens will expire and users re-login).
   - **SMTP App Passwords**: Revoke the app password in Google Account Security → App Passwords and generate a replacement.

---

## 💻 2. Push Project to GitHub

Because your project is located at `c:\Users\nayan\OneDrive\Desktop\WEB COURESE\4_th\IMoive!`, initialize Git directly inside this directory so only the IMovies project files are committed to `https://github.com/nayan2427/IMovie-SkillWallet.git`.

Open PowerShell or Terminal and run:

```powershell
# 1. Navigate into the IMoive! project directory
cd "c:\Users\nayan\OneDrive\Desktop\WEB COURESE\4_th\IMoive!"

# 2. Initialize Git repository
git init

# 3. Add the GitHub remote repository
git remote add origin https://github.com/nayan2427/IMovie-SkillWallet.git

# 4. Stage all project files (safe .gitignore prevents .env / node_modules from staging)
git add .

# 5. Verify staged files (ensure no .env files are in the list)
git status

# 6. Commit the project
git commit -m "feat: complete IMovies cinema booking platform with production configurations"

# 7. Set default branch to main and push
git branch -M main
git push -u origin main
```

---

## 🍃 3. MongoDB Atlas Configuration

Before deploying the backend, ensure MongoDB Atlas accepts connections from cloud hosts:

1. Log into [MongoDB Atlas](https://cloud.mongodb.com/).
2. In the left navigation, click **Network Access**.
3. Click **Add IP Address**:
   - Choose **Allow Access from Anywhere** (`0.0.0.0/0`).
   - *Reason*: Cloud platforms like Render allocate dynamic outbound IP addresses across their server pool.
4. Click **Confirm**.
5. Under **Database Access**, verify your database user exists with read/write permissions on the `imovies` database.
6. Note your connection string format:
   ```
   mongodb+srv://<USERNAME>:<PASSWORD>@imovie0.r5uptmc.mongodb.net/imovies?retryWrites=true&w=majority
   ```

---

## ⚙️ 4. Deploy Backend on Render

1. Log into [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `nayan2427/IMovie-SkillWallet`.
4. Configure service settings:
   - **Name**: `imovies-backend` (or your preferred name)
   - **Region**: Singapore / Frankfurt / Oregon (select closest to your users)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Instance Type**: Free (or Starter)
5. Under **Advanced** → **Environment Variables**, add the following keys:

| Key | Suggested Value | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations & secure errors |
| `PORT` | `10000` | (Render sets this automatically; server binds dynamically) |
| `CLIENT_URL` | `https://<your-project>.pages.dev` | Frontend origin for CORS & Socket.IO (update after Cloudflare step) |
| `MONGODB_URI` | `mongodb+srv://...` | Your Atlas connection string with credentials |
| `JWT_ACCESS_SECRET` | *(64-character random string)* | Signs authentication tokens |
| `JWT_ACCESS_EXPIRES_IN`| `7d` | Access token lifespan |
| `REFRESH_TOKEN_SECRET` | *(64-character random string)* | Refresh token encryption |
| `PAYMENT_PROVIDER` | `simulated` | `simulated` (or `razorpay` / `stripe`) |
| `PAYMENT_TEST_MODE` | `true` | Allows instant demo bookings |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP email server |
| `SMTP_PORT` | `587` | Standard TLS port |
| `SMTP_SECURE` | `false` | `false` for port 587 STARTTLS |
| `SMTP_USER` | `your_email@gmail.com` | Verified sending email |
| `SMTP_PASS` | `xxxx xxxx xxxx xxxx` | 16-character Google App Password |
| `EMAIL_FROM` | `IMovies Cinema <noreply@imovies.com>` | Sender header |
| `EMAIL_VERIFICATION_TOKEN_TTL_MINUTES` | `60` | OTP validity period |
| `ADMIN_SEED_NAME` | `Cinema SuperAdmin` | Initial administrator name |
| `ADMIN_SEED_EMAIL` | `admin@imovies.com` | Initial administrator email |
| `ADMIN_SEED_PASSWORD`| *(Your strong admin password)* | Administrator password |
| `ADMIN_SEED_PHONE` | `+919876543210` | Administrator contact |

6. Click **Create Web Service**.
7. Once deployed, test the health check endpoint:
   ```
   https://<your-backend-slug>.onrender.com/health
   ```
   Expected response: `{"status":"healthy", "service":"IMovies REST API", ...}`

---

## ⚡ 5. Deploy Frontend on Cloudflare Pages

1. Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the sidebar, select **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Select your repository: `nayan2427/IMovie-SkillWallet`.
4. Set up the build configuration:
   - **Project Name**: `imovies`
   - **Production Branch**: `main`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
5. Expand **Environment variables (advanced)** and add:

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://<your-backend-slug>.onrender.com` | Base backend server URL |
| `VITE_API_BASE_URL` | `https://<your-backend-slug>.onrender.com/api/v1` | Explicit versioned REST endpoint |
| `VITE_SOCKET_URL` | `https://<your-backend-slug>.onrender.com` | Live Socket.IO seat locking endpoint |
| `VITE_APP_NAME` | `IMovies` | Branding title |
| `VITE_CURRENCY_SYMBOL`| `₹` | Currency formatting |

6. Click **Save and Deploy**.
7. Cloudflare Pages will build the app and publish it to a domain like `https://imovies.pages.dev`.

> [!NOTE]
> **Single Page Application Routing**:
> The `client/public/_redirects` file (`/* /index.html 200`) is automatically copied to `dist/_redirects`. This ensures that refreshing deep paths (e.g. `/movies`, `/theatres`, `/book/:showId`, `/verify-email`) routes through React Router without 404 errors.

---

## 🔄 6. Complete Two-Way URL Loop

Once Cloudflare Pages creates your production frontend URL (e.g., `https://imovies-xyz.pages.dev`):

1. Go back to your **Render Dashboard** → **imovies-backend** → **Environment**.
2. Update `CLIENT_URL` with your Cloudflare domain:
   ```
   CLIENT_URL=https://imovies-xyz.pages.dev
   ```
   *(If you also want local development or custom domains, you can supply multiple comma-separated URLs: `https://imovies-xyz.pages.dev,http://localhost:5173`)*
3. Click **Save Changes** — Render will automatically re-deploy with updated CORS headers.

---

## 🧪 7. Post-Deployment Verification Checklist

- [ ] **Health Endpoint**: Navigate to `https://<backend>.onrender.com/health` to confirm the backend is up.
- [ ] **Database Connectivity**: Check Render service logs to confirm `MongoDB connected successfully via URI`.
- [ ] **Frontend Loading**: Open `https://<frontend>.pages.dev` to verify the Stitch-based Obsidian Cinema UI loads.
- [ ] **Client Routing**: Refresh `/movies` and `/theatres` directly in the browser to verify SPA routing works.
- [ ] **Authentication & Verification**:
  - Sign up with a new email.
  - Verify receiving the 6-digit OTP / verification link.
  - Verify the account and log in.
- [ ] **Seat Booking Flow**:
  - Select a movie and a showtime.
  - Select seats on the live seat map (Socket.IO locks seats in real-time).
  - Proceed with checkout (Simulated payment confirms instantly and generates the QR ticket).
