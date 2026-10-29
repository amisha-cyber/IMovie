import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import apiRoutes from './routes/index.js';
import { env, isProduction } from './config/environment.js';
import { corsOptions } from './config/cors.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

import mongoSanitize from 'express-mongo-sanitize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust reverse proxy (e.g. Render / Cloudflare)
app.set('trust proxy', 1);

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS configuration
app.use(cors(corsOptions));

// Request parsing: 100kb limit and rawBody capture for webhook signature verification
app.use(
  express.json({
    limit: '100kb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// Express Mongo Sanitize to prevent NoSQL query injection ($ and . stripping)
app.use(mongoSanitize());

// HTTP request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(isProduction() ? 'combined' : 'dev'));
}

// Serve uploaded media with X-Content-Type-Options: nosniff header
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  },
  express.static(path.resolve(__dirname, '../uploads'))
);

// Health check endpoint
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: dbState === 1 ? 'healthy' : 'degraded',
    database: dbStates[dbState] || 'unknown',
    timestamp: new Date(),
    service: 'IMovies REST API',
    uptime: process.uptime()
  });
});

// General rate limiter for API routes
app.use('/api', apiLimiter);

// Mount versioned API routes
app.use('/api/v1', apiRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
