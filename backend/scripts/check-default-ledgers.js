require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDefaultLedgers() {
  console.log('🔍 Checking Default Ledgers in finvera_trader_test...\n');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'finvera_trader_test',
    });
    
    // Check for default system ledgers
    const defaultLedgers = [
      'CASH-001',
      'BANK-001',
      'SAL-001',
      'PUR-001',
      'CAP-001',
      'INV-001',
      'CGST-INPUT',
      'SGST-INPUT',
      'IGST-INPUT',
      'CGST-OUTPUT',
      'SGST-OUTPUT',
      'IGST-OUTPUT',
    ];
    
    console.log('📋 Checking for default system ledgers:\n');
    
    let foundCount = 0;
    let missingCount = 0;
    const missingLedgers = [];
    
    for (const code of defaultLedgers) {
      const [ledgers] = await connection.query(
        'SELECT id, ledger_code, ledger_name, is_system_generated FROM ledgers WHERE ledger_code = ?',
        [code]
      );
      
      if (ledgers.length > 0) {
        console.log(`  ✅ ${code} - ${ledgers[0].ledger_name} ${ledgers[0].is_system_generated ? '(System)' : ''}`);
        foundCount++;
      } else {
        console.log(`  ❌ ${code} - MISSING`);
        missingCount++;
        missingLedgers.push(code);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  - Found: ${foundCount}/${defaultLedgers.length}`);
    console.log(`  - Missing: ${missingCount}/${defaultLedgers.length}`);
    
    if (missingCount > 0) {
      console.log(`\n⚠️  Missing ledgers: ${missingLedgers.join(', ')}`);
      console.log('\n💡 Solution: Run the tenant seeder to create default ledgers:');
      console.log('   npx sequelize-cli db:seed --seed 001-tenant-seeder.js');
    }
    
    // Check all ledgers
    console.log('\n📋 All ledgers in database:');
    const [allLedgers] = await connection.query(
      'SELECT ledger_code, ledger_name, is_system_generated FROM ledgers ORDER BY ledger_code'
    );
    
    console.log(`\n  Total ledgers: ${allLedgers.length}`);
    allLedgers.forEach(l => {
      console.log(`  - ${l.ledger_code}: ${l.ledger_name} ${l.is_system_generated ? '(System)' : ''}`);
    });
    
    await connection.end();
    
    console.log('\n✅ Check complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkDefaultLedgers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
