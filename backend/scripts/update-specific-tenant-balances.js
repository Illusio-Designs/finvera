#!/usr/bin/env node

/**
 * Update Ledger Balances for Specific Tenant Databases
 * This script targets the actual tenant databases with data
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const tenantConnectionManager = require('../src/config/tenantConnectionManager');
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
    let balanceType = ledger.balance_type;
    
    if (ledger.balance_type === 'debit' || ledger.opening_balance_type === 'Dr') {
      currentBalance = openingBalance + totalDebit - totalCredit;
    } else {
      currentBalance = openingBalance + totalCredit - totalDebit;
    }

    // Determine the correct balance type based on the final balance
    if (currentBalance < 0) {
      balanceType = ledger.balance_type === 'debit' ? 'credit' : 'debit';
      currentBalance = Math.abs(currentBalance);
    } else {
      currentBalance = Math.abs(currentBalance);
    }

    // Update the ledger's current balance and balance type
    const oldBalance = parseFloat(ledger.current_balance || 0);
    const newBalance = currentBalance;
    
    await ledger.update({
      current_balance: newBalance,
      balance_type: balanceType
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
 * Update ledger balances for a specific database
 */
async function updateDatabaseLedgerBalances(dbName) {
  try {
    console.log(`\n🏢 Processing database: ${dbName}`);
    
    // Get database connection
    const tenantConnection = await tenantConnectionManager.getConnection({
      id: dbName,
      db_name: dbName,
      db_host: process.env.DB_HOST || 'localhost',
      db_port: parseInt(process.env.DB_PORT) || 3306,
      db_user: process.env.DB_USER,
      db_password: process.env.DB_PASSWORD,
    });

    // Load tenant models
    const tenantModels = require('../src/services/tenantModels')(tenantConnection);

    // Get all ledgers
    const ledgers = await tenantModels.Ledger.findAll({
      order: [['ledger_name', 'ASC']]
    });

    console.log(`📊 Found ${ledgers.length} ledgers to update`);

    const results = [];
    let updatedCount = 0;

    for (const ledger of ledgers) {
      try {
        const result = await updateLedgerBalance(tenantModels, ledger);
        results.push(result);
        if (Math.abs(result.old_balance - result.new_balance) > 0.01) {
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to update ${ledger.ledger_name}:`, error.message);
      }
    }

    console.log(`\n📈 Summary for ${dbName}:`);
    console.log(`   Total ledgers: ${ledgers.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Unchanged: ${ledgers.length - updatedCount}`);

    return results;
  } catch (error) {
    console.error(`❌ Error processing database ${dbName}:`, error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting ledger balance update for specific tenant databases...\n');

    // Target the specific databases that have actual data
    const databases = [
      'finvera_illusio_designs',
      'finvera_test_company_ltd'
    ];

    console.log(`📋 Processing ${databases.length} databases\n`);

    const allResults = [];
    let totalUpdated = 0;

    for (const dbName of databases) {
      try {
        const results = await updateDatabaseLedgerBalances(dbName);
        allResults.push({
          database: dbName,
          results
        });
        totalUpdated += results.filter(r => Math.abs(r.old_balance - r.new_balance) > 0.01).length;
      } catch (error) {
        console.error(`❌ Failed to process database ${dbName}:`, error.message);
      }
    }

    console.log('\n🎉 Ledger balance update completed!');
    console.log(`📊 Total ledgers updated: ${totalUpdated}`);
    console.log(`🗄️ Databases processed: ${databases.length}`);

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

module.exports = { updateLedgerBalance, updateDatabaseLedgerBalances };