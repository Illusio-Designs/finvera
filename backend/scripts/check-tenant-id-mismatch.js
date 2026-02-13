require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkTenantIdMismatch() {
  console.log('🔍 Checking Tenant ID Consistency...\n');
  
  try {
    // Connect to master database
    const masterConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.MASTER_DB_NAME || 'finvera_master',
    });
    
    // Get tenant info
    const [tenants] = await masterConnection.query(
      'SELECT id, subdomain, db_name FROM tenant_master WHERE subdomain = ?',
      ['trader-test']
    );
    
    if (tenants.length === 0) {
      console.log('✗ Tenant not found');
      await masterConnection.end();
      return;
    }
    
    const tenant = tenants[0];
    console.log('📋 Tenant Information:');
    console.log(`  - Tenant ID (UUID): ${tenant.id}`);
    console.log(`  - Subdomain: ${tenant.subdomain}`);
    console.log(`  - DB Name: ${tenant.db_name}`);
    
    await masterConnection.end();
    
    // Connect to tenant database
    const tenantConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'finvera_trader_test',
    });
    
    // Check tenant_id in various tables
    console.log('\n📋 Checking tenant_id in tables:');
    
    const tables = ['vouchers', 'ledgers', 'users', 'gstins', 'warehouses'];
    
    for (const table of tables) {
      try {
        const [rows] = await tenantConnection.query(
          `SELECT DISTINCT tenant_id, COUNT(*) as count FROM ${table} GROUP BY tenant_id`
        );
        
        if (rows.length > 0) {
          console.log(`\n  ${table}:`);
          rows.forEach(row => {
            const matches = row.tenant_id === tenant.id;
            console.log(`    - tenant_id: ${row.tenant_id} (${row.count} rows) ${matches ? '✅ MATCHES' : '❌ MISMATCH'}`);
          });
        } else {
          console.log(`\n  ${table}: No data`);
        }
      } catch (err) {
        console.log(`\n  ${table}: Error - ${err.message}`);
      }
    }
    
    // Check if we need to update tenant_id
    const [voucherCheck] = await tenantConnection.query(
      'SELECT DISTINCT tenant_id FROM vouchers LIMIT 1'
    );
    
    if (voucherCheck.length > 0 && voucherCheck[0].tenant_id !== tenant.id) {
      console.log('\n⚠️  TENANT ID MISMATCH DETECTED!');
      console.log(`   Expected: ${tenant.id}`);
      console.log(`   Found: ${voucherCheck[0].tenant_id}`);
      console.log('\n   Run the fix script to update tenant_id in all tables.');
    } else {
      console.log('\n✅ Tenant IDs match correctly!');
    }
    
    await tenantConnection.end();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkTenantIdMismatch()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
