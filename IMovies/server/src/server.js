import http from 'http';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env, isProduction } from './config/environment.js';
import { initSocket } from './sockets/socketHandler.js';
import { startSeatExpiryJob, stopSeatExpiryJob } from './jobs/seatExpiryJob.js';
import { logger } from './utils/logger.js';
import { Theatre } from './models/Theatre.js';
import { seedDatabase } from './scripts/seed.js';

const httpServer = http.createServer(app);

// Initialize Socket.IO with CORS origins
initSocket(httpServer);

const startServer = async () => {
  // Bind port first so hosting platforms (Render, Railway, etc.) detect an active web service immediately
  httpServer.listen(env.PORT, () => {
    logger.info(`=================================================`);
    logger.info(`🎬 IMovies Server running at port ${env.PORT}`);
    logger.info(`⚡ Socket.IO listening on port ${env.PORT}`);
    logger.info(`💳 Payment Provider: ${env.PAYMENT_PROVIDER}`);
    logger.info(`🌐 Environment: ${env.NODE_ENV}`);
    logger.info(`=================================================`);
  });

  try {
    // Connect to database
    await connectDB();

    // Auto-seeding only allowed in non-production environments when empty
    if (!isProduction()) {
      const activeTheatreCount = await Theatre.countDocuments({ isActive: true });
      if (activeTheatreCount === 0) {
        logger.info('No active theatres detected in database. Auto-seeding verified Mumbai cinema inventory and initial catalog in dev mode...');
        await seedDatabase({ reset: false, closeConnection: false });
      }
    }

    // Start background job for releasing expired seat holds
    startSeatExpiryJob(15000);
  } catch (error) {
    logger.error('Failed to initialize database connection:', error.message);
    if (isProduction()) {
      logger.error('CRITICAL: Database connection failed in production. Halting server.');
      process.exit(1);
    }
    if (env.MONGODB_URI.includes('127.0.0.1') || env.MONGODB_URI.includes('localhost')) {
      logger.error('⚠️ NOTE: Server is running in cloud/Render mode but MONGODB_URI is set to localhost! Please add MONGODB_URI in your Render Dashboard -> Environment tab.');
    } else {
      logger.error('⚠️ Please ensure 0.0.0.0/0 is added in your MongoDB Atlas Network Access so Render can connect.');
    }
  }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  stopSeatExpiryJob();
  httpServer.close(async () => {
    logger.info('HTTP server closed.');
    await disconnectDB();
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
