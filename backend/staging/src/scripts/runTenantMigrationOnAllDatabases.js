/**
 * Script to run consolidated tenant migration on all existing tenant/company databases
 * This ensures all tenant databases have the latest schema
 * Run with: node src/scripts/runTenantMigrationOnAllDatabases.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const masterSequelize = require('../config/masterDatabase');
const tenantConnectionManager = require('../config/tenantConnectionManager');
const tenantProvisioningService = require('../services/tenantProvisioningService');
const logger = require('../utils/logger');
const path = require('path');

async function runMigrationOnAllTenants() {
  try {
    logger.info('🔄 Starting consolidated tenant migration on all databases...\n');

    // Ensure master database connection
    try {
      await masterSequelize.authenticate();
      logger.info('✅ Master database connection established');
    } catch (authError) {
      logger.error('❌ Failed to connect to master database:', authError.message);
      throw authError;
    }

    // Get all companies (each company has its own database)
    const companies = await masterSequelize.query(
      `SELECT id, company_name, db_name, db_host, db_port, db_user, db_password, db_provisioned 
       FROM companies 
       WHERE (db_provisioned = 1 OR db_name IS NOT NULL) AND is_active = 1 AND db_name IS NOT NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Also get tenant_master records (legacy tenants)
    let tenants = [];
    try {
      tenants = await masterSequelize.query(
        `SELECT id, tenant_name as company_name, db_name, db_host, db_port, db_user, db_password, db_provisioned 
         FROM tenant_master 
         WHERE (db_provisioned = 1 OR db_name IS NOT NULL) AND is_active = 1 AND db_name IS NOT NULL`,
        { type: Sequelize.QueryTypes.SELECT }
      );
    } catch (error) {
      logger.debug('tenant_master table not found or error querying it:', error.message);
    }

    const allDatabases = [...companies, ...tenants];

    if (!allDatabases || allDatabases.length === 0) {
      logger.info('ℹ️  No provisioned company/tenant databases found');
      logger.info('   Checking for databases directly...');
      
      // Try to find databases by pattern
      try {
        const [databases] = await masterSequelize.query(
          "SELECT SCHEMA_NAME as db_name FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME LIKE 'finvera_%' AND SCHEMA_NAME NOT LIKE '%master%' AND SCHEMA_NAME != 'finvera_db'"
        );
        
        if (databases && databases.length > 0) {
          logger.info(`Found ${databases.length} database(s) by pattern matching`);
          for (const db of databases) {
            logger.info(`  - ${db.db_name}`);
            // Create a minimal record for migration
            allDatabases.push({
              id: null,
              company_name: db.db_name.replace('finvera_', '').replace(/_/g, ' '),
              db_name: db.db_name,
              db_host: process.env.DB_HOST || 'localhost',
              db_port: parseInt(process.env.DB_PORT) || 3306,
              db_user: process.env.DB_USER,
              db_password: null,
              db_provisioned: true,
            });
          }
        }
      } catch (error) {
        logger.warn('Could not query database list:', error.message);
      }
    }

    if (!allDatabases || allDatabases.length === 0) {
      logger.info('ℹ️  No databases found to migrate');
      return;
    }

    logger.info(`Found ${allDatabases.length} database(s) to migrate\n`);

    // Load the consolidated migration
    const migrationsPath = path.join(__dirname, '../migrations');
    const migrationFile = path.join(migrationsPath, '001-tenant-migration.js');
    
    if (!require('fs').existsSync(migrationFile)) {
      logger.error('❌ Consolidated tenant migration file not found:', migrationFile);
      return;
    }

    const migration = require(migrationFile);
    if (!migration.up || typeof migration.up !== 'function') {
      logger.error('❌ Migration file does not export an up function');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const company of allDatabases) {
      try {
        logger.info(`📦 Migrating database: ${company.db_name} (${company.company_name})`);

        // For migrations, always use environment credentials (tenant DBs typically use same root password)
        // This avoids issues with encrypted passwords or separate user credentials
        const dbPassword = process.env.DB_PASSWORD;
        const dbUser = process.env.DB_USER || 'root';
        const dbHost = company.db_host || process.env.DB_HOST || 'localhost';
        const dbPort = company.db_port || parseInt(process.env.DB_PORT) || 3306;

        if (!dbPassword) {
          logger.error(`❌ DB_PASSWORD not set in environment variables`);
          errorCount++;
          continue;
        }

        // Create a direct connection for migration (don't use cached connection)
        // This ensures we use the correct credentials
        const tenantSequelize = new Sequelize(
          company.db_name,
          dbUser,
          dbPassword,
          {
            host: dbHost,
            port: dbPort,
            dialect: 'mysql',
            logging: false,
            pool: {
              max: 1,
              min: 0,
              acquire: 30000,
              idle: 10000,
            },
          }
        );

        // Test connection
        try {
          await tenantSequelize.authenticate();
          logger.info(`✅ Connected to ${company.db_name}`);
        } catch (authError) {
          logger.error(`❌ Failed to authenticate to ${company.db_name}:`, authError.message);
          await tenantSequelize.close();
          errorCount++;
          continue;
        }

        // Run the migration
        const queryInterface = tenantSequelize.getQueryInterface();
        const { Sequelize: SequelizeType } = require('sequelize');
        
        await migration.up(queryInterface, SequelizeType);

        logger.info(`✅ Successfully migrated: ${company.db_name}`);
        successCount++;

        // Close the connection after migration
        await tenantSequelize.close();
      } catch (error) {
        // Ignore "column already exists" errors
        if (error.message && (
          error.message.includes('Duplicate column') || 
          error.message.includes('already exists') ||
          error.message.includes('Duplicate key')
        )) {
          logger.info(`ℹ️  Migration already applied to ${company.db_name} (duplicate column/index)`);
          successCount++;
        } else {
          logger.error(`❌ Failed to migrate ${company.db_name}:`, error.message);
          if (error.sql) {
            logger.error(`   SQL: ${error.sql.substring(0, 200)}...`);
          }
          errorCount++;
        }
      }
    }

    logger.info(`\n📊 Migration Summary:`);
    logger.info(`   ✅ Successful: ${successCount}`);
    logger.info(`   ❌ Failed: ${errorCount}`);
    logger.info(`\n✅ Migration process completed!`);
  } catch (error) {
    logger.error('❌ Error running tenant migrations:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigrationOnAllTenants()
    .then(() => {
      logger.info('\n✅ All migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrationOnAllTenants };
