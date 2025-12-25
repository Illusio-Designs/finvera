/**
 * Script to sync voucher_item warehouse fields for all tenant databases
 * Run this if voucher_items table is missing inventory_item_id or warehouse_id columns
 * Usage: node src/scripts/syncVoucherItemWarehouseFields.js
 */

// Load environment variables - ensure .env is loaded from backend directory
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const tenantConnectionManager = require('../config/tenantConnectionManager');
const tenantProvisioningService = require('../services/tenantProvisioningService');
const masterSequelize = require('../config/masterDatabase');
const logger = require('../utils/logger');
const { Sequelize } = require('sequelize');
const migration = require('../migrations/20251219-add-voucher-item-warehouse-fields');

async function syncVoucherItemWarehouseFields() {
  try {
    logger.info('🔄 Starting voucher_item warehouse fields sync for all companies...\n');

    // Ensure master database connection is authenticated
    try {
      await masterSequelize.authenticate();
      logger.info('✅ Master database connection established');
    } catch (authError) {
      logger.error('❌ Failed to connect to master database.');
      logger.error('Please ensure your .env file has the correct database credentials:');
      logger.error('  - DB_USER (current: ' + (process.env.DB_USER || 'root') + ')');
      logger.error('  - DB_PASSWORD (currently ' + (process.env.DB_PASSWORD ? 'set' : 'NOT SET - this may be the problem') + ')');
      logger.error('  - DB_HOST (current: ' + (process.env.DB_HOST || 'localhost') + ')');
      logger.error('  - DB_PORT (current: ' + (process.env.DB_PORT || '3306') + ')');
      throw authError;
    }

    // Get all companies from master database using raw query (like runLedgerMigrationOnAllTenants.js)
    const companies = await masterSequelize.query(
      `SELECT id, company_name, db_name, db_host, db_port, db_user, db_password, db_provisioned 
       FROM companies 
       WHERE is_active = 1 AND db_provisioned = 1 AND db_name IS NOT NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!companies || companies.length === 0) {
      logger.info('ℹ️  No provisioned company databases found');
      return;
    }

    logger.info(`Found ${companies.length} company database(s) to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const company of companies) {
      try {
        logger.info(`\n📦 Migrating database: ${company.db_name} (${company.company_name})`);

        // For tenant databases, use environment password (all tenant DBs use same root credentials)
        // The stored password in company.db_password might be encrypted/outdated
        const dbPassword = process.env.DB_PASSWORD;
        const dbUser = process.env.USE_SEPARATE_DB_USERS === 'true' && company.db_user 
          ? company.db_user 
          : process.env.DB_USER;

        // Get connection using tenant connection manager
        const tenantSequelize = await tenantConnectionManager.getConnection({
          id: company.id,
          db_name: company.db_name,
          db_host: company.db_host,
          db_port: company.db_port,
          db_user: dbUser,
          db_password: dbPassword,
        });

        // Run the migration
        const queryInterface = tenantSequelize.getQueryInterface();
        await migration.up(queryInterface, Sequelize);

        logger.info(`✅ Successfully migrated: ${company.db_name}`);
        successCount++;

        // Don't close connection - it's cached by connection manager
      } catch (error) {
        // Ignore "column already exists" errors
        if (error.message && (error.message.includes('Duplicate column') || error.message.includes('already exists'))) {
          logger.info(`ℹ️  Columns already exist in ${company.db_name}, skipping...`);
          successCount++;
        } else {
          logger.error(`❌ Failed to migrate ${company.db_name}:`, error.message);
          errorCount++;
        }
      }
    }

    logger.info(`\n📊 Migration Summary:`);
    logger.info(`   ✅ Successful: ${successCount}`);
    logger.info(`   ❌ Failed: ${errorCount}`);
  } catch (error) {
    logger.error('Error syncing voucher_item warehouse fields:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncVoucherItemWarehouseFields()
    .then(() => {
      logger.info('\n✅ Sync completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = syncVoucherItemWarehouseFields;
