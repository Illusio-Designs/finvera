/**
 * Run Indian Invoice System Migration on Existing Tenants
 * 
 * This script runs the 002-indian-invoice-system-schema migration
 * on all existing tenant databases.
 */

const TenantMaster = require('./src/models/TenantMaster');
const tenantConnectionManager = require('./src/config/tenantConnectionManager');
const logger = require('./src/utils/logger');
const { Sequelize } = require('sequelize');
require('dotenv').config();

async function runMigrationOnTenant(tenant) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 Processing Tenant: ${tenant.company_name}`);
  console.log(`   ID: ${tenant.id}`);
  console.log(`   Database: ${tenant.db_name}`);
  console.log(`   Subdomain: ${tenant.subdomain}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Get tenant connection
    console.log('🔌 Connecting to tenant database...');
    const connection = await tenantConnectionManager.getConnection(tenant);
    console.log('✓ Connected successfully\n');

    // Get query interface
    const queryInterface = connection.getQueryInterface();

    // Load the migration
    console.log('📋 Loading migration: 002-indian-invoice-system-schema.js');
    const migrationPath = './src/migrations/002-indian-invoice-system-schema.js';
    
    // Clear require cache to ensure fresh load
    delete require.cache[require.resolve(migrationPath)];
    const migration = require(migrationPath);

    if (!migration.up || typeof migration.up !== 'function') {
      throw new Error('Migration does not have an "up" function');
    }

    // Run the migration
    console.log('🚀 Running migration...\n');
    await migration.up(queryInterface, Sequelize);

    console.log('\n✅ Migration completed successfully for tenant:', tenant.company_name);
    console.log(`   Database: ${tenant.db_name}\n`);

    // Verify the schema
    console.log('🔍 Verifying schema changes...');
    
    // Check numbering_series table
    const [numberingSeries] = await connection.query("SHOW TABLES LIKE 'numbering_series'");
    console.log(`   ✓ numbering_series table: ${numberingSeries.length > 0 ? 'EXISTS' : 'MISSING'}`);

    // Check numbering_history table
    const [numberingHistory] = await connection.query("SHOW TABLES LIKE 'numbering_history'");
    console.log(`   ✓ numbering_history table: ${numberingHistory.length > 0 ? 'EXISTS' : 'MISSING'}`);

    // Check enhanced einvoices table
    try {
      const einvoicesDesc = await connection.query("DESCRIBE einvoices");
      const einvoicesColumns = einvoicesDesc[0].map(c => c.Field);
      console.log(`   ✓ einvoices.retry_count: ${einvoicesColumns.includes('retry_count') ? 'ADDED' : 'MISSING'}`);
      console.log(`   ✓ einvoices.last_retry_at: ${einvoicesColumns.includes('last_retry_at') ? 'ADDED' : 'MISSING'}`);
      console.log(`   ✓ einvoices.error_message: ${einvoicesColumns.includes('error_message') ? 'ADDED' : 'MISSING'}`);
    } catch (e) {
      console.log(`   ℹ️  einvoices table not found (may not exist yet)`);
    }

    // Check enhanced eway_bills table
    try {
      const ewayBillsDesc = await connection.query("DESCRIBE eway_bills");
      const ewayBillsColumns = ewayBillsDesc[0].map(c => c.Field);
      console.log(`   ✓ eway_bills.distance: ${ewayBillsColumns.includes('distance') ? 'ADDED' : 'MISSING'}`);
      console.log(`   ✓ eway_bills.transport_mode: ${ewayBillsColumns.includes('transport_mode') ? 'ADDED' : 'MISSING'}`);
    } catch (e) {
      console.log(`   ℹ️  eway_bills table not found (may not exist yet)`);
    }

    // Check enhanced tds_details table
    try {
      const tdsDetailsDesc = await connection.query("DESCRIBE tds_details");
      const tdsDetailsColumns = tdsDetailsDesc[0].map(c => c.Field);
      console.log(`   ✓ tds_details.deductee_name: ${tdsDetailsColumns.includes('deductee_name') ? 'ADDED' : 'MISSING'}`);
      console.log(`   ✓ tds_details.certificate_date: ${tdsDetailsColumns.includes('certificate_date') ? 'ADDED' : 'MISSING'}`);
      console.log(`   ✓ tds_details.taxable_amount: ${tdsDetailsColumns.includes('taxable_amount') ? 'ADDED' : 'MISSING'}`);
    } catch (e) {
      console.log(`   ℹ️  tds_details table not found (may not exist yet)`);
    }

    console.log('\n✅ Schema verification completed\n');

    return {
      success: true,
      tenant: tenant.company_name,
      database: tenant.db_name,
    };

  } catch (error) {
    console.error(`\n❌ Migration failed for tenant: ${tenant.company_name}`);
    console.error(`   Database: ${tenant.db_name}`);
    console.error(`   Error: ${error.message}\n`);
    
    if (error.message.includes('already exists') || 
        error.message.includes('Duplicate') ||
        error.message.includes('Table') && error.message.includes('already exists')) {
      console.log('   ℹ️  This is normal if migration was already run on this tenant\n');
      return {
        success: true,
        tenant: tenant.company_name,
        database: tenant.db_name,
        alreadyApplied: true,
      };
    }

    return {
      success: false,
      tenant: tenant.company_name,
      database: tenant.db_name,
      error: error.message,
    };
  }
}

