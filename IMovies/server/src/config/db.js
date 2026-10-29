import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env, isProduction } from './environment.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mongodInstance = null;

export const connectDB = async (customUri = null) => {
  // 1. ISOLATED TEST MODE GUARD
  if (process.env.NODE_ENV === 'test') {
    let testUri = customUri || process.env.TEST_MONGODB_URI;

    // Check shared globalSetup URI file if env not set
    if (!testUri) {
      const uriFile = path.resolve(__dirname, '../../.test-mongo-uri');
      if (fs.existsSync(uriFile)) {
        testUri = fs.readFileSync(uriFile, 'utf-8').trim();
        process.env.TEST_MONGODB_URI = testUri;
      }
    }

    if (!testUri) {
      throw new Error('TEST ISOLATION ERROR: No in-memory TEST_MONGODB_URI provided in test mode.');
    }

    // Strict guard: Never connect to Atlas or remote mongodb+srv in test mode
    if (testUri.includes('mongodb+srv') || testUri.includes('mongodb.net')) {
      throw new Error('CRITICAL SECURITY GUARD: Test suite attempted to connect to MongoDB Atlas (mongodb+srv)! Aborting immediately.');
    }

    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    await mongoose.connect(testUri, {
      serverSelectionTimeoutMS: 2000
    });
    logger.info(`Test MongoDB connected to isolated memory instance at: ${testUri}`);
    return mongoose.connection;
  }

  // 2. STANDARD RUNTIME (Development & Production)
  const targetUri = customUri || env.MONGODB_URI;
  const isCloudHost = isProduction() || Boolean(process.env.RENDER);
  logger.info(`Connecting to MongoDB at: ${targetUri.replace(/:([^@]+)@/, ':****@')}`);

  try {
    // Use resilient timeout for remote MongoDB Atlas connections (15s in production, 5s in dev)
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: isCloudHost ? 15000 : 5000
    });
    logger.info('MongoDB connected successfully via URI.');
    return mongoose.connection;
  } catch (err) {
    logger.warn(`Could not connect to configured MongoDB URI (${err.message}).`);

    // In non-production and non-cloud environments, fall back to mongodb-memory-server
    if (!isCloudHost) {
      try {
        logger.info('Starting embedded MongoDB instance (mongodb-memory-server) for seamless local execution...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const memUri = mongodInstance.getUri();
        await mongoose.connect(memUri);
        logger.info(`Embedded MongoDB running & connected at: ${memUri}`);
        return mongoose.connection;
      } catch (memErr) {
        logger.error('Failed to initialize embedded MongoDB fallback:', memErr.message);
        throw err;
      }
    } else {
      logger.error('CRITICAL: Cannot connect to MongoDB in production/cloud environment. Please check your MONGODB_URI and Atlas IP Access List.');
      throw err;
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (process.env.NODE_ENV !== 'test' && mongodInstance) {
      await mongodInstance.stop();
      mongodInstance = null;
    }
    logger.info('MongoDB disconnected.');
  } catch (err) {
    logger.error('Error during MongoDB disconnect:', err.message);
  }
};
