import mongoose from 'mongoose';
import { ENV } from './env.js';

let mongod = null;

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    
    // Attempt standard connection with a short timeout
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] MongoDB Connected successfully to: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[Database] Direct connection to ${ENV.MONGODB_URI} failed (${err.message}). Starting in-memory MongoDB fallback...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`[Database] Connected to In-Memory MongoDB Server at: ${uri}`);
    } catch (memErr) {
      console.error('[Database] Failed to initialize in-memory fallback MongoDB:', memErr.message);
      throw memErr;
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('[Database] MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB disconnected');
  });
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

