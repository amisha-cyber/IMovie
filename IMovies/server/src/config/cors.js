import { env, isProduction } from './environment.js';

export const getAllowedOrigins = () => {
  const defaults = isProduction()
    ? []
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ];

  const configured = [
    ...(env.CLIENT_URL || '').split(','),
    ...(process.env.CORS_ORIGINS || '').split(',')
  ]
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  return Array.from(new Set([...defaults, ...configured]));
};

export const isOriginAllowed = (origin) => {
  // Allow requests with no origin (e.g. mobile apps, curl, server health checks)
  if (!origin) return true;

  const normalizedOrigin = origin.trim().replace(/\/$/, '');
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(normalizedOrigin);
};

export const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-IMovies-Client']
};

