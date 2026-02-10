/**
 * Complete Setup Script for Test Companies
 * 
 * This script:
 * 1. Creates test tenants (trader and retail)
 * 2. Creates test companies with business types
 * 3. Creates test branches
 * 4. Creates test users
 * 5. Provisions databases
 * 6. Displays login credentials
 * 
 * Usage: node backend/scripts/setup-test-companies.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const masterSequelize = require('../src/config/masterDatabase');
const { Sequelize } = require('sequelize');
const masterModels = require('../src/models/masterModels');
const tenantProvisioningService = require('../src/services/tenantProvisioningService');
const tenantConnectionManager = require('../src/config/tenantConnectionManager');

// Connect to main database
const sequelize = new Sequelize(
  process.env.DB_NAME || 'finvera_main',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

// Encryption helper (same as tenantProvisioningService)
function encryptPassword(password) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function setupTestCompanies() {
  const logger = console;
  
  try {
    logger.log('🚀 Starting complete test company setup...\n');
    
    // Test connections
    await sequelize.authenticate();
    await masterSequelize.authenticate();
    logger.log('✅ Database connections established\n');
    
    // ========================================================================
    // CLEANUP EXISTING TEST DATA
    // ========================================================================
    logger.log('🧹 Cleaning up existing test data...');
    
    // Delete existing test data
    await masterSequelize.query(`
      DELETE FROM branches WHERE company_id IN (
        SELECT id FROM companies WHERE tenant_id IN (
          SELECT id FROM tenant_master WHERE subdomain IN ('trader-test', 'retail-test')
        )
      );
    `);
    
    await masterSequelize.query(`
      DELETE FROM companies WHERE tenant_id IN (
        SELECT id FROM tenant_master WHERE subdomain IN ('trader-test', 'retail-test')
      );
    `);
    
    await sequelize.query(`
      DELETE FROM users WHERE email IN ('admin@trader-test.com', 'admin@retail-test.com');
    `);
    
    await masterSequelize.query(`
      DELETE FROM tenant_master WHERE subdomain IN ('trader-test', 'retail-test');
    `);
    
    logger.log('✅ Cleanup completed\n');
    
    // ========================================================================
    // CREATE TRADER TENANT & COMPANY
    // ========================================================================
    logger.log('📦 Creating Trader Company...');
    
    // Use the actual DB password from environment (same as what provisioning service uses)
    const traderDbPassword = process.env.DB_PASSWORD || '';
    
    const traderTenant = await masterModels.TenantMaster.create({
      company_name: 'Trader Test Company',
      subdomain: 'trader-test',
      db_name: 'finvera_trader_test',
      db_host: 'localhost',
      db_port: 3306,
      db_user: process.env.DB_USER || 'root',
      db_password: encryptPassword(traderDbPassword),
      email: 'trader@test.com',
      phone: '9876543210',
      address: '123 Trader Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      gstin: '27AABCT1234A1Z5',
      pan: 'AABCT1234A',
      subscription_plan: 'basic',
      subscription_start: new Date(),
      subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      is_trial: false,
      is_active: true,
      is_suspended: false,
      db_provisioned: false,
      storage_limit_mb: 1024,
      storage_used_mb: 0,
      settings: { barcode_enabled: false }
    });
    
    const traderCompany = await masterModels.Company.create({
      tenant_id: traderTenant.id,
      created_by_user_id: traderTenant.id,
      company_name: 'ABC Trading Company',
      company_type: 'private_limited',
      business_type: 'trader',
      registration_number: 'U51909MH2020PTC123456',
      incorporation_date: '2020-01-15',
      pan: 'AABCT1234A',
      tan: 'MUMT12345A',
      gstin: '27AABCT1234A1Z5',
      is_composition_dealer: false,
      registered_address: '123 Business Park, Andheri East',
      state: 'Maharashtra',
      pincode: '400069',
      contact_number: '02226789012',
      email: 'info@abctrading.com',
      financial_year_start: '2024-04-01',
      financial_year_end: '2025-03-31',
      currency: 'INR',
      books_beginning_date: '2024-04-01',
      db_name: 'finvera_trader_test',
      db_host: 'localhost',
      db_port: 3306,
      db_user: process.env.DB_USER || 'root',
      db_password: encryptPassword(traderDbPassword),
      db_provisioned: false,
      is_active: true
    });
    
    await masterModels.Branch.create({
      company_id: traderCompany.id,
      branch_name: 'Main Branch - Mumbai',
      branch_code: 'MUM001',
      business_type: null,
      gstin: '27AABCT1234A1Z5',
      address: '123 Business Park, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400069',
      phone: '02226789012',
      email: 'mumbai@abctrading.com',
      is_active: true
    });
    
    logger.log('✅ Trader company created\n');
    
    // ========================================================================
    // CREATE RETAIL TENANT & COMPANY
    // ========================================================================
    logger.log('📦 Creating Retail Company...');
    
    // Use the actual DB password from environment (same as what provisioning service uses)
    const retailDbPassword = process.env.DB_PASSWORD || '';
    
    const retailTenant = await masterModels.TenantMaster.create({
      company_name: 'Retail Test Store',
      subdomain: 'retail-test',
      db_name: 'finvera_retail_test',
      db_host: 'localhost',
      db_port: 3306,
      db_user: process.env.DB_USER || 'root',
      db_password: encryptPassword(retailDbPassword),
      email: 'retail@test.com',
      phone: '9876543211',
      address: '456 Retail Avenue',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      gstin: '07AABCR5678B1Z1',
      pan: 'AABCR5678B',
      subscription_plan: 'basic',
      subscription_start: new Date(),
      subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      is_trial: false,
      is_active: true,
      is_suspended: false,
      db_provisioned: false,
      storage_limit_mb: 1024,
      storage_used_mb: 0,
      settings: { barcode_enabled: true }
    });
    
    const retailCompany = await masterModels.Company.create({
      tenant_id: retailTenant.id,
      created_by_user_id: retailTenant.id,
      company_name: 'XYZ Retail Store',
      company_type: 'private_limited',
      business_type: 'retail',
      registration_number: 'U52100DL2021PTC234567',
      incorporation_date: '2021-03-20',
      pan: 'AABCR5678B',
      tan: 'DELT23456B',
      gstin: '07AABCR5678B1Z1',
      is_composition_dealer: false,
      registered_address: '456 Shopping Complex, Connaught Place',
      state: 'Delhi',
      pincode: '110001',
      contact_number: '01143210987',
      email: 'info@xyzretail.com',
      financial_year_start: '2024-04-01',
      financial_year_end: '2025-03-31',
      currency: 'INR',
      books_beginning_date: '2024-04-01',
      db_name: 'finvera_retail_test',
      db_host: 'localhost',
      db_port: 3306,
      db_user: process.env.DB_USER || 'root',
      db_password: encryptPassword(retailDbPassword),
      db_provisioned: false,
      is_active: true
    });
    
    await masterModels.Branch.create({
      company_id: retailCompany.id,
      branch_name: 'Main Store - Delhi',
      branch_code: 'DEL001',
      business_type: 'retail',
      gstin: '07AABCR5678B1Z1',
      address: '456 Shopping Complex, Connaught Place',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      phone: '01143210987',
      email: 'delhi@xyzretail.com',
      is_active: true
    });
    
    logger.log('✅ Retail company created\n');
    
    // ========================================================================
    // CREATE USERS
    // ========================================================================
    logger.log('👤 Creating test users...');
    
    const traderPassword = await bcrypt.hash('trader123', 10);
    const traderUser = await sequelize.query(`
      INSERT INTO users (
        id, email, password, name, phone,
        role, is_active, tenant_id,
        createdAt, updatedAt
      ) VALUES (
        UUID(), 'admin@trader-test.com', ?, 'Trader Admin', '9876543210',
        'tenant_admin', 1, ?,
        NOW(), NOW()
      )
    `, {
      replacements: [traderPassword, traderTenant.id]
    });
    
    const retailPassword = await bcrypt.hash('retail123', 10);
    const retailUser = await sequelize.query(`
      INSERT INTO users (
        id, email, password, name, phone,
        role, is_active, tenant_id,
        createdAt, updatedAt
      ) VALUES (
        UUID(), 'admin@retail-test.com', ?, 'Retail Admin', '9876543211',
        'tenant_admin', 1, ?,
        NOW(), NOW()
      )
    `, {
      replacements: [retailPassword, retailTenant.id]
    });
    
    logger.log('✅ Test users created\n');
    
    // ========================================================================
    // PROVISION DATABASES
    // ========================================================================
    logger.log('💾 Provisioning databases...');
    
    try {
      await tenantProvisioningService.provisionDatabase(traderCompany, traderDbPassword);
      logger.log('✅ Trader database provisioned');
    } catch (error) {
      logger.log('⚠️  Trader database provisioning error:', error.message);
    }
    
    try {
      await tenantProvisioningService.provisionDatabase(retailCompany, retailDbPassword);
      logger.log('✅ Retail database provisioned');
    } catch (error) {
      logger.log('⚠️  Retail database provisioning error:', error.message);
    }
    
    logger.log('');
    
    // ========================================================================
    // SEED DEFAULT DATA (Ledgers)
    // ========================================================================
    logger.log('🌱 Seeding default data...');
    
    // Helper function to seed company data
    async function seedCompanyData(company, companyName) {
      try {
        const tenantConnection = await tenantConnectionManager.getConnection({
          id: company.id,
          db_name: company.db_name,
          db_host: company.db_host,
          db_port: company.db_port,
          db_user: process.env.DB_USER || 'root',
          db_password: process.env.DB_PASSWORD || '',
        });
        
        const tenantModels = require('../src/services/tenantModels')(tenantConnection);
        const accountGroups = await masterModels.AccountGroup.findAll({ where: { is_system: true } });
        
        const groupMap = new Map();
        accountGroups.forEach((group) => groupMap.set(group.group_code, group.id));
        
        const defaultLedgers = [
          { ledger_name: 'CGST', ledger_code: 'CGST-001', account_group_code: 'DT', balance_type: 'credit', opening_balance: 0 },
          { ledger_name: 'SGST', ledger_code: 'SGST-001', account_group_code: 'DT', balance_type: 'credit', opening_balance: 0 },
          { ledger_name: 'IGST', ledger_code: 'IGST-001', account_group_code: 'DT', balance_type: 'credit', opening_balance: 0 },
          { ledger_name: 'Cash on Hand', ledger_code: 'CASH-001', account_group_code: 'CASH', balance_type: 'debit', opening_balance: 0 },
          { ledger_name: 'Stock in Hand', ledger_code: 'INV-001', account_group_code: 'INV', balance_type: 'debit', opening_balance: 0 },
          { ledger_name: 'Sales', ledger_code: 'SAL-001', account_group_code: 'SAL', balance_type: 'credit', opening_balance: 0 },
          { ledger_name: 'Purchase', ledger_code: 'PUR-001', account_group_code: 'PUR', balance_type: 'debit', opening_balance: 0 },
        ];
        
        let createdCount = 0;
        for (const ledgerData of defaultLedgers) {
          const groupId = groupMap.get(ledgerData.account_group_code);
          if (groupId) {
            const { Op } = require('sequelize');
            const existing = await tenantModels.Ledger.findOne({
              where: { [Op.or]: [{ ledger_code: ledgerData.ledger_code }, { ledger_name: ledgerData.ledger_name }] }
            });
            
            if (!existing) {
              await tenantModels.Ledger.create({
                ledger_name: ledgerData.ledger_name,
                ledger_code: ledgerData.ledger_code,
                account_group_id: groupId,
                opening_balance: ledgerData.opening_balance,
                opening_balance_type: ledgerData.balance_type === 'debit' ? 'Dr' : 'Cr',
                balance_type: ledgerData.balance_type,
                is_active: true,
                tenant_id: company.tenant_id,
              });
              createdCount++;
            }
          }
        }
        
        logger.log(`✅ ${companyName}: ${createdCount} ledgers created`);
        
        // Create default warehouse
        const defaultWarehouse = await tenantModels.Warehouse.findOne({
          where: { is_default: true }
        });
        
        if (!defaultWarehouse) {
          await tenantModels.Warehouse.create({
            tenant_id: company.tenant_id,
            warehouse_code: 'WH-001',
            warehouse_name: 'Main Warehouse',
            address: company.registered_address || 'Main Location',
            city: company.city || '',
            state: company.state || '',
            pincode: company.pincode || '',
            is_default: true,
            is_active: true,
          });
          logger.log(`✅ ${companyName}: Default warehouse created`);
        } else {
          logger.log(`✅ ${companyName}: Default warehouse already exists`);
        }
        
        // Create numbering series
        const defaultNumberingSeries = [
          { voucher_type: 'sales_invoice', series_name: 'Sales Invoice Series', prefix: 'SI' },
          { voucher_type: 'tax_invoice', series_name: 'Tax Invoice Series', prefix: 'TI' },
          { voucher_type: 'bill_of_supply', series_name: 'Bill of Supply Series', prefix: 'BS' },
          { voucher_type: 'retail_invoice', series_name: 'Retail Invoice Series', prefix: 'RI' },
          { voucher_type: 'export_invoice', series_name: 'Export Invoice Series', prefix: 'EI' },
          { voucher_type: 'purchase_invoice', series_name: 'Purchase Invoice Series', prefix: 'PI' },
          { voucher_type: 'purchase_order', series_name: 'Purchase Order Series', prefix: 'PO' },
          { voucher_type: 'sales_order', series_name: 'Sales Order Series', prefix: 'SO' },
        ];
        
        let seriesCreated = 0;
        for (const series of defaultNumberingSeries) {
          const existing = await tenantModels.NumberingSeries.findOne({
            where: { voucher_type: series.voucher_type }
          });
          
          if (!existing) {
            await tenantModels.NumberingSeries.create({
              tenant_id: company.tenant_id,
              voucher_type: series.voucher_type,
              series_name: series.series_name,
              prefix: series.prefix,
              format: 'PREFIXSEPARATORYEARSEPARATORSEQUENCE',
              separator: '-',
              sequence_length: 4,
              current_sequence: 1,
              start_number: 1,
              end_number: null,
              reset_frequency: 'yearly',
              last_reset_date: null,
              is_default: true,
              is_active: true,
            });
            seriesCreated++;
          }
        }
        
        logger.log(`✅ ${companyName}: ${seriesCreated} numbering series created`);
      } catch (error) {
        logger.log(`⚠️  ${companyName} seeding error:`, error.message);
      }
    }
    
    await seedCompanyData(traderCompany, 'Trader');
    await seedCompanyData(retailCompany, 'Retail');
    
    logger.log('');
    
    // ========================================================================
    // DISPLAY SUMMARY
    // ========================================================================
    logger.log('='.repeat(70));
    logger.log('✅ TEST COMPANIES SETUP COMPLETED!');
    logger.log('='.repeat(70));
    
    logger.log('\n🔐 LOGIN CREDENTIALS:\n');
    
    logger.log('🏢 TRADER COMPANY (Normal Inventory - Barcode Optional)');
    logger.log('   Email:        admin@trader-test.com');
    logger.log('   Password:     trader123');
    logger.log('   Company:      ABC Trading Company');
    logger.log('   Company ID:   ' + traderCompany.id);
    logger.log('   Business Type: trader');
    logger.log('   Location:     Mumbai, Maharashtra');
    
    logger.log('\n🏪 RETAIL COMPANY (Barcode-Based - Barcode Mandatory)');
    logger.log('   Email:        admin@retail-test.com');
    logger.log('   Password:     retail123');
    logger.log('   Company:      XYZ Retail Store');
    logger.log('   Company ID:   ' + retailCompany.id);
    logger.log('   Business Type: retail');
    logger.log('   Location:     Delhi, Delhi');
    
    logger.log('\n' + '='.repeat(70));
    logger.log('📋 TESTING INSTRUCTIONS:');
    logger.log('='.repeat(70));
    logger.log('\n1. Login with either account');
    logger.log('2. Trader: Create items WITHOUT barcode (should work)');
    logger.log('3. Retail: Create items WITHOUT barcode (should fail)');
    logger.log('4. Retail: Create items WITH barcode (should work)');
    logger.log('\n' + '='.repeat(70) + '\n');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Setup failed:', error);
    logger.error('\nError details:', error.message);
    if (error.stack) {
      logger.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the script
setupTestCompanies();
