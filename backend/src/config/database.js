// Load .env only if not in production (Railway sets env vars directly)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const dbName = process.env.DB_NAME || 'fintranzact_main';

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
    logger.info(`[INIT] Starting main database initialization for: ${dbName}`);
    
    // Connect without database name to create it
    let rootConnection;
    if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
      const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
      logger.info(`[INIT] Using connection string (${process.env.MYSQL_URL ? 'MYSQL_URL' : 'DATABASE_URL'}) for database creation`);
      // Use connection string but without database name
      const url = new URL(connectionUrl);
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
      logger.info(`[INIT] Attempting to connect to MySQL server...`);
      await rootConnection.authenticate();
      logger.info(`[INIT] ✓ Connected to MySQL server`);
    } else {
      const dbHost = process.env.DB_HOST || 'localhost';
      const dbUser = process.env.DB_USER || 'root';
      logger.info(`[INIT] Using individual DB variables: host=${dbHost}, user=${dbUser}`);
      rootConnection = new Sequelize('', dbUser, process.env.DB_PASSWORD || '', {
        host: dbHost,
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
      logger.info(`[INIT] Attempting to connect to MySQL server at ${dbHost}...`);
      await rootConnection.authenticate();
      logger.info(`[INIT] ✓ Connected to MySQL server`);
    }

    // Create main database if it doesn't exist
    logger.info(`[INIT] Creating database: ${dbName}`);
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    logger.info(`[INIT] ✓ Database ${dbName} ready`);
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
