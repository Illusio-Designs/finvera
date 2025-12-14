require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Master Database Connection
 * Stores ONLY tenant metadata (tenant_master table)
 * Admin, salesman, distributor data stays in main database (finvera_db)
 * Auto-created on server startup
 */
const masterDbName = process.env.MASTER_DB_NAME || 'finvera_master';

const masterSequelize = new Sequelize(
  masterDbName,
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  },
);

/**
 * Initialize master database
 * Creates database if it doesn't exist
 */
async function initMasterDatabase() {
  try {
    // Connect without database name to create it
    const rootConnection = new Sequelize('', process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
    });

    // Create master database if it doesn't exist
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${masterDbName}\``);
    await rootConnection.close();
    
    logger.info(`Master database '${masterDbName}' ready`);

    // Test connection
    await masterSequelize.authenticate();
    logger.info('Master database connection established successfully');

    // Sync tenant_master table
    const TenantMaster = require('../models/TenantMaster');
    await TenantMaster.sync({ alter: false });
    logger.info('Tenant master table synchronized');

  } catch (err) {
    logger.error('Failed to initialize master database:', err);
    throw err;
  }
}

// Export both connection and init function
module.exports = masterSequelize;
module.exports.initMasterDatabase = initMasterDatabase;
