import { isProduction } from '../config/environment.js';

const formatTime = () => new Date().toISOString();

export const logger = {
  info: (msg, meta = '') => {
    console.log(`[${formatTime()}] [INFO] ${msg}`, meta ? meta : '');
  },
  warn: (msg, meta = '') => {
    console.warn(`[${formatTime()}] [WARN] ${msg}`, meta ? meta : '');
  },
  error: (msg, meta = '') => {
    console.error(`[${formatTime()}] [ERROR] ${msg}`, meta ? meta : '');
  },
  debug: (msg, meta = '') => {
    if (!isProduction() || process.env.LOG_LEVEL === 'debug') {
      console.log(`[${formatTime()}] [DEBUG] ${msg}`, meta ? meta : '');
    }
  }
};
