const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function inspectDatabase() {
  try {
    console.log('\n🔍 === DATABASE INSPECTION ===\n');

    const tenantDbName = 'finvera_trader_test';
    const masterDbName = 'finvera_master';
    
    console.log(`📊 Tenant Database: ${tenantDbName}`);
    console.log(`📊 Master Database: ${masterDbName}\n`);

    // Connect to master database for account groups
    const masterSequelize = new Sequelize(
      masterDbName,
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
      }
    );

    await masterSequelize.authenticate();
    console.log('✅ Connected to master database');

    // Connect to tenant database
    const tenantSequelize = new Sequelize(
      tenantDbName,
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
      }
    );

    await tenantSequelize.authenticate();
    console.log('✅ Connected to tenant database\n');
    console.log('='.repeat(100));

    // Get account groups from master
    console.log('\n📋 ACCOUNT GROUPS (from master database):\n');
    const [accountGroups] = await masterSequelize.query(`
      SELECT id, group_code, name, nature, affects_gross_profit
      FROM account_groups
      ORDER BY group_code
    `);

    console.log(`Total Groups: ${accountGroups.length}\n`);
    accountGroups.forEach(g => {
      console.log(`  ${g.group_code.padEnd(15)} | ${g.name.padEnd(35)} | ${g.nature.padEnd(10)} | GP: ${g.affects_gross_profit ? 'Yes' : 'No'}`);
    });

    // Check vouchers
    console.log('\n\n📊 VOUCHERS:\n');
    
    const [totalVouchers] = await tenantSequelize.query(`
      SELECT COUNT(*) as total FROM vouchers
    `);
    console.log(`Total Vouchers: ${totalVouchers[0].total}`);

    if (totalVouchers[0].total > 0) {
      const [voucherStats] = await tenantSequelize.query(`
        SELECT 
          status,
          COUNT(*) as count,
          SUM(total_amount) as total
        FROM vouchers
        GROUP BY status
      `);

      console.log('\nBy Status:');
      voucherStats.forEach(s => {
        console.log(`  ${s.status.padEnd(10)} : ${String(s.count).padStart(5)} vouchers, Total: ₹${parseFloat(s.total || 0).toFixed(2).padStart(15)}`);
      });

      const [voucherTypes] = await tenantSequelize.query(`
        SELECT 
          voucher_type,
          status,
          COUNT(*) as count,
          SUM(total_amount) as total
        FROM vouchers
        GROUP BY voucher_type, status
        ORDER BY voucher_type, status
      `);

      console.log('\nBy Type & Status:');
      voucherTypes.forEach(t => {
        console.log(`  ${t.voucher_type.padEnd(25)} | ${t.status.padEnd(10)} : ${String(t.count).padStart(5)} vouchers, Total: ₹${parseFloat(t.total || 0).toFixed(2).padStart(15)}`);
      });

      // Recent vouchers
      console.log('\n📋 Recent Vouchers (Last 15):\n');
      const [recentVouchers] = await tenantSequelize.query(`
        SELECT 
          voucher_number,
          voucher_type,
          voucher_date,
          status,
          total_amount,
          party_ledger_id
        FROM vouchers
        ORDER BY voucher_date DESC
        LIMIT 15
      `);

      recentVouchers.forEach(v => {
        const date = v.voucher_date ? new Date(v.voucher_date).toISOString().split('T')[0] : 'N/A';
        console.log(`  ${v.voucher_number.padEnd(20)} | ${v.voucher_type.padEnd(25)} | ${date} | ${v.status.padEnd(10)} | ₹${parseFloat(v.total_amount || 0).toFixed(2).padStart(12)}`);
      });
    }

    // Check ledgers
    console.log('\n\n📊 LEDGERS:\n');
    const [ledgers] = await tenantSequelize.query(`
      SELECT 
        id,
        ledger_name,
        ledger_code,
        account_group_id,
        opening_balance,
        current_balance,
        balance_type,
        is_active
      FROM ledgers
      ORDER BY ledger_name
    `);

    console.log(`Total Ledgers: ${ledgers.length}`);
    console.log(`Active Ledgers: ${ledgers.filter(l => l.is_active).length}\n`);
    
    ledgers.forEach(l => {
      const group = accountGroups.find(g => g.id === l.account_group_id);
      const groupInfo = group ? `${group.group_code.padEnd(10)} (${group.name})` : 'Unknown Group';
      const active = l.is_active ? '✓' : '✗';
      console.log(`  ${active} ${l.ledger_name.padEnd(30)} | ${groupInfo.padEnd(45)} | Opening: ₹${parseFloat(l.opening_balance || 0).toFixed(2).padStart(12)} | Current: ₹${parseFloat(l.current_balance || 0).toFixed(2).padStart(12)}`);
    });

    // Check voucher ledger entries
    console.log('\n\n📊 VOUCHER LEDGER ENTRIES:\n');
    const [entryCount] = await tenantSequelize.query(`
      SELECT COUNT(*) as total FROM voucher_ledger_entries
    `);
    console.log(`Total Entries: ${entryCount[0].total}`);

    if (entryCount[0].total > 0) {
      const [entriesByStatus] = await tenantSequelize.query(`
        SELECT 
          v.status,
          COUNT(*) as entry_count,
          SUM(vle.debit_amount) as total_debit,
          SUM(vle.credit_amount) as total_credit
        FROM voucher_ledger_entries vle
        JOIN vouchers v ON vle.voucher_id = v.id
        GROUP BY v.status
      `);

      console.log('\nBy Voucher Status:');
      entriesByStatus.forEach(e => {
        console.log(`  ${e.status.padEnd(10)} : ${String(e.entry_count).padStart(5)} entries, Debit: ₹${parseFloat(e.total_debit || 0).toFixed(2).padStart(15)}, Credit: ₹${parseFloat(e.total_credit || 0).toFixed(2).padStart(15)}`);
      });

      // Sample ledger entries
      console.log('\n📋 Sample Ledger Entries (Last 15):\n');
      const [sampleEntries] = await tenantSequelize.query(`
        SELECT 
          v.voucher_number,
          v.voucher_type,
          v.status,
          v.voucher_date,
          l.ledger_name,
          vle.debit_amount,
          vle.credit_amount
        FROM voucher_ledger_entries vle
        JOIN vouchers v ON vle.voucher_id = v.id
        JOIN ledgers l ON vle.ledger_id = l.id
        ORDER BY v.voucher_date DESC
        LIMIT 15
      `);

      sampleEntries.forEach(e => {
        const date = e.voucher_date ? new Date(e.voucher_date).toISOString().split('T')[0] : 'N/A';
        console.log(`  ${e.voucher_number.padEnd(20)} | ${e.ledger_name.padEnd(30)} | Dr: ₹${parseFloat(e.debit_amount || 0).toFixed(2).padStart(12)} | Cr: ₹${parseFloat(e.credit_amount || 0).toFixed(2).padStart(12)} | ${e.status}`);
      });
    }

    // Check inventory
    console.log('\n\n📦 INVENTORY ITEMS:\n');
    const [inventoryCount] = await tenantSequelize.query(`
      SELECT COUNT(*) as total FROM inventory_items WHERE is_active = 1
    `);
    console.log(`Total Active Items: ${inventoryCount[0].total}`);

    if (inventoryCount[0].total > 0) {
      const [inventoryItems] = await tenantSequelize.query(`
        SELECT 
          item_name,
          quantity_on_hand,
          avg_cost,
          opening_balance
        FROM inventory_items
        WHERE is_active = 1
        LIMIT 15
      `);

      console.log('\nSample Items:');
      inventoryItems.forEach(i => {
        const stockValue = parseFloat(i.quantity_on_hand || 0) * parseFloat(i.avg_cost || 0);
        console.log(`  ${i.item_name.padEnd(35)} | Qty: ${parseFloat(i.quantity_on_hand || 0).toString().padStart(8)} | Avg Cost: ₹${parseFloat(i.avg_cost || 0).toFixed(2).padStart(10)} | Stock Value: ₹${stockValue.toFixed(2).padStart(12)}`);
      });

      const [stockSummary] = await tenantSequelize.query(`
        SELECT 
          SUM(opening_balance) as total_opening,
          SUM(quantity_on_hand * avg_cost) as total_closing
        FROM inventory_items
        WHERE is_active = 1
      `);

      console.log('\nStock Summary:');
      console.log(`  Total Opening Stock: ₹${parseFloat(stockSummary[0].total_opening || 0).toFixed(2)}`);
      console.log(`  Total Closing Stock: ₹${parseFloat(stockSummary[0].total_closing || 0).toFixed(2)}`);
    }

    // Check date ranges
    console.log('\n\n📅 DATE RANGES:\n');
    const [dateRange] = await tenantSequelize.query(`
      SELECT 
        MIN(voucher_date) as earliest,
        MAX(voucher_date) as latest,
        COUNT(*) as total
      FROM vouchers
      WHERE voucher_date IS NOT NULL
    `);

    if (dateRange[0].total > 0) {
      console.log(`Earliest Voucher: ${new Date(dateRange[0].earliest).toISOString().split('T')[0]}`);
      console.log(`Latest Voucher: ${new Date(dateRange[0].latest).toISOString().split('T')[0]}`);
      console.log(`Total with dates: ${dateRange[0].total}`);
    } else {
      console.log('No vouchers with dates found');
    }

    // Check voucher items
    console.log('\n\n📦 VOUCHER ITEMS:\n');
    const [itemCount] = await tenantSequelize.query(`
      SELECT COUNT(*) as total FROM voucher_items
    `);
    console.log(`Total Voucher Items: ${itemCount[0].total}`);

    if (itemCount[0].total > 0) {
      const [itemSummary] = await tenantSequelize.query(`
        SELECT 
          v.voucher_type,
          COUNT(*) as item_count,
          SUM(vi.quantity) as total_qty,
          SUM(vi.amount) as total_amount
        FROM voucher_items vi
        JOIN vouchers v ON vi.voucher_id = v.id
        GROUP BY v.voucher_type
      `);

      console.log('\nBy Voucher Type:');
      itemSummary.forEach(s => {
        console.log(`  ${s.voucher_type.padEnd(25)} : ${String(s.item_count).padStart(5)} items, Qty: ${parseFloat(s.total_qty || 0).toFixed(2).padStart(10)}, Amount: ₹${parseFloat(s.total_amount || 0).toFixed(2).padStart(15)}`);
      });
    }

    // Close connections
    await tenantSequelize.close();
    await masterSequelize.close();

    console.log('\n\n✅ Inspection complete\n');
    console.log('='.repeat(100));
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

inspectDatabase();
