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
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    logger.info('🔄 Initializing databases...');
    
    // 1. Initialize Master Database (for tenant metadata)
    logger.info('📦 Setting up master database for tenant metadata...');
    await initMasterDatabase();
    
    // Allow memory to be freed
    if (global.gc) {
      global.gc();
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 2. Initialize Main Database (for admin, salesman, distributor, etc.)
    logger.info('📦 Setting up main database for system models...');
    await initDatabase();
    
    // Allow memory to be freed
    if (global.gc) {
      global.gc();
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await syncDatabase();

    // Final garbage collection
    if (global.gc) {
      global.gc();
    }

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
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use. Please:`);
        logger.error(`   1. Stop the process using port ${PORT}`);
        logger.error(`   2. Or set a different PORT in your .env file`);
        logger.error(`   3. On Windows, find the process: netstat -ano | findstr :${PORT}`);
        logger.error(`   4. Then kill it: taskkill /PID <PID> /F`);
      } else {
        logger.error('❌ Server failed to start:', err);
      }
      process.exit(1);
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
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection:', err);
  
  // If it's a WebAssembly memory error, try to recover
  if (err.message && err.message.includes('WebAssembly') && err.message.includes('Out of memory')) {
    logger.error('⚠️  WebAssembly memory error detected. This may be due to:');
    logger.error('   1. Insufficient system memory');
    logger.error('   2. Too many concurrent operations');
    logger.error('   3. Memory fragmentation');
    logger.error('');
    logger.error('💡 Suggestions:');
    logger.error('   - Close other applications to free memory');
    logger.error('   - Restart your computer');
    logger.error('   - Check if MySQL is running and accessible');
    logger.error('   - Try running: NODE_OPTIONS="--max-old-space-size=4096" npm run dev');
  }
  
  // Give it a moment before exiting to allow logs to flush
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the server
startServer();
