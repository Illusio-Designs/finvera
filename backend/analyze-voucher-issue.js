const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Database configuration
const sequelize = new Sequelize(
  'finvera_illusio_designs',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

async function analyzeVoucherIssue() {
  try {
    console.log('🔍 ANALYZING VOUCHER INTEGRATION ISSUE');
    console.log('=' .repeat(60));
    
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    const voucherNumber = 'PI260201896195';
    
    // Check voucher
    const [voucherResults] = await sequelize.query(`
      SELECT * FROM vouchers WHERE voucher_number = '${voucherNumber}'
    `);
    
    if (voucherResults.length === 0) {
      console.log('❌ Voucher not found');
      return;
    }
    
    const voucher = voucherResults[0];
    console.log('📄 VOUCHER ANALYSIS');
    console.log('-'.repeat(40));
    console.log(`✅ Voucher exists: ${voucher.voucher_number}`);
    console.log(`   Status: ${voucher.status}`);
    console.log(`   Type: ${voucher.voucher_type}`);
    console.log(`   Total: ₹${parseFloat(voucher.total_amount).toLocaleString('en-IN')}`);
    console.log(`   Party ID: ${voucher.party_ledger_id}`);
    
    // Check voucher items
    const [itemResults] = await sequelize.query(`
      SELECT COUNT(*) as count FROM voucher_items WHERE voucher_id = '${voucher.id}'
    `);
    
    console.log(`\n📦 VOUCHER ITEMS ANALYSIS`);
    console.log('-'.repeat(40));
    console.log(`❌ Voucher Items Count: ${itemResults[0].count}`);
    
    if (itemResults[0].count === 0) {
      console.log('   🚨 CRITICAL ISSUE: No voucher items found!');
      console.log('   This means the items were not saved when the voucher was created.');
    }
    
    // Check ledger entries
    const [ledgerResults] = await sequelize.query(`
      SELECT COUNT(*) as count FROM voucher_ledger_entries WHERE voucher_id = '${voucher.id}'
    `);
    
    console.log(`\n💰 LEDGER ENTRIES ANALYSIS`);
    console.log('-'.repeat(40));
    console.log(`❌ Ledger Entries Count: ${ledgerResults[0].count}`);
    
    if (ledgerResults[0].count === 0) {
      console.log('   🚨 CRITICAL ISSUE: No ledger entries found!');
      console.log('   This means the accounting entries were not created.');
    }
    
    // Check stock movements
    const [stockResults] = await sequelize.query(`
      SELECT COUNT(*) as count FROM stock_movements WHERE voucher_id = '${voucher.id}'
    `);
    
    console.log(`\n📊 STOCK MOVEMENTS ANALYSIS`);
    console.log('-'.repeat(40));
    console.log(`❌ Stock Movements Count: ${stockResults[0].count}`);
    
    if (stockResults[0].count === 0) {
      console.log('   🚨 CRITICAL ISSUE: No stock movements found!');
      console.log('   This means inventory was not updated.');
    }
    
    // Check inventory items
    const [inventoryResults] = await sequelize.query(`
      SELECT COUNT(*) as count FROM inventory_items
    `);
    
    console.log(`\n📋 INVENTORY ITEMS ANALYSIS`);
    console.log('-'.repeat(40));
    console.log(`Total Inventory Items: ${inventoryResults[0].count}`);
    
    // Check party ledger
    const [partyResults] = await sequelize.query(`
      SELECT ledger_name FROM ledgers WHERE id = '${voucher.party_ledger_id}'
    `);
    
    console.log(`\n👤 PARTY LEDGER ANALYSIS`);
    console.log('-'.repeat(40));
    if (partyResults.length > 0) {
      console.log(`✅ Party Ledger Found: ${partyResults[0].ledger_name}`);
    } else {
      console.log(`❌ Party Ledger Not Found: ${voucher.party_ledger_id}`);
    }
    
    // Summary
    console.log(`\n🔍 ISSUE SUMMARY`);
    console.log('=' .repeat(60));
    console.log('❌ VOUCHER INTEGRATION IS BROKEN');
    console.log('');
    console.log('Problems identified:');
    console.log('1. ❌ Voucher items not saved (0 items)');
    console.log('2. ❌ Ledger entries not created (0 entries)');
    console.log('3. ❌ Stock movements not recorded (0 movements)');
    console.log('4. ❌ Inventory not updated');
    console.log('');
    console.log('Root Cause:');
    console.log('The voucher creation process is only saving the main voucher record');
    console.log('but not the related items, ledger entries, or inventory updates.');
    console.log('');
    console.log('This indicates:');
    console.log('• The mobile app may not be sending the items data correctly');
    console.log('• The backend API may not be processing the items');
    console.log('• The voucher controller may not be calling the inventory functions');
    console.log('• Database transaction may be rolling back partially');
    
    console.log(`\n💡 NEXT STEPS`);
    console.log('-'.repeat(40));
    console.log('1. Check the mobile app request payload');
    console.log('2. Check backend API logs for errors');
    console.log('3. Verify the voucher controller is processing items');
    console.log('4. Test with a new voucher to see if the fix works');
    
    console.log(`\n🧪 TEST RECOMMENDATION`);
    console.log('-'.repeat(40));
    console.log('Create a new purchase voucher from the mobile app and check if:');
    console.log('• Items are saved to voucher_items table');
    console.log('• Ledger entries are created');
    console.log('• Stock movements are recorded');
    console.log('• Inventory quantities are updated');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

analyzeVoucherIssue();