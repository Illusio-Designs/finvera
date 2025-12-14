require('dotenv').config();
const masterModels = require('./src/models/masterModels');
const TenantMaster = masterModels.TenantMaster;
const axios = require('axios');

async function testTenants() {
  console.log('\n🔍 Testing Tenants...\n');

  // Test 1: Check database directly
  console.log('1️⃣  Checking database...');
  try {
    console.log('   TenantMaster model:', typeof TenantMaster);
    console.log('   TenantMaster methods:', Object.keys(TenantMaster).slice(0, 10));
    
    const tenants = await TenantMaster.findAll();
    console.log(`   Found ${tenants.length} tenant(s) in database`);
    
    if (tenants.length > 0) {
      console.log('\n   Tenant details:');
      tenants.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.company_name} (${t.subdomain})`);
        console.log(`      Email: ${t.email}`);
        console.log(`      Active: ${t.is_active}`);
        console.log(`      DB: ${t.db_name}`);
      });
    } else {
      console.log('   ⚠️  No tenants found!');
      console.log('   Run: npm start (seeders should create System tenant)');
    }
  } catch (error) {
    console.error('   ❌ Database error:', error.message);
    console.error('   Stack:', error.stack);
  }

  // Test 2: Check API endpoint
  console.log('\n2️⃣  Testing API endpoint...');
  try {
    const response = await axios.get('http://localhost:3000/api/admin/tenants', {
      params: { page: 1, limit: 20 },
      headers: {
        'Authorization': 'Bearer test-token', // You'll need a real token
      },
      validateStatus: () => true, // Don't throw on any status
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('   ⚠️  Server not running on port 3000');
      console.log('   Start server: npm start');
    } else {
      console.error('   ❌ API error:', error.message);
    }
  }

  console.log('\n✅ Test complete\n');
  process.exit(0);
}

testTenants().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
