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
 * Creates database and syncs all master models (shared across tenants)
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
    logger.info('Master database connection established');

    // Sync all master models (shared accounting structure)
    const masterModels = require('../models/masterModels');
    await masterModels.syncMasterModels();
    
    logger.info('Master database models synchronized:');
    logger.info('  ✓ tenant_master (tenant metadata)');
    logger.info('  ✓ account_groups (shared chart of accounts)');
    logger.info('  ✓ voucher_types (shared voucher types)');
    logger.info('  ✓ gst_rates (shared GST rates)');
    logger.info('  ✓ tds_sections (shared TDS sections)');
    logger.info('  ✓ accounting_years (shared accounting periods)');

    // Seed default data if tables are empty
    await seedMasterData();

  } catch (err) {
    logger.error('Failed to initialize master database:', err);
    throw err;
  }
}

/**
 * Seed default master data if not exists
 */
async function seedMasterData() {
  const masterModels = require('../models/masterModels');
  
  try {
    // Seed default account groups
    const groupCount = await masterModels.AccountGroup.count();
    if (groupCount === 0) {
      logger.info('Seeding default account groups...');
      await require('../seeders/masterSeeds').seedAccountGroups();
    }

    // Seed default voucher types
    const voucherTypeCount = await masterModels.VoucherType.count();
    if (voucherTypeCount === 0) {
      logger.info('Seeding default voucher types...');
      await require('../seeders/masterSeeds').seedVoucherTypes();
    }

    // Seed default GST rates
    const gstRateCount = await masterModels.GSTRate.count();
    if (gstRateCount === 0) {
      logger.info('Seeding default GST rates...');
      await require('../seeders/masterSeeds').seedGSTRates();
    }

    // Seed default TDS sections
    const tdsCount = await masterModels.TDSSection.count();
    if (tdsCount === 0) {
      logger.info('Seeding default TDS sections...');
      await require('../seeders/masterSeeds').seedTDSSections();
    }

    logger.info('Master data seeding complete');
  } catch (error) {
    logger.warn('Error seeding master data:', error.message);
  }
}

// Export both connection and init function
module.exports = masterSequelize;
module.exports.initMasterDatabase = initMasterDatabase;
