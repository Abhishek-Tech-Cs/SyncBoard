import { getRedisClient } from '../config/redis.js';

export const CacheService = {
  /**
   * Fetch cached data parsed as JSON, or null if miss
   */
  get: async (key) => {
    try {
      const redis = getRedisClient();
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.warn(`[CacheService] Failed to get cache for key ${key}:`, err.message);
    }
    return null;
  },

  /**
   * Set cache with TTL in seconds
   */
  set: async (key, data, ttlSeconds = 300) => {
    try {
      const redis = getRedisClient();
      await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    } catch (err) {
      console.warn(`[CacheService] Failed to set cache for key ${key}:`, err.message);
    }
  },

  /**
   * Delete single cache key
   */
  del: async (key) => {
    try {
      const redis = getRedisClient();
      await redis.del(key);
    } catch (err) {
      console.warn(`[CacheService] Failed to delete cache for key ${key}:`, err.message);
    }
  },

  /**
   * Invalidate all keys matching a prefix or pattern (e.g. `project:123:*`)
   */
  invalidatePattern: async (pattern) => {
    try {
      const redis = getRedisClient();
      const keys = await redis.keys(pattern);
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      console.warn(`[CacheService] Failed to invalidate pattern ${pattern}:`, err.message);
    }
  },
};

