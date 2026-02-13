require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkCompanyDbConfig() {
  console.log('🔍 Checking Company Database Configuration...\n');
  
  try {
    const masterConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.MASTER_DB_NAME || 'finvera_master',
    });
    
    // Get company details
    const [companies] = await masterConnection.query(
      `SELECT c.id, c.company_name, c.tenant_id, c.db_name, c.db_host, c.db_port, c.db_provisioned,
              t.subdomain, t.db_name as tenant_db_name
       FROM companies c
       LEFT JOIN tenant_master t ON c.tenant_id = t.id
       WHERE c.company_name = 'Test Trader Company Pvt Ltd'`
    );
    
    if (companies.length === 0) {
      console.log('✗ Company not found');
      await masterConnection.end();
      return;
    }
    
    const company = companies[0];
    
    console.log('📋 Company Configuration:');
    console.log(`  - Company ID: ${company.id}`);
    console.log(`  - Company Name: ${company.company_name}`);
    console.log(`  - Tenant ID: ${company.tenant_id}`);
    console.log(`  - Subdomain: ${company.subdomain}`);
    console.log(`  - DB Provisioned: ${company.db_provisioned ? '✅ TRUE' : '❌ FALSE'}`);
    console.log(`  - Company DB Name: ${company.db_name || '❌ NOT SET'}`);
    console.log(`  - Tenant DB Name: ${company.tenant_db_name || '❌ NOT SET'}`);
    console.log(`  - DB Host: ${company.db_host || '❌ NOT SET'}`);
    console.log(`  - DB Port: ${company.db_port || '❌ NOT SET'}`);
    
    // Check if databases match
    console.log('\n📋 Database Matching:');
    if (company.db_name === 'finvera_trader_test') {
      console.log('  ✅ Company db_name matches test database');
    } else {
      console.log(`  ❌ Company db_name (${company.db_name}) does NOT match finvera_trader_test`);
    }
    
    if (company.tenant_db_name === 'finvera_trader_test') {
      console.log('  ✅ Tenant db_name matches test database');
    } else {
      console.log(`  ❌ Tenant db_name (${company.tenant_db_name}) does NOT match finvera_trader_test`);
    }
    
    // Test connection to the database
    if (company.db_name) {
      console.log(`\n📋 Testing Connection to ${company.db_name}...`);
      try {
        const testConnection = await mysql.createConnection({
          host: company.db_host || process.env.DB_HOST || 'localhost',
          port: company.db_port || process.env.DB_PORT || 3306,
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          database: company.db_name,
        });
        
        const [tables] = await testConnection.query('SHOW TABLES');
        console.log(`  ✅ Connection successful! Found ${tables.length} tables`);
        
        // Check for key tables
        const tableNames = tables.map(t => Object.values(t)[0]);
        const keyTables = ['vouchers', 'ledgers', 'inventory_items', 'gstins'];
        
        console.log('\n  Key Tables:');
        keyTables.forEach(table => {
          if (tableNames.includes(table)) {
            console.log(`    ✅ ${table}`);
          } else {
            console.log(`    ❌ ${table} - MISSING`);
          }
        });
        
        await testConnection.end();
      } catch (connError) {
        console.log(`  ❌ Connection failed: ${connError.message}`);
      }
    }
    
    await masterConnection.end();
    
    console.log('\n✅ Check complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkCompanyDbConfig()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
