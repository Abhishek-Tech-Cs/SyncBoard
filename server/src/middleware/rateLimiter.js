import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../config/redis.js';
import { ENV } from '../config/env.js';

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests, please try again later.',
  prefix = 'rl:',
  skipSuccessfulRequests = false,
} = {}) => {
  // In test mode or local development, don't block developer testing
  const isDevOrTest = ENV.NODE_ENV === 'test' || ENV.NODE_ENV === 'development';

  const options = {
    windowMs,
    max: isDevOrTest ? Math.max(max * 10, 2000) : max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip: (req) => {
      // Never rate-limit localhost in development
      if (isDevOrTest) {
        const ip = req.ip || req.connection?.remoteAddress || '';
        if (ip.includes('127.0.0.1') || ip === '::1' || ip.includes('localhost')) {
          return true;
        }
      }
      return false;
    },
  };

  try {
    const redis = getRedisClient();
    if (redis && typeof redis.call === 'function') {
      options.store = new RedisStore({
        // @ts-ignore
        sendCommand: async (...args) => {
          try {
            return await redis.call(...args);
          } catch (err) {
            console.warn(`[RateLimiter] Redis command warning (${err.message}). Bypassing.`);
            return null;
          }
        },
        prefix,
      });
    }
  } catch (err) {
    console.warn('[RateLimiter] Using default in-memory rate limiter store:', err.message);
  }

  return rateLimit(options);
};

export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many API requests, please slow down.',
  prefix: 'rl:api:',
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many authentication attempts, please try again later.',
  prefix: 'rl:auth:',
  skipSuccessfulRequests: true, // Successful logins never count against the rate limit
});
