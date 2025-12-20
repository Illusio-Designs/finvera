require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const sequelize = require('./src/config/database');
const { initDatabase } = require('./src/config/database');
const masterSequelize = require('./src/config/masterDatabase');
const { initMasterDatabase } = require('./src/config/masterDatabase');
const redisClient = require('./src/config/redis');
const logger = require('./src/utils/logger');
const { syncDatabase } = require('./src/utils/dbSync');
const { initSocketServer } = require('./src/websocket/socketServer');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Test database connection
async function startServer() {
  try {
    logger.info('🔄 Initializing databases...');
    
    // 1. Initialize Master Database (for tenant metadata)
    logger.info('📦 Setting up master database for tenant metadata...');
    await initMasterDatabase();
    
    // 2. Initialize Main Database (for admin, salesman, distributor, etc.)
    logger.info('📦 Setting up main database for system models...');
    await initDatabase();
    await syncDatabase();

    logger.info('✅ All databases initialized successfully');
    
    // Create HTTP server
    const server = http.createServer(app);
    
    // Initialize Socket.IO server
    initSocketServer(server);
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
      logger.info(`📍 API: http://localhost:${PORT}/api`);
      logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
      logger.info(`📊 Databases:`);
      logger.info(`   - Main DB: ${process.env.DB_NAME || 'finvera_db'} (Admin, Salesman, Distributor, etc.)`);
      logger.info(`   - Master DB: ${process.env.MASTER_DB_NAME || 'finvera_master'} (Tenant metadata only)`);
      logger.info(`   - Tenant DBs: Created dynamically per tenant`);
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
  await masterSequelize.close();
  if (redisClient && redisClient.isConnected()) {
    await redisClient.quit();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await sequelize.close();
  await masterSequelize.close();
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
