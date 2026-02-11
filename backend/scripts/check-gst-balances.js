require('dotenv').config();
const { Sequelize } = require('sequelize');

// Connect to master database
const masterDb = new Sequelize(
  process.env.MASTER_DB_NAME || 'finvera_master',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

async function checkGSTBalances() {
  try {
    console.log('🔍 Checking GST Balances...\n');

    // Get tenant database name
    const [tenants] = await masterDb.query(`
      SELECT db_name, company_name 
      FROM tenant_master 
      WHERE id = '9894a8b8-4013-4a46-af08-fdba36329ea8'
    `);

    if (tenants.length === 0) {
      console.log('❌ Tenant not found');
      return;
    }

    const tenant = tenants[0];
    console.log(`📊 Checking GST for: ${tenant.company_name}\n`);

    // Connect to tenant database
    const tenantDb = new Sequelize(
      tenant.db_name,
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
      }
    );

    // Get all GST ledgers
    const [gstLedgers] = await tenantDb.query(`
      SELECT ledger_name, ledger_code, current_balance, balance_type
      FROM ledgers
      WHERE ledger_code IN (
        'CGST-INPUT', 'SGST-INPUT', 'IGST-INPUT',
        'CGST-OUTPUT', 'SGST-OUTPUT', 'IGST-OUTPUT'
      )
      AND is_active = 1
    `);

    console.log('📊 GST Ledger Balances:\n');
    
    let totalInputGST = 0;
    let totalOutputGST = 0;

    gstLedgers.forEach(ledger => {
      const balance = parseFloat(ledger.current_balance || 0);
      const balanceType = ledger.balance_type || 'debit';
      
      console.log(`${ledger.ledger_name} (${ledger.ledger_code})`);
      console.log(`  Balance: ₹${balance.toFixed(2)} ${balanceType}`);
      console.log(`  Balance Type: ${balanceType}`);
      
      if (ledger.ledger_code.includes('INPUT')) {
        // Input GST should be Debit (Asset)
        if (balanceType === 'debit') {
          totalInputGST += balance;
          console.log(`  ✓ Correct: Input GST with Debit balance (Asset)`);
        } else {
          totalInputGST -= balance;
          console.log(`  ⚠️  Warning: Input GST with Credit balance`);
        }
      } else if (ledger.ledger_code.includes('OUTPUT')) {
        // Output GST should be Credit (Liability)
        if (balanceType === 'credit') {
          totalOutputGST += balance;
          console.log(`  ✓ Correct: Output GST with Credit balance (Liability)`);
        } else {
          totalOutputGST -= balance;
          console.log(`  ⚠️  Warning: Output GST with Debit balance`);
        }
      }
      console.log('');
    });

    console.log('📈 Summary:');
    console.log(`  Total Input GST (Asset):     ₹${totalInputGST.toFixed(2)} Dr`);
    console.log(`  Total Output GST (Liability): ₹${totalOutputGST.toFixed(2)} Cr`);
    console.log('');
    
    const netGST = totalOutputGST - totalInputGST;
    if (netGST > 0) {
      console.log(`  Net GST Payable: ₹${netGST.toFixed(2)} (You owe to government)`);
    } else if (netGST < 0) {
      console.log(`  Net GST Receivable: ₹${Math.abs(netGST).toFixed(2)} (Government owes you)`);
    } else {
      console.log(`  Net GST: ₹0.00 (Balanced)`);
    }

    await tenantDb.close();
    await masterDb.close();

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkGSTBalances();
