/**
 * Script to sync voucher_item warehouse fields for all tenant databases
 * Run this if voucher_items table is missing inventory_item_id or warehouse_id columns
 * Usage: node src/scripts/syncVoucherItemWarehouseFields.js
 */

const tenantConnectionManager = require('../config/tenantConnectionManager');
const tenantProvisioningService = require('../services/tenantProvisioningService');
const masterModels = require('../models/masterModels');
const logger = require('../utils/logger');
const { Sequelize } = require('sequelize');
const migration = require('../migrations/20251219-add-voucher-item-warehouse-fields');

async function syncVoucherItemWarehouseFields() {
  try {
    logger.info('🔄 Starting voucher_item warehouse fields sync for all companies...\n');

    // Get all companies from master database
    const companies = await masterModels.Company.findAll({
      where: { is_active: true, db_provisioned: true },
    });

    if (companies.length === 0) {
      logger.info('No provisioned companies found.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const company of companies) {
      try {
        logger.info(`📦 Syncing database: ${company.db_name} (${company.company_name})`);

        // Decrypt password if needed
        let dbPassword = company.db_password;
        if (dbPassword) {
          try {
            dbPassword = tenantProvisioningService.decryptPassword(dbPassword);
          } catch (e) {
            dbPassword = process.env.DB_PASSWORD;
          }
        } else {
          dbPassword = process.env.DB_PASSWORD;
        }

        const dbUser =
          process.env.USE_SEPARATE_DB_USERS === 'true' && company.db_user
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

        logger.info(`✅ Successfully synced: ${company.db_name}`);
        successCount++;
      } catch (error) {
        // Ignore "column already exists" errors
        if (error.message && (error.message.includes('Duplicate column') || error.message.includes('already exists'))) {
          logger.info(`ℹ️  Columns already exist in ${company.db_name}, skipping...`);
          successCount++;
        } else {
          logger.error(`❌ Failed to sync ${company.db_name}:`, error.message);
          errorCount++;
        }
      }
    }

    logger.info(`\n📊 Sync Summary:`);
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
