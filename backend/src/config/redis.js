require('dotenv').config();
const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connection established');
  } catch (err) {
    logger.error('Redis connection failed:', err);
  }
})();

module.exports = redisClient;
