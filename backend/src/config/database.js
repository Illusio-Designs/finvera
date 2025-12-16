require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const dbName = process.env.DB_NAME || 'finvera_db';

const sequelize = new Sequelize(
  dbName,
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

/**
 * Initialize main database
 * Creates database if it doesn't exist
 */
async function initDatabase() {
  try {
    // Connect without database name to create it
    const rootConnection = new Sequelize('', process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
    });

    // Create main database if it doesn't exist
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await rootConnection.close();
    
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
