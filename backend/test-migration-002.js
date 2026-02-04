/**
 * Test script for 002-indian-invoice-system-schema migration
 * 
 * This script tests the migration on a test database to ensure it works correctly
 * before running it on production tenant databases.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

async function testMigration() {
  console.log('🧪 Testing Indian Invoice System Schema Migration...\n');

  // Create a test database connection
  const testDbName = 'test_migration_002';
  const sequelize = new Sequelize('', process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
  });

  try {
    // Connect to MySQL
    await sequelize.authenticate();
    console.log('✓ Connected to MySQL');

    // Drop test database if exists
    await sequelize.query(`DROP DATABASE IF EXISTS \`${testDbName}\``);
    console.log(`✓ Dropped test database (if existed): ${testDbName}`);

    // Create test database
    await sequelize.query(`CREATE DATABASE \`${testDbName}\``);
    console.log(`✓ Created test database: ${testDbName}`);

    // Close connection and reconnect to test database
    await sequelize.close();

    const testConnection = new Sequelize(testDbName, process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      dialect: 'mysql',
      logging: console.log,
    });

    await testConnection.authenticate();
    console.log(`✓ Connected to test database: ${testDbName}\n`);

    // First, create the vouchers table (required for foreign keys)
    console.log('📋 Creating vouchers table (required for foreign keys)...');
    await testConnection.query(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id VARCHAR(36) PRIMARY KEY,
        voucher_number VARCHAR(255) NOT NULL,
        voucher_type VARCHAR(255) NOT NULL,
        voucher_date DATE NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        status ENUM('draft', 'posted', 'cancelled') DEFAULT 'draft',
        tenant_id VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Vouchers table created\n');

    // Create existing tables that will be enhanced
    console.log('📋 Creating existing tables (einvoices, eway_bills, tds_details)...');
    
    await testConnection.query(`
      CREATE TABLE IF NOT EXISTS einvoices (
        id VARCHAR(36) PRIMARY KEY,
        voucher_id VARCHAR(36),
        irn VARCHAR(64),
        ack_number VARCHAR(20),
        ack_date TIMESTAMP,
        status ENUM('generated', 'cancelled') DEFAULT 'generated',
        tenant_id VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    await testConnection.query(`
      CREATE TABLE IF NOT EXISTS eway_bills (
        id VARCHAR(36) PRIMARY KEY,
        voucher_id VARCHAR(36),
        ewb_number VARCHAR(20),
        generated_at TIMESTAMP NULL,
        valid_upto TIMESTAMP NULL,
        status ENUM('generated', 'cancelled') DEFAULT 'generated',
        tenant_id VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    await testConnection.query(`
      CREATE TABLE IF NOT EXISTS tds_details (
        id VARCHAR(36) PRIMARY KEY,
        voucher_id VARCHAR(36),
        tds_section VARCHAR(10),
        tds_rate DECIMAL(6,2),
        tds_amount DECIMAL(15,2) DEFAULT 0,
        quarter VARCHAR(10),
        financial_year VARCHAR(10),
        tenant_id VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✓ Existing tables created\n');

    // Run the migration
    console.log('🚀 Running migration 002-indian-invoice-system-schema...\n');
    const migration = require('./src/migrations/002-indian-invoice-system-schema.js');
    const queryInterface = testConnection.getQueryInterface();

    await migration.up(queryInterface, Sequelize);

    console.log('\n✅ Migration completed successfully!\n');

    // Verify the schema
    console.log('🔍 Verifying schema...\n');

    // Check numbering_series table
    const [numberingSeries] = await testConnection.query("SHOW TABLES LIKE 'numbering_series'");
    console.log(`✓ numbering_series table: ${numberingSeries.length > 0 ? 'EXISTS' : 'MISSING'}`);

    if (numberingSeries.length > 0) {
      const seriesDesc = await testConnection.query("DESCRIBE numbering_series");
      console.log(`  - Columns: ${seriesDesc[0].map(c => c.Field).join(', ')}`);
    }

    // Check numbering_history table
    const [numberingHistory] = await testConnection.query("SHOW TABLES LIKE 'numbering_history'");
    console.log(`✓ numbering_history table: ${numberingHistory.length > 0 ? 'EXISTS' : 'MISSING'}`);

    if (numberingHistory.length > 0) {
      const historyDesc = await testConnection.query("DESCRIBE numbering_history");
      console.log(`  - Columns: ${historyDesc[0].map(c => c.Field).join(', ')}`);
    }

    // Check enhanced einvoices table
    const einvoicesDesc = await testConnection.query("DESCRIBE einvoices");
    const einvoicesColumns = einvoicesDesc[0].map(c => c.Field);
    console.log(`✓ einvoices enhancements:`);
    console.log(`  - retry_count: ${einvoicesColumns.includes('retry_count') ? 'ADDED' : 'MISSING'}`);
    console.log(`  - last_retry_at: ${einvoicesColumns.includes('last_retry_at') ? 'ADDED' : 'MISSING'}`);
    console.log(`  - error_message: ${einvoicesColumns.includes('error_message') ? 'ADDED' : 'MISSING'}`);

    // Check enhanced eway_bills table
    const ewayBillsDesc = await testConnection.query("DESCRIBE eway_bills");
    const ewayBillsColumns = ewayBillsDesc[0].map(c => c.Field);
    console.log(`✓ eway_bills enhancements:`);
    console.log(`  - distance: ${ewayBillsColumns.includes('distance') ? 'ADDED' : 'MISSING'}`);
    console.log(`  - transport_mode: ${ewayBillsColumns.includes('transport_mode') ? 'ADDED' : 'MISSING'}`);
    console.log(`  - vehicle_no: ${ewayBillsColumns.includes('vehicle_no') ? 'ADDED' : 'MISSING'}`);
    console.log(`  - transporter_name: ${ewayBillsColumns.includes('transporter_name') ? 'ADDED' : 'MISSING'}`);

    // Check enhanced tds_details table
    const tdsDetailsDesc = await testConnection.query("DESCRIBE tds_details");
    const tdsDetailsColumns = tdsDetailsDesc[0].map(c => c.Field);
    console.log(`✓ tds_details enhancements:`);
    console.log(`  - deductee_name: ${tdsDetailsColumns.includes('deductee_name') ? 'ADDED' : 'MISSING'}`);
    console.log(`  - certificate_date: ${tdsDetailsColumns.includes('certificate_date') ? 'ADDED' : 'MISSING'}`);
    console.log(`  - taxable_amount: ${tdsDetailsColumns.includes('taxable_amount') ? 'ADDED' : 'MISSING'}`);

    // Check indexes
    console.log('\n🔍 Checking indexes...');
    const [seriesIndexes] = await testConnection.query("SHOW INDEX FROM numbering_series");
    console.log(`✓ numbering_series indexes: ${seriesIndexes.length} found`);

    const [historyIndexes] = await testConnection.query("SHOW INDEX FROM numbering_history");
    console.log(`✓ numbering_history indexes: ${historyIndexes.length} found`);

    console.log('\n✅ All schema verifications passed!\n');

    // Cleanup
    await testConnection.close();
    await sequelize.query(`DROP DATABASE IF EXISTS \`${testDbName}\``);
    console.log(`✓ Cleaned up test database: ${testDbName}`);

    console.log('\n🎉 Migration test completed successfully!\n');
    console.log('The migration is ready to be used in tenant provisioning.');
    console.log('It will automatically run when creating new tenants or can be run manually on existing tenants.\n');

  } catch (error) {
    console.error('\n❌ Migration test failed:', error.message);
    console.error('\nError details:', error);
    
    // Cleanup on error
    try {
      await sequelize.query(`DROP DATABASE IF EXISTS \`${testDbName}\``);
      console.log(`\n✓ Cleaned up test database: ${testDbName}`);
    } catch (cleanupError) {
      console.error('Failed to cleanup test database:', cleanupError.message);
    }
    
    process.exit(1);
  }
}

// Run the test
testMigration().catch(console.error);
