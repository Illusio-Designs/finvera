const redisClient = require('../config/redis');
const logger = require('./logger');

class CacheService {
  /**
   * Get cached value
   */
  async get(key) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.error('Cache get error:', err);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(key, value, ttlSeconds = 3600) {
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (err) {
      logger.error('Cache set error:', err);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (err) {
      logger.error('Cache delete error:', err);
      return false;
    }
  }

  /**
   * Get or set cached value
   */
  async getOrSet(key, fetchFn, ttlSeconds = 3600) {
    try {
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      const value = await fetchFn();
      await this.set(key, value, ttlSeconds);
      return value;
    } catch (err) {
      logger.error('Cache getOrSet error:', err);
      // Fallback to direct fetch
      return await fetchFn();
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return keys.length;
    } catch (err) {
      logger.error('Cache invalidate pattern error:', err);
      return 0;
    }
  }
}

module.exports = new CacheService();

