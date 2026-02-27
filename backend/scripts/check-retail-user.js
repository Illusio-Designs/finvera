/**
 * Check Retail Test User and Company Setup
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkRetailUser() {
  console.log('🔍 Checking Retail Test User Setup...\n');
  
  try {
    // Connect to admin database
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
    
    console.log('📋 Checking admin database (finvera_db)...');
    const [adminUsers] = await adminConnection.query(
      'SELECT id, email, name, role, is_active FROM users WHERE email = ?',
      ['admin@retailtest.com']
    );
    
    if (adminUsers.length > 0) {
      console.log('✓ User found in admin database:');
      adminUsers.forEach(user => {
        console.log(`  - ID: ${user.id}`);
        console.log(`  - Email: ${user.email}`);
        console.log(`  - Name: ${user.name}`);
        console.log(`  - Role: ${user.role}`);
        console.log(`  - Active: ${user.is_active}`);
      });
    } else {
      console.log('❌ User NOT found in admin database');
    }

    
    console.log('\n📋 Checking master database (finvera_master)...');
    
    // Check tenant_master
    const [tenants] = await masterConnection.query(
      'SELECT id, company_name, subdomain, email, db_name, is_active FROM tenant_master WHERE email = ?',
      ['admin@retailtest.com']
    );
    
    if (tenants.length > 0) {
      console.log('✓ Tenant found:');
      tenants.forEach(tenant => {
        console.log(`  - ID: ${tenant.id}`);
        console.log(`  - Company: ${tenant.company_name}`);
        console.log(`  - Subdomain: ${tenant.subdomain}`);
        console.log(`  - DB Name: ${tenant.db_name}`);
        console.log(`  - Active: ${tenant.is_active}`);
        
        // Check companies for this tenant
        masterConnection.query(
          'SELECT id, company_name, business_type, is_active, db_provisioned FROM companies WHERE tenant_id = ?',
          [tenant.id]
        ).then(([companies]) => {
          if (companies.length > 0) {
            console.log('\n✓ Companies found:');
            companies.forEach(company => {
              console.log(`  - ID: ${company.id}`);
              console.log(`  - Name: ${company.company_name}`);
              console.log(`  - Business Type: ${company.business_type || 'NOT SET'}`);
              console.log(`  - Active: ${company.is_active}`);
              console.log(`  - DB Provisioned: ${company.db_provisioned}`);
            });
          } else {
            console.log('\n❌ NO companies found for this tenant');
          }
        });
      });
    } else {
      console.log('❌ Tenant NOT found');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await adminConnection.end();
    await masterConnection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

checkRetailUser()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
