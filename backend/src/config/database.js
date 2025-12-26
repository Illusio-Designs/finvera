// Load .env only if not in production (Railway sets env vars directly)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const dbName = process.env.DB_NAME || 'finvera_db';

// Support Railway's MYSQL_URL connection string or individual variables
let sequelize;
if (process.env.MYSQL_URL) {
  // Use Railway's MYSQL_URL connection string (format: mysql://user:password@host:port/database)
  logger.info(`[DB CONFIG] Using MYSQL_URL connection string for main database`);
  // Parse URL and replace database name
  const url = new URL(process.env.MYSQL_URL);
  url.pathname = `/${dbName}`;
  sequelize = new Sequelize(url.toString(), {
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
      max: 3,
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 1000,
    },
    dialectOptions: {
      connectTimeout: 60000,
    },
  });
} else {
  // Fallback to individual variables
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || 3306;
  const dbUser = process.env.DB_USER || 'root';
  logger.info(`[DB CONFIG] Main DB Connection: host=${dbHost}, port=${dbPort}, user=${dbUser}, database=${dbName}`);
  if (!process.env.DB_HOST || dbHost === 'localhost') {
    logger.warn(`[DB CONFIG] ⚠️  DB_HOST is 'localhost'. This will fail on Railway.`);
    logger.warn(`[DB CONFIG] Please set MYSQL_URL=\${{MySQL.MYSQL_URL}} in Railway environment variables.`);
  }
  
  sequelize = new Sequelize(
    dbName,
    dbUser,
    process.env.DB_PASSWORD || '',
    {
      host: dbHost,
      port: parseInt(dbPort),
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
      pool: {
        max: 3,
        min: 0,
        acquire: 30000,
        idle: 10000,
        evict: 1000,
      },
      dialectOptions: {
        connectTimeout: 60000,
      },
    },
  );
}

/**
 * Initialize main database
 * Creates database if it doesn't exist
 */
async function initDatabase() {
  try {
    // Connect without database name to create it
    let rootConnection;
    if (process.env.MYSQL_URL) {
      // Use MYSQL_URL but without database name
      const url = new URL(process.env.MYSQL_URL);
      url.pathname = '/';
      rootConnection = new Sequelize(url.toString(), {
        dialect: 'mysql',
        logging: false,
        pool: {
          max: 1,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      });
    } else {
      rootConnection = new Sequelize('', process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
        pool: {
          max: 1,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      });
    }

    // Create main database if it doesn't exist
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await rootConnection.close();
    
    // Allow memory to be freed
    if (global.gc) {
      global.gc();
    }
    await new Promise(resolve => setTimeout(resolve, 50));
    
    logger.info(`Main database '${dbName}' ready`);

    // Test connection
    await sequelize.authenticate();
    logger.info('Main database connection established');

  } catch (err) {
    logger.error('Failed to initialize main database:', err);
    throw err;
  }
}

module.exports = sequelize;
module.exports.initDatabase = initDatabase;
