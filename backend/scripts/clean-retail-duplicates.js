/**
 * Clean Duplicate Data in Retail Database
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function cleanRetailDuplicates() {
  console.log('🧹 Cleaning Duplicate Data...\n');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'finvera_retail_test',
  });

  try {
    const masterConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.MASTER_DB_NAME || 'finvera_master',
    });
    
    const [tenants] = await masterConnection.query(
      'SELECT id FROM tenant_master WHERE email = ?',
      ['admin@retailtest.com']
    );
    
    const tenantId = tenants[0].id;
    await masterConnection.end();
    
    console.log('📋 Cleaning vouchers and related data...');
    await connection.query('DELETE FROM voucher_ledger_entries');
    await connection.query('DELETE FROM voucher_items');
    await connection.query('DELETE FROM vouchers');
    console.log('   ✓ Cleared all vouchers');
    
    console.log('\n📋 Cleaning inventory units...');
    await connection.query('DELETE FROM inventory_units');
    console.log('   ✓ Cleared all inventory units');
    
    console.log('\n📋 Resetting inventory quantities...');
    await connection.query('UPDATE inventory_items SET quantity_on_hand = 0, avg_cost = purchase_price');
    console.log('   ✓ Reset inventory quantities');
    
    console.log('\n📋 Removing duplicate suppliers...');
    
    // Keep only one of each supplier
    const supplierNames = ['Electronics Wholesale Pvt Ltd', 'Tech Distributors India', 'Mobile Accessories Hub'];
    
    for (const name of supplierNames) {
      const [suppliers] = await connection.query(
        'SELECT id FROM ledgers WHERE ledger_name = ? ORDER BY createdAt',
        [name]
      );
      
      if (suppliers.length > 1) {
        // Keep the first one, delete the rest
        const idsToDelete = suppliers.slice(1).map(s => s.id);
        if (idsToDelete.length > 0) {
          await connection.query(
            `DELETE FROM ledgers WHERE id IN (${idsToDelete.map(() => '?').join(',')})`,
            idsToDelete
          );
          console.log(`   ✓ Removed ${idsToDelete.length} duplicate(s) of ${name}`);
        }
      }
    }
    
    await connection.end();
    
    console.log('\n✅ Cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

cleanRetailDuplicates()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
