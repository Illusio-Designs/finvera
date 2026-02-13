require('dotenv').config();
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function createDefaultLedgers() {
  console.log('🔧 Creating Default System Ledgers...\n');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'finvera_trader_test',
    });
    
    // Get master connection for account groups
    const masterConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.MASTER_DB_NAME || 'finvera_master',
    });
    
    // Get account group IDs
    const [accountGroups] = await masterConnection.query(
      'SELECT id, group_code FROM account_groups WHERE group_code IN (?, ?, ?, ?, ?, ?, ?, ?)',
      ['CASH', 'BANK', 'SAL', 'PUR', 'CAP', 'INV', 'CA', 'DT']
    );
    
    const groupMap = {};
    accountGroups.forEach(g => {
      groupMap[g.group_code] = g.id;
    });
    
    await masterConnection.end();
    
    const now = new Date();
    const TENANT_ID = 'test-tenant-001';
    
    // Define default ledgers
    const defaultLedgers = [
      { code: 'CASH-001', name: 'Cash on Hand', group: 'CASH', balance: 'Dr', system: true },
      { code: 'BANK-001', name: 'Bank Account', group: 'BANK', balance: 'Dr', system: true },
      { code: 'SAL-001', name: 'Sales', group: 'SAL', balance: 'Cr', system: true },
      { code: 'PUR-001', name: 'Purchase', group: 'PUR', balance: 'Dr', system: true },
      { code: 'CAP-001', name: 'Capital Account', group: 'CAP', balance: 'Cr', system: true },
      { code: 'INV-001', name: 'Stock in Hand', group: 'INV', balance: 'Dr', system: true },
      // Input GST (Asset - Tax Credit)
      { code: 'CGST-INPUT', name: 'Input CGST', group: 'CA', balance: 'Dr', system: true },
      { code: 'SGST-INPUT', name: 'Input SGST', group: 'CA', balance: 'Dr', system: true },
      { code: 'IGST-INPUT', name: 'Input IGST', group: 'CA', balance: 'Dr', system: true },
      // Output GST (Liability - Tax Payable)
      { code: 'CGST-OUTPUT', name: 'Output CGST', group: 'DT', balance: 'Cr', system: true },
      { code: 'SGST-OUTPUT', name: 'Output SGST', group: 'DT', balance: 'Cr', system: true },
      { code: 'IGST-OUTPUT', name: 'Output IGST', group: 'DT', balance: 'Cr', system: true },
      // TDS Ledgers
      { code: 'TDS-PAYABLE', name: 'TDS Payable', group: 'DT', balance: 'Cr', system: true },
      { code: 'TDS-RECEIVABLE', name: 'TDS Receivable', group: 'CA', balance: 'Dr', system: true },
    ];
    
    console.log('📋 Creating default ledgers:\n');
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const ledger of defaultLedgers) {
      // Check if ledger already exists
      const [existing] = await connection.query(
        'SELECT id FROM ledgers WHERE ledger_code = ?',
        [ledger.code]
      );
      
      if (existing.length > 0) {
        console.log(`  ⏭️  ${ledger.code} - ${ledger.name} (already exists)`);
        skippedCount++;
        continue;
      }
      
      const groupId = groupMap[ledger.group];
      if (!groupId) {
        console.log(`  ❌ ${ledger.code} - ${ledger.name} (group ${ledger.group} not found)`);
        continue;
      }
      
      // Create ledger
      await connection.query(
        `INSERT INTO ledgers (id, ledger_code, ledger_name, account_group_id, opening_balance,
         opening_balance_type, balance_type, current_balance, is_system_generated, is_active,
         tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 0, ?, ?, 0, ?, true, ?, ?, ?)`,
        [
          uuidv4(),
          ledger.code,
          ledger.name,
          groupId,
          ledger.balance,
          ledger.balance === 'Dr' ? 'debit' : 'credit',
          ledger.system,
          TENANT_ID,
          now,
          now,
        ]
      );
      
      console.log(`  ✅ ${ledger.code} - ${ledger.name}`);
      createdCount++;
    }
    
    await connection.end();
    
    console.log(`\n📊 Summary:`);
    console.log(`  - Created: ${createdCount}`);
    console.log(`  - Skipped: ${skippedCount}`);
    console.log(`  - Total: ${defaultLedgers.length}`);
    
    console.log('\n✅ Default ledgers created successfully!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

createDefaultLedgers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
