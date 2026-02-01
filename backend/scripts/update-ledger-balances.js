#!/usr/bin/env node

/**
 * Update Ledger Balances Script
 * This script recalculates and updates all ledger balances based on existing voucher ledger entries
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const tenantConnectionManager = require('../src/config/tenantConnectionManager');
const TenantMaster = require('../src/models/TenantMaster');
const logger = require('../src/utils/logger');

/**
 * Update ledger balance based on ledger entries
 */
async function updateLedgerBalance(tenantModels, ledger) {
  try {
    // Calculate total debits and credits from ledger entries
    const entries = await tenantModels.VoucherLedgerEntry.findAll({
      where: { ledger_id: ledger.id },
      attributes: [
        [tenantModels.sequelize.fn('SUM', tenantModels.sequelize.col('debit_amount')), 'total_debit'],
        [tenantModels.sequelize.fn('SUM', tenantModels.sequelize.col('credit_amount')), 'total_credit']
      ],
      raw: true
    });

    const totalDebit = parseFloat(entries[0]?.total_debit || 0);
    const totalCredit = parseFloat(entries[0]?.total_credit || 0);
    const openingBalance = parseFloat(ledger.opening_balance || 0);

    // Calculate current balance based on ledger type
    let currentBalance = openingBalance;
    if (ledger.balance_type === 'debit' || ledger.opening_balance_type === 'Dr') {
      currentBalance = openingBalance + totalDebit - totalCredit;
    } else {
      currentBalance = openingBalance + totalCredit - totalDebit;
    }

    // Update the ledger's current balance
    const oldBalance = parseFloat(ledger.current_balance || 0);
    const newBalance = Math.abs(currentBalance);
    
    await ledger.update({
      current_balance: newBalance
    });

    console.log(`✅ ${ledger.ledger_name}: ₹${oldBalance.toFixed(2)} → ₹${newBalance.toFixed(2)} (Debit: ₹${totalDebit.toFixed(2)}, Credit: ₹${totalCredit.toFixed(2)})`);
    
    return {
      ledger_name: ledger.ledger_name,
      old_balance: oldBalance,
      new_balance: newBalance,
      total_debit: totalDebit,
      total_credit: totalCredit
    };
  } catch (error) {
    console.error(`❌ Error updating ledger balance for ${ledger.ledger_name}:`, error.message);
    throw error;
  }
}

/**
 * Update all ledger balances for a tenant
 */
async function updateTenantLedgerBalances(tenant) {
  try {
    console.log(`\n🏢 Processing tenant: ${tenant.company_name || tenant.id}`);
    
    // Get tenant database connection
    let tenantConnection;
    if (tenant.db_provisioned && tenant.db_name && tenant.db_password) {
      // Company has its own database
      const tenantProvisioningService = require('../src/services/tenantProvisioningService');
      const dbPassword = tenantProvisioningService.decryptPassword(tenant.db_password);
      tenantConnection = await tenantConnectionManager.getConnection({
        id: tenant.id,
        db_name: tenant.db_name,
        db_host: tenant.db_host,
        db_port: tenant.db_port,
        db_user: process.env.USE_SEPARATE_DB_USERS === 'true' ? tenant.db_user : process.env.DB_USER,
        db_password: process.env.USE_SEPARATE_DB_USERS === 'true' ? dbPassword : process.env.DB_PASSWORD,
      });
    } else {
      // Company uses shared database
      const sharedDbName = tenant.db_name || process.env.DB_NAME || 'finvera_master';
      tenantConnection = await tenantConnectionManager.getConnection({
        id: tenant.id,
        db_name: sharedDbName,
        db_host: tenant.db_host || process.env.DB_HOST || 'localhost',
        db_port: tenant.db_port || parseInt(process.env.DB_PORT) || 3306,
        db_user: tenant.db_user || process.env.DB_USER,
        db_password: tenant.db_password ? (() => {
          try {
            const tenantProvisioningService = require('../src/services/tenantProvisioningService');
            return tenantProvisioningService.decryptPassword(tenant.db_password);
          } catch (e) {
            return process.env.DB_PASSWORD;
          }
        })() : process.env.DB_PASSWORD,
      });
    }

    // Load tenant models
    const tenantModels = require('../src/services/tenantModels')(tenantConnection);

    // Get all ledgers for this tenant
    const ledgers = await tenantModels.Ledger.findAll({
      where: { tenant_id: tenant.id },
      order: [['ledger_name', 'ASC']]
    });

    console.log(`📊 Found ${ledgers.length} ledgers to update`);

    const results = [];
    let updatedCount = 0;

    for (const ledger of ledgers) {
      try {
        const result = await updateLedgerBalance(tenantModels, ledger);
        results.push(result);
        if (result.old_balance !== result.new_balance) {
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to update ${ledger.ledger_name}:`, error.message);
      }
    }

    console.log(`\n📈 Summary for ${tenant.company_name || tenant.id}:`);
    console.log(`   Total ledgers: ${ledgers.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Unchanged: ${ledgers.length - updatedCount}`);

    return results;
  } catch (error) {
    console.error(`❌ Error processing tenant ${tenant.id}:`, error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting ledger balance update script...\n');

    // Get all active tenants
    const tenants = await TenantMaster.findAll({
      where: { is_active: true },
      order: [['company_name', 'ASC']]
    });

    console.log(`📋 Found ${tenants.length} active tenants\n`);

    const allResults = [];
    let totalUpdated = 0;

    for (const tenant of tenants) {
      try {
        const results = await updateTenantLedgerBalances(tenant);
        allResults.push({
          tenant: tenant.company_name || tenant.id,
          results
        });
        totalUpdated += results.filter(r => r.old_balance !== r.new_balance).length;
      } catch (error) {
        console.error(`❌ Failed to process tenant ${tenant.id}:`, error.message);
      }
    }

    console.log('\n🎉 Ledger balance update completed!');
    console.log(`📊 Total ledgers updated: ${totalUpdated}`);
    console.log(`🏢 Tenants processed: ${tenants.length}`);

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    // Close all tenant connections
    await tenantConnectionManager.closeAllConnections();
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { updateLedgerBalance, updateTenantLedgerBalances };