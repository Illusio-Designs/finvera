/**
 * Script to fix tenant database migration for existing databases
 * This script runs the tenant migration on existing tenant databases that might be missing tables
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Sequelize, Op } = require('sequelize');
const logger = require('../src/utils/logger');
const masterModels = require('../src/models/masterModels');

async function runTenantMigration(dbName) {
  try {
    logger.info(`🔧 Running tenant migration for database: ${dbName}`);
    
    // Create connection to the tenant database
    const tenantConnection = new Sequelize(dbName, process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });

    // Test connection
    await tenantConnection.authenticate();
    logger.info(`✓ Connected to database: ${dbName}`);

    // Run the tenant migration
    const migrationsPath = path.join(__dirname, '../src/migrations');
    const migrationFile = path.join(migrationsPath, '001-tenant-migration.js');
    
    const migration = require(migrationFile);
    const queryInterface = tenantConnection.getQueryInterface();
    
    if (migration.up && typeof migration.up === 'function') {
      await migration.up(queryInterface, Sequelize);
      logger.info(`✅ Migration completed for database: ${dbName}`);
    } else {
      logger.error(`❌ Migration file is invalid for database: ${dbName}`);
    }

    await tenantConnection.close();
    logger.info(`✓ Connection closed for database: ${dbName}`);
    
  } catch (error) {
    logger.error(`❌ Error running migration for database ${dbName}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    // Get all active companies with their database names
    const companies = await masterModels.Company.findAll({
      where: { 
        is_active: true,
        db_provisioned: true,
        db_name: { [Op.ne]: null }
      },
      attributes: ['id', 'company_name', 'db_name']
    });

    logger.info(`Found ${companies.length} companies with provisioned databases`);

    for (const company of companies) {
      logger.info(`\n🏢 Processing company: ${company.company_name} (DB: ${company.db_name})`);
      try {
        await runTenantMigration(company.db_name);
      } catch (error) {
        logger.error(`❌ Failed to migrate database for company ${company.company_name}:`, error.message);
        // Continue with other companies
      }
    }

    logger.info('\n✅ All tenant migrations completed');
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();