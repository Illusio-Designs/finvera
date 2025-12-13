require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');
const redisClient = require('./src/config/redis');
const logger = require('./src/utils/logger');
const { syncDatabase } = require('./src/utils/dbSync');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Test database connection
async function startServer() {
  try {
    // Sync database (migrations with alter: true and seeders)
    await syncDatabase();

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📍 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await sequelize.close();
  if (redisClient && redisClient.isConnected()) {
    await redisClient.quit();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await sequelize.close();
  if (redisClient && redisClient.isConnected()) {
    await redisClient.quit();
  }
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the server
startServer();
