const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testDateQuery() {
  try {
    const dbName = 'finvera_trader_test';
    const { Op } = Sequelize;
    
    const sequelize = new Sequelize(
      dbName,
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
      }
    );

    await sequelize.authenticate();
    console.log('\n✅ Connected\n');

    const from = '2026-01-31';
    const to = '2026-02-11';

    console.log(`Testing date range: ${from} to ${to}\n`);

    // Test 1: All vouchers
    const [allVouchers] = await sequelize.query(`
      SELECT voucher_number, voucher_date, status
      FROM vouchers
    `);
    console.log('All vouchers:');
    allVouchers.forEach(v => {
      console.log(`  ${v.voucher_number} | ${v.voucher_date} | ${v.status}`);
    });

    // Test 2: Posted vouchers
    const [postedVouchers] = await sequelize.query(`
      SELECT voucher_number, voucher_date, status
      FROM vouchers
      WHERE status = 'posted'
    `);
    console.log('\nPosted vouchers:');
    postedVouchers.forEach(v => {
      console.log(`  ${v.voucher_number} | ${v.voucher_date} | ${v.status}`);
    });

    // Test 3: Posted vouchers in date range
    const [vouchersInRange] = await sequelize.query(`
      SELECT voucher_number, voucher_date, status
      FROM vouchers
      WHERE status = 'posted'
        AND voucher_date BETWEEN ? AND ?
    `, {
      replacements: [from, to]
    });
    console.log(`\nPosted vouchers between ${from} and ${to}:`);
    vouchersInRange.forEach(v => {
      console.log(`  ${v.voucher_number} | ${v.voucher_date} | ${v.status}`);
    });

    // Test 4: Ledger entries for posted vouchers in range
    const [ledgerEntries] = await sequelize.query(`
      SELECT 
        v.voucher_number,
        v.voucher_date,
        l.ledger_name,
        vle.debit_amount,
        vle.credit_amount
      FROM voucher_ledger_entries vle
      JOIN vouchers v ON vle.voucher_id = v.id
      JOIN ledgers l ON vle.ledger_id = l.id
      WHERE v.status = 'posted'
        AND v.voucher_date BETWEEN ? AND ?
    `, {
      replacements: [from, to]
    });
    console.log(`\nLedger entries for posted vouchers in range: ${ledgerEntries.length}`);
    ledgerEntries.forEach(e => {
      console.log(`  ${e.voucher_number} | ${e.ledger_name.padEnd(25)} | Dr: ₹${parseFloat(e.debit_amount || 0).toFixed(2).padStart(10)} | Cr: ₹${parseFloat(e.credit_amount || 0).toFixed(2).padStart(10)}`);
    });

    // Test 5: Aggregated movements
    const [movements] = await sequelize.query(`
      SELECT 
        vle.ledger_id,
        l.ledger_name,
        SUM(vle.debit_amount) as total_debit,
        SUM(vle.credit_amount) as total_credit
      FROM voucher_ledger_entries vle
      JOIN vouchers v ON vle.voucher_id = v.id
      JOIN ledgers l ON vle.ledger_id = l.id
      WHERE v.status = 'posted'
        AND v.voucher_date BETWEEN ? AND ?
      GROUP BY vle.ledger_id, l.ledger_name
    `, {
      replacements: [from, to]
    });
    console.log(`\nAggregated movements: ${movements.length} ledgers`);
    movements.forEach(m => {
      console.log(`  ${m.ledger_name.padEnd(30)} | Dr: ₹${parseFloat(m.total_debit || 0).toFixed(2).padStart(12)} | Cr: ₹${parseFloat(m.total_credit || 0).toFixed(2).padStart(12)}`);
    });

    await sequelize.close();
    console.log('\n✅ Test complete\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testDateQuery();
