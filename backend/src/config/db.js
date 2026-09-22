import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let memoryServer = null;

/**
 * Connects to MongoDB. In non-production environments, when no MONGODB_URI is
 * configured, an in-memory MongoDB is started so the project runs without any
 * local database installation. Production always requires a real URI.
 */
export async function connectDatabase() {
  let uri = env.mongodbUri;

  if (!uri) {
    if (env.isProduction) {
      throw new Error('MONGODB_URI is required in production');
    }
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('feedants');
    logger.warn({ uri }, 'MONGODB_URI not set - using in-memory MongoDB (data is not persisted)');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { autoIndex: !env.isProduction });
  logger.info('MongoDB connected');
  return { uri, isEphemeral: Boolean(memoryServer) };
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