async function runMigrationOnAllTenants() {
  console.log('\n🚀 Indian Invoice System Migration Runner');
  console.log('   Running migration: 002-indian-invoice-system-schema.js');
  console.log('   Target: All existing tenant databases\n');

  try {
    // Get all active tenants
    console.log('📋 Fetching all active tenants...');
    const tenants = await TenantMaster.findAll({
      where: {
        is_active: true,
        db_provisioned: true,
      },
      order: [['company_name', 'ASC']],
    });

    console.log(`✓ Found ${tenants.length} active tenant(s)\n`);

    if (tenants.length === 0) {
      console.log('⚠️  No active tenants found. Nothing to do.\n');
      return;
    }

    // Show tenant list
    console.log('Tenants to process:');
    tenants.forEach((tenant, index) => {
      console.log(`   ${index + 1}. ${tenant.company_name} (${tenant.subdomain}) - ${tenant.db_name}`);
    });
    console.log('');

    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question('Do you want to proceed? (yes/no): ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase());
      });
    });

    if (answer !== 'yes' && answer !== 'y') {
      console.log('\n❌ Migration cancelled by user\n');
      return;
    }

    console.log('\n🚀 Starting migration process...\n');

    // Run migration on each tenant
    const results = [];
    for (let i = 0; i < tenants.length; i++) {
      const tenant = tenants[i];
      console.log(`\n[${i + 1}/${tenants.length}] Processing tenant: ${tenant.company_name}`);
      
      const result = await runMigrationOnTenant(tenant);
      results.push(result);

      // Small delay between tenants
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60) + '\n');

    const successful = results.filter(r => r.success && !r.alreadyApplied);
    const alreadyApplied = results.filter(r => r.success && r.alreadyApplied);
    const failed = results.filter(r => !r.success);

    console.log(`Total tenants processed: ${results.length}`);
    console.log(`✅ Successfully migrated: ${successful.length}`);
    console.log(`ℹ️  Already applied: ${alreadyApplied.length}`);
    console.log(`❌ Failed: ${failed.length}\n`);

    if (successful.length > 0) {
      console.log('Successfully migrated tenants:');
      successful.forEach(r => {
        console.log(`   ✓ ${r.tenant} (${r.database})`);
      });
      console.log('');
    }

    if (alreadyApplied.length > 0) {
      console.log('Tenants with migration already applied:');
      alreadyApplied.forEach(r => {
        console.log(`   ℹ️  ${r.tenant} (${r.database})`);
      });
      console.log('');
    }

    if (failed.length > 0) {
      console.log('Failed tenants:');
      failed.forEach(r => {
        console.log(`   ❌ ${r.tenant} (${r.database})`);
        console.log(`      Error: ${r.error}`);
      });
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('🎉 Migration process completed!\n');

    if (failed.length > 0) {
      console.log('⚠️  Some tenants failed. Please check the errors above and retry manually.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the migration
runMigrationOnAllTenants()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  });
