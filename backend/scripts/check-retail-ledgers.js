/**
 * Check Retail Ledgers
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkRetailLedgers() {
  console.log('🔍 Checking Retail Ledgers...\n');
  
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
    
    const [ledgers] = await connection.query(
      'SELECT ledger_code, ledger_name, is_system_generated FROM ledgers ORDER BY ledger_code'
    );
    
    console.log(`Found ${ledgers.length} ledgers:\n`);
    ledgers.forEach(ledger => {
      const sys = ledger.is_system_generated ? '[SYSTEM]' : '';
      console.log(`  ${ledger.ledger_code.padEnd(15)} - ${ledger.ledger_name} ${sys}`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

checkRetailLedgers()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
