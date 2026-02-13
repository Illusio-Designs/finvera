require('dotenv').config();
const mysql = require('mysql2/promise');

async function clearTestData() {
  console.log('🧹 Clearing test data from finvera_trader_test...\n');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'finvera_trader_test',
  });

  try {
    // Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Clear all data tables
    const tables = [
      'tds_details',
      'voucher_ledger_entries',
      'voucher_items',
      'vouchers',
      'warehouse_stocks',
      'stock_movements',
      'warehouses',
      'inventory_items',
      'ledgers',
      'gstins',
      'users',
    ];
    
    for (const table of tables) {
      await connection.query(`DELETE FROM ${table}`);
      console.log(`✓ Cleared ${table}`);
    }
    
    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\n✅ All test data cleared successfully!');
    
  } catch (error) {
    console.error('\n❌ Error clearing test data:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

clearTestData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
