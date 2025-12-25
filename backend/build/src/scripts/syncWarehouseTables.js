/**
 * Script to sync warehouse tables for all tenant databases
 * Run this if warehouse tables are missing: node src/scripts/syncWarehouseTables.js
 */

const tenantConnectionManager = require('../config/tenantConnectionManager');
const tenantProvisioningService = require('../services/tenantProvisioningService');
const masterModels = require('../models/masterModels');
const logger = require('../utils/logger');

async function syncWarehouseTables() {
  try {
    logger.info('🔄 Starting warehouse tables sync for all companies...\n');

    // Get all companies from master database
    const companies = await masterModels.Company.findAll({
      where: { is_active: true },
    });

    if (companies.length === 0) {
      logger.info('No companies found.');
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

        // Load tenant models
        const tenantModels = require('../services/tenantModels')(tenantSequelize);

        // Sync with alter: true to create missing tables
        await tenantSequelize.sync({ alter: true });

        logger.info(`✅ Successfully synced: ${company.db_name}`);
        successCount++;
      } catch (error) {
        logger.error(`❌ Failed to sync ${company.db_name}:`, error.message);
        errorCount++;
      }
    }

    logger.info(`\n📊 Sync Summary:`);
    logger.info(`   ✅ Successful: ${successCount}`);
    logger.info(`   ❌ Failed: ${errorCount}`);
  } catch (error) {
    logger.error('Error syncing warehouse tables:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncWarehouseTables()
    .then(() => {
      logger.info('\n✅ Sync completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = syncWarehouseTables;
