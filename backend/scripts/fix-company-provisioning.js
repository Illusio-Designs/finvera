require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixCompanyProvisioning() {
  console.log('🔧 Fixing Company Provisioning Status...\n');
  
  try {
    // Connect to master database
    const masterConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.MASTER_DB_NAME || 'finvera_master',
    });
    
    // Update company to set db_provisioned = true
    const [result] = await masterConnection.query(
      `UPDATE companies 
       SET db_provisioned = true, 
           db_name = ?, 
           db_host = ?, 
           db_port = ?
       WHERE company_name = 'Test Trader Company Pvt Ltd'`,
      [
        'finvera_trader_test',
        process.env.DB_HOST || 'localhost',
        parseInt(process.env.DB_PORT) || 3306
      ]
    );
    
    console.log(`✓ Updated ${result.affectedRows} company record(s)`);
    console.log('  - Set db_provisioned = true');
    console.log('  - Set db_name = finvera_trader_test');
    console.log(`  - Set db_host = ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  - Set db_port = ${process.env.DB_PORT || 3306}`);
    
    await masterConnection.end();
    
    console.log('\n✅ Company provisioning status fixed!');
    console.log('\nYou can now login with:');
    console.log('  Email: admin@tradertest.com');
    console.log('  Password: Admin@123');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

fixCompanyProvisioning()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
