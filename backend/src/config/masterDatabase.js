require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Master Database Connection
 * This database stores only tenant metadata and configuration
 * Each tenant's actual data is stored in their own separate database
 */
const masterSequelize = new Sequelize(
  process.env.MASTER_DB_NAME || 'finvera_master',
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

// Test connection
masterSequelize
  .authenticate()
  .then(() => {
    logger.info('Master database connection established successfully');
  })
  .catch((err) => {
    logger.error('Unable to connect to master database:', err);
  });

module.exports = masterSequelize;
