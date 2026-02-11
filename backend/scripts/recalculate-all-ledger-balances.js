require('dotenv').config();
const { Sequelize } = require('sequelize');

// Connect to master database
const masterDb = new Sequelize(
  process.env.MASTER_DB_NAME || 'finvera_master',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

async function recalculateAllLedgerBalances() {
  try {
    console.log('\n🔄 === RECALCULATING ALL LEDGER BALANCES ===\n');

    // Get all tenant databases
    const [tenants] = await masterDb.query(`
      SELECT id as tenant_id, db_name, company_name 
      FROM tenant_master 
      WHERE is_active = 1
    `);

    console.log(`📋 Found ${tenants.length} active tenants\n`);

    // Process each tenant
    for (const tenant of tenants) {
      console.log(`\n📊 Processing: ${tenant.company_name} (${tenant.db_name})`);
      console.log('═'.repeat(100));

      // Connect to tenant database
      const tenantDb = new Sequelize(
        tenant.db_name,
        process.env.DB_USER || 'root',
        process.env.DB_PASSWORD || '',
        {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 3306,
          dialect: 'mysql',
          logging: false,
        }
      );

      try {
        // Get all active ledgers
        const [ledgers] = await tenantDb.query(`
          SELECT id, ledger_name, ledger_code, opening_balance, opening_balance_type, 
                 current_balance, balance_type
          FROM ledgers
          WHERE is_active = 1
          ORDER BY ledger_name
        `);

        console.log(`\nFound ${ledgers.length} active ledgers\n`);
        console.log('LEDGER NAME'.padEnd(30) + 'OLD BALANCE'.padEnd(20) + 'NEW BALANCE'.padEnd(20) + 'STATUS');
        console.log('─'.repeat(100));

        let updatedCount = 0;
        let unchangedCount = 0;

        for (const ledger of ledgers) {
          // Calculate total debits and credits from ALL voucher entries
          const [result] = await tenantDb.query(`
            SELECT 
              COALESCE(SUM(debit_amount), 0) AS total_debit,
              COALESCE(SUM(credit_amount), 0) AS total_credit
            FROM voucher_ledger_entries
            WHERE ledger_id = ?
          `, { replacements: [ledger.id] });

          const totalDebit = parseFloat(result[0].total_debit || 0);
          const totalCredit = parseFloat(result[0].total_credit || 0);
          const openingBalance = parseFloat(ledger.opening_balance || 0);
          const openingType = ledger.opening_balance_type || 'Dr';

          // Calculate net balance
          // Net = (Opening + Debits - Credits) for Dr opening
          // Net = (Opening + Credits - Debits) for Cr opening
          const netMovement = totalDebit - totalCredit;
          let netBalance;
          
          if (openingType === 'Dr') {
            // Debit opening: add debits, subtract credits
            netBalance = openingBalance + netMovement;
          } else {
            // Credit opening: add credits, subtract debits
            netBalance = openingBalance - netMovement;
          }

          // Determine balance type based on net balance
          const newBalanceType = netBalance >= 0 ? 'debit' : 'credit';
          const newBalance = Math.abs(netBalance);

          // Check if update is needed
          const oldBalance = parseFloat(ledger.current_balance || 0);
          const oldBalanceType = ledger.balance_type || 'debit';

          const balanceChanged = Math.abs(oldBalance - newBalance) > 0.01;
          const typeChanged = oldBalanceType !== newBalanceType;

          if (balanceChanged || typeChanged) {
            // Update the ledger
            await tenantDb.query(`
              UPDATE ledgers
              SET current_balance = ?,
                  balance_type = ?
              WHERE id = ?
            `, { replacements: [newBalance, newBalanceType, ledger.id] });

            const oldDisplay = `₹${oldBalance.toFixed(2)} ${oldBalanceType}`;
            const newDisplay = `₹${newBalance.toFixed(2)} ${newBalanceType}`;
            const status = '✓ UPDATED';

            console.log(
              ledger.ledger_name.padEnd(30) +
              oldDisplay.padEnd(20) +
              newDisplay.padEnd(20) +
              status
            );

            updatedCount++;
          } else {
            unchangedCount++;
          }
        }

        console.log('─'.repeat(100));
        console.log(`\n📊 Summary for ${tenant.company_name}:`);
        console.log(`  Total Ledgers: ${ledgers.length}`);
        console.log(`  ✓ Updated: ${updatedCount}`);
        console.log(`  ○ Unchanged: ${unchangedCount}`);

      } catch (error) {
        console.error(`  ❌ Error processing ${tenant.company_name}:`, error.message);
      } finally {
        await tenantDb.close();
      }
    }

    console.log('\n\n✅ RECALCULATION COMPLETE!\n');
    console.log('🎯 All ledger balances have been recalculated based on:');
    console.log('  1. Opening balance');
    console.log('  2. Total debits from all voucher entries');
    console.log('  3. Total credits from all voucher entries');
    console.log('  4. Automatic balance_type determination (debit/credit)\n');
    console.log('📊 Balance Type Logic:');
    console.log('  - Net positive = Debit balance');
    console.log('  - Net negative = Credit balance\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await masterDb.close();
  }
}

recalculateAllLedgerBalances();
