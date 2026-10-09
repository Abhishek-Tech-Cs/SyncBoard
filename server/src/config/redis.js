import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import { ENV } from './env.js';

let redisClient = null;

export const initRedis = () => {
  if (redisClient) return redisClient;

  // In test environment, use RedisMock directly for instant zero-latency test reliability
  if (ENV.NODE_ENV === 'test') {
    redisClient = new RedisMock();
    return redisClient;
  }

  try {
    const isTls = ENV.REDIS_URL.startsWith('rediss://');

    const options = {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
      enableOfflineQueue: true,
      ...(isTls && { tls: { rejectUnauthorized: false } }),
    };

    const client = new Redis(ENV.REDIS_URL, options);

    client.on('connect', () => {
      console.log('[Redis] Connected to Redis server successfully');
    });

    client.on('ready', () => {
      console.log('[Redis] Redis client is ready to process commands');
    });

    client.on('error', (err) => {
      console.warn(`[Redis] Connection warning: ${err.message}`);
    });

    redisClient = client;
  } catch (err) {
    console.warn('[Redis] Failed to initialize real Redis. Using RedisMock fallback:', err.message);
    redisClient = new RedisMock();
  }

  return redisClient;
};

export const getRedisClient = () => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};
