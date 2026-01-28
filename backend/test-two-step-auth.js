const axios = require('axios');

// Test the new two-step authentication flow
async function testTwoStepAuth() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🧪 Testing Two-Step Authentication Flow...\n');
    
    // Step 1: Authenticate user and get companies
    console.log('1. Testing authentication step...');
    try {
      const authResponse = await axios.post(`${baseURL}/api/auth/authenticate`, {
        email: 'test@example.com', // Replace with actual test email
        password: 'testpassword'    // Replace with actual test password
      });
      
      console.log('✅ Authentication successful!');
      console.log('👤 User:', authResponse.data.user?.email);
      console.log('🏢 Companies found:', authResponse.data.companies?.length || 0);
      console.log('🔄 Requires company selection:', authResponse.data.requiresCompanySelection);
      
      if (authResponse.data.companies?.length > 0) {
        console.log('📋 Available companies:');
        authResponse.data.companies.forEach((company, index) => {
          console.log(`   ${index + 1}. ${company.company_name} (ID: ${company.id})`);
        });
        
        // Step 2: Complete login with company selection
        const firstCompany = authResponse.data.companies[0];
        console.log(`\n2. Testing login completion with company: ${firstCompany.company_name}...`);
        
        try {
          const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
            authenticated_user_id: authResponse.data.user.id,
            company_id: firstCompany.id
          });
          
          console.log('✅ Login completed successfully!');
          console.log('👤 User:', loginResponse.data.user?.email);
          console.log('🏢 Company:', loginResponse.data.user?.company_name);
          console.log('🔑 Has Token:', !!loginResponse.data.accessToken);
          
        } catch (loginError) {
          console.log('❌ Login completion failed:', loginError.response?.data || loginError.message);
        }
      } else {
        console.log('ℹ️  No companies found for user');
      }
      
    } catch (authError) {
      if (authError.response?.status === 401) {
        console.log('❌ Authentication failed: Invalid credentials');
      } else {
        console.log('❌ Authentication error:', authError.response?.data || authError.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Test setup error:', error.message);
  }
}

// Test backward compatibility with old login flow
async function testBackwardCompatibility() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('\n🧪 Testing Backward Compatibility...\n');
    
    console.log('Testing old login flow (should still work)...');
    try {
      const response = await axios.post(`${baseURL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'testpassword'
      });
      
      console.log('✅ Backward compatibility works!');
      console.log('👤 User:', response.data.user?.email);
      console.log('🏢 Company:', response.data.user?.company_name);
      
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.require_company) {
        console.log('✅ Backward compatibility works (company selection required)');
        console.log('📋 Companies:', error.response.data.companies?.length || 0);
      } else {
        console.log('❌ Backward compatibility error:', error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Backward compatibility test error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Testing Enhanced Authentication System\n');
  console.log('⚠️  Make sure to replace test credentials with actual ones!\n');
  
  await testTwoStepAuth();
  await testBackwardCompatibility();
  
  console.log('\n✨ Tests completed!');
  console.log('\n📝 Notes:');
  console.log('   - Replace test@example.com and testpassword with real credentials');
  console.log('   - Make sure the backend server is running on localhost:3000');
  console.log('   - Ensure the user has multiple companies for proper testing');
  console.log('   - The new flow: authenticate → get companies → select company → complete login');
}

runTests().catch(console.error);