/**
 * Script to run ledger fields migration on all tenant databases
 * This adds missing columns to the ledgers table in each tenant database
 */

const { Sequelize } = require('sequelize');
const masterSequelize = require('../config/masterDatabase');
const tenantProvisioningService = require('../services/tenantProvisioningService');
const logger = require('../utils/logger');
const migration = require('../migrations/20251218-add-ledger-fields');

async function runMigrationOnAllTenants() {
  try {
    logger.info('🔄 Starting ledger fields migration on all tenant databases...');

    // Get all companies (each company has its own database)
    const companies = await masterSequelize.query(
      `SELECT id, company_name, db_name, db_host, db_port, db_user, db_password, db_provisioned 
       FROM companies 
       WHERE db_provisioned = 1 AND db_name IS NOT NULL`,
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

        // Use tenant connection manager to get the connection (handles auth properly)
        const tenantConnectionManager = require('../config/tenantConnectionManager');
        
        // Decrypt password if needed
        let dbPassword = company.db_password;
        if (dbPassword) {
          try {
            dbPassword = tenantProvisioningService.decryptPassword(dbPassword);
          } catch (e) {
            // If decryption fails, use environment password
            dbPassword = process.env.DB_PASSWORD;
          }
        } else {
          dbPassword = process.env.DB_PASSWORD;
        }

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

        // Load tenant models to ensure they're registered
        const tenantModels = require('../services/tenantModels')(tenantSequelize);

        // Use sync with alter to add missing columns automatically
        // This is safer and will add any missing columns based on model definition
        await tenantSequelize.sync({ alter: true });

        logger.info(`✅ Successfully migrated: ${company.db_name}`);
        successCount++;

        // Don't close connection - it's cached by connection manager
      } catch (error) {
        logger.error(`❌ Failed to migrate ${company.db_name}:`, error.message);
        errorCount++;
      }
    }

    logger.info(`\n📊 Migration Summary:`);
    logger.info(`   ✅ Successful: ${successCount}`);
    logger.info(`   ❌ Failed: ${errorCount}`);
    logger.info(`   📦 Total: ${companies.length}`);

    if (errorCount === 0) {
      logger.info('\n✅ All migrations completed successfully!');
    } else {
      logger.warn(`\n⚠️  ${errorCount} migration(s) failed. Please check the logs above.`);
    }
  } catch (error) {
    logger.error('❌ Error running migrations:', error);
    throw error;
  } finally {
    await masterSequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrationOnAllTenants()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrationOnAllTenants };







