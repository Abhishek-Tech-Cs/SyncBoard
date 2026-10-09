import http from 'http';
import app from './app.js';
import { ENV } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initRedis } from './config/redis.js';
import { initSocketServer } from './sockets/socketServer.js';

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initialize Redis client
    initRedis();

    // 3. Create HTTP Server
    const httpServer = http.createServer(app);

    // 4. Initialize Socket.io Server
    initSocketServer(httpServer);

    // 5. Start listening
    httpServer.listen(ENV.PORT, () => {
      console.log(`==================================================`);
      console.log(`  SyncBoard Server Running on Port: ${ENV.PORT}`);
      console.log(`  Environment: ${ENV.NODE_ENV}`);
      console.log(`  Client Origin: ${ENV.CLIENT_URL}`);
      console.log(`==================================================`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      httpServer.close(async () => {
        await disconnectDB();
        console.log('[Server] Database disconnected. Process exiting.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();

