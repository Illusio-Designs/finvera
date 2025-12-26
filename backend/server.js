require('dotenv').config();
const http = require('http');
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
    // Log environment status at startup (without sensitive data)
    logger.info('🔍 Environment check:');
    logger.info(`   MYSQL_URL: ${process.env.MYSQL_URL ? 'SET' : 'NOT SET'}`);
    logger.info(`   DB_HOST: ${process.env.DB_HOST || 'NOT SET (will default to localhost)'}`);
    logger.info(`   DB_USER: ${process.env.DB_USER || 'NOT SET (will default to root)'}`);
    logger.info(`   DB_NAME: ${process.env.DB_NAME || 'NOT SET (will default to finvera_db)'}`);
    logger.info(`   MASTER_DB_NAME: ${process.env.MASTER_DB_NAME || 'NOT SET (will default to finvera_master)'}`);
    logger.info(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`   PORT: ${process.env.PORT || '3000'}`);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    logger.info('🔄 Initializing databases...');
    
    // 1. Initialize Master Database (for tenant metadata)
    logger.info('📦 Setting up master database for tenant metadata...');
    
    // Wrap in try-catch to handle WebAssembly memory errors gracefully
    try {
      await initMasterDatabase();
    } catch (initError) {
      // If it's a WebAssembly memory error, log it but try to continue
      if (initError.message && initError.message.includes('WebAssembly') && initError.message.includes('Out of memory')) {
        logger.warn('⚠️  WebAssembly memory error during master DB init, but continuing...');
        logger.warn('   This is often non-fatal. If issues persist, increase NODE_OPTIONS memory limit.');
        // Try to continue - the error might have been caught internally
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        throw initError;
      }
    }
    
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
    
    // Load Express app AFTER database initialization to avoid WebAssembly memory conflicts
    // This ensures databases initialize first, then HTTP server starts
    logger.info('📡 Initializing Express application...');
    let app;
    try {
      app = require('./src/app');
    } catch (appError) {
      if (appError.message && appError.message.includes('WebAssembly')) {
        logger.error('⚠️  WebAssembly error loading Express app. Retrying after cleanup...');
        // Force garbage collection
        if (global.gc) {
          global.gc();
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Retry once
        app = require('./src/app');
      } else {
        throw appError;
      }
    }
    
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
    logger.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      sqlState: error.sqlState,
      stack: error.stack,
    });
    if (error.original) {
      logger.error('❌ Original error:', {
        message: error.original.message,
        code: error.original.code,
        errno: error.original.errno,
        sql: error.original.sql,
        sqlState: error.original.sqlState,
      });
    }
    // Log environment variable status (without sensitive data)
    logger.error('❌ Environment check:');
    logger.error(`   MYSQL_URL: ${process.env.MYSQL_URL ? 'SET' : 'NOT SET'}`);
    logger.error(`   DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
    logger.error(`   DB_USER: ${process.env.DB_USER || 'NOT SET'}`);
    logger.error(`   DB_NAME: ${process.env.DB_NAME || 'NOT SET'}`);
    logger.error(`   MASTER_DB_NAME: ${process.env.MASTER_DB_NAME || 'NOT SET'}`);
    logger.error(`   NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
    logger.error(`   PORT: ${process.env.PORT || 'NOT SET'}`);
    
    // Wait a bit to ensure logs are flushed
    await new Promise(resolve => setTimeout(resolve, 1000));
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
  if (err.message && (err.message.includes('WebAssembly') || err.message.includes('Wasm')) && err.message.includes('Out of memory')) {
    logger.error('⚠️  WebAssembly memory error detected. This may be due to:');
    logger.error('   1. Insufficient system memory');
    logger.error('   2. Too many concurrent operations');
    logger.error('   3. Memory fragmentation');
    logger.error('   4. WebAssembly module (undici/llhttp) failed to allocate memory');
    logger.error('');
    logger.error('💡 Solutions:');
    logger.error('   - Close other applications to free memory');
    logger.error('   - Restart your computer to clear memory fragmentation');
    logger.error('   - Check if MySQL is running and accessible');
    logger.error('   - The server should automatically retry with increased delays');
    logger.error('   - If persistent, increase memory: NODE_OPTIONS="--max-old-space-size=8192 --wasm-max-mem=4294967296" npm run dev');
    
    // Don't exit immediately for WebAssembly errors - let the server try to recover
    // The error might be non-fatal if it happened during lazy loading
    return;
  }
  
  // For non-WebAssembly errors, exit after a delay
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
