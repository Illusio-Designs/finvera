require('dotenv').config();
const mysql = require('mysql2/promise');

async function verifyUserCompany() {
  console.log('🔍 Verifying User and Company Setup...\n');
  
  try {
    // Connect to admin database (finvera_db)
    const adminConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.ADMIN_DB_NAME || 'finvera_db',
    });
    
    // Connect to master database
    const masterConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.MASTER_DB_NAME || 'finvera_master',
    });
    
    // Check user in finvera_db
    console.log('📋 Checking user in finvera_db...');
    const [users] = await adminConnection.query(
      'SELECT id, email, role, createdAt FROM users WHERE email = ?',
      ['admin@tradertest.com']
    );
    
    if (users.length > 0) {
      console.log('✓ User found in finvera_db:');
      console.log(`  - ID: ${users[0].id}`);
      console.log(`  - Email: ${users[0].email}`);
      console.log(`  - Role: ${users[0].role}`);
      console.log(`  - Created: ${users[0].createdAt}`);
    } else {
      console.log('✗ User NOT found in finvera_db');
    }
    
    // Check tenant in finvera_master
    console.log('\n📋 Checking tenant in finvera_master...');
    const [tenants] = await masterConnection.query(
      'SELECT id, company_name, subdomain, email FROM tenant_master WHERE email = ?',
      ['admin@tradertest.com']
    );
    
    if (tenants.length > 0) {
      console.log('✓ Tenant found in finvera_master:');
      console.log(`  - ID: ${tenants[0].id}`);
      console.log(`  - Company: ${tenants[0].company_name}`);
      console.log(`  - Subdomain: ${tenants[0].subdomain}`);
      
      const tenantId = tenants[0].id;
      
      // Check companies for this tenant
      console.log('\n📋 Checking companies for this tenant...');
      const [companies] = await masterConnection.query(
        'SELECT id, company_name, company_type, is_active, db_provisioned, created_by_user_id FROM companies WHERE tenant_id = ?',
        [tenantId]
      );
      
      if (companies.length > 0) {
        console.log(`✓ Found ${companies.length} company(ies):`);
        companies.forEach((company, index) => {
          console.log(`\n  Company ${index + 1}:`);
          console.log(`    - ID: ${company.id}`);
          console.log(`    - Name: ${company.company_name}`);
          console.log(`    - Type: ${company.company_type}`);
          console.log(`    - Active: ${company.is_active}`);
          console.log(`    - DB Provisioned: ${company.db_provisioned}`);
          console.log(`    - Created By User ID: ${company.created_by_user_id}`);
        });
      } else {
        console.log('✗ No companies found for this tenant');
      }
    } else {
      console.log('✗ Tenant NOT found in finvera_master');
    }
    
    await adminConnection.end();
    await masterConnection.end();
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

verifyUserCompany()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
