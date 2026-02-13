require('dotenv').config();
const mysql = require('mysql2/promise');

async function verifyTestData() {
  console.log('🔍 Verifying Test Data in finvera_trader_test...\n');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'finvera_trader_test',
    });
    
    // Check vouchers
    console.log('📋 Checking Vouchers...');
    const [vouchers] = await connection.query(
      'SELECT voucher_type, COUNT(*) as count FROM vouchers GROUP BY voucher_type'
    );
    
    if (vouchers.length > 0) {
      console.log('✓ Vouchers found:');
      vouchers.forEach(v => {
        console.log(`  - ${v.voucher_type}: ${v.count}`);
      });
    } else {
      console.log('✗ No vouchers found');
    }
    
    // Check ledgers
    console.log('\n📋 Checking Ledgers...');
    const [ledgers] = await connection.query(
      'SELECT COUNT(*) as count FROM ledgers'
    );
    console.log(`✓ Total ledgers: ${ledgers[0].count}`);
    
    // Check inventory
    console.log('\n📋 Checking Inventory Items...');
    const [items] = await connection.query(
      'SELECT COUNT(*) as count FROM inventory_items'
    );
    console.log(`✓ Total inventory items: ${items[0].count}`);
    
    // Check GSTIN
    console.log('\n📋 Checking GSTIN Records...');
    const [gstins] = await connection.query(
      'SELECT gstin, legal_name, state FROM gstins'
    );
    
    if (gstins.length > 0) {
      console.log('✓ GSTIN records found:');
      gstins.forEach(g => {
        console.log(`  - ${g.gstin} - ${g.legal_name} (${g.state})`);
      });
    } else {
      console.log('✗ No GSTIN records found');
    }
    
    // Check TDS
    console.log('\n📋 Checking TDS Details...');
    const [tds] = await connection.query(
      'SELECT tds_section, COUNT(*) as count FROM tds_details GROUP BY tds_section'
    );
    
    if (tds.length > 0) {
      console.log('✓ TDS entries found:');
      tds.forEach(t => {
        console.log(`  - Section ${t.tds_section}: ${t.count}`);
      });
    } else {
      console.log('✗ No TDS entries found');
    }
    
    // Check warehouses
    console.log('\n📋 Checking Warehouses...');
    const [warehouses] = await connection.query(
      'SELECT warehouse_name, city FROM warehouses'
    );
    
    if (warehouses.length > 0) {
      console.log('✓ Warehouses found:');
      warehouses.forEach(w => {
        console.log(`  - ${w.warehouse_name} (${w.city})`);
      });
    } else {
      console.log('✗ No warehouses found');
    }
    
    // Check users in tenant database
    console.log('\n📋 Checking Users in Tenant Database...');
    const [users] = await connection.query(
      'SELECT id, email, role, tenant_id FROM users'
    );
    
    if (users.length > 0) {
      console.log('✓ Users found:');
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.role}) - tenant_id: ${u.tenant_id}`);
      });
    } else {
      console.log('✗ No users found in tenant database');
    }
    
    await connection.end();
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

verifyTestData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
