/**
 * Simple connection test script
 * Run with: node test-connection.js
 */

const http = require('http');

const API_URL = 'http://192.168.0.102:3000';

console.log('🔍 Testing connection to backend...\n');
console.log(`📡 API URL: ${API_URL}`);
console.log('');

// Test 1: Health endpoint
console.log('Test 1: Health Check');
console.log('-------------------');

http.get(`${API_URL}/health`, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`✅ Response: ${data}`);
    console.log('');
    
    // Test 2: Auth endpoint
    testAuthEndpoint();
  });
}).on('error', (err) => {
  console.log(`❌ Error: ${err.message}`);
  console.log('');
  console.log('Possible issues:');
  console.log('1. Backend server is not running');
  console.log('2. Firewall is blocking the connection');
  console.log('3. IP address is incorrect');
  console.log('');
  console.log('Solutions:');
  console.log('1. Start backend: cd backend && npm start');
  console.log('2. Check firewall settings');
  console.log('3. Verify IP with: ipconfig (Windows) or ifconfig (Mac/Linux)');
});

function testAuthEndpoint() {
  console.log('Test 2: Auth Endpoint');
  console.log('-------------------');
  
  const postData = JSON.stringify({
    email: 'test@example.com',
    password: 'test123'
  });
  
  const options = {
    hostname: '192.168.0.102',
    port: 3000,
    path: '/api/auth/authenticate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ Status: ${res.statusCode}`);
      console.log(`✅ Response: ${data.substring(0, 200)}...`);
      console.log('');
      console.log('✅ Backend is accessible and responding!');
      console.log('');
      console.log('If mobile app still fails:');
      console.log('1. Ensure device and computer are on same WiFi');
      console.log('2. Restart Expo server: npm start -- --clear');
      console.log('3. Reload app on device');
      console.log('4. Check Android network security config');
    });
  });
  
  req.on('error', (err) => {
    console.log(`❌ Error: ${err.message}`);
  });
  
  req.write(postData);
  req.end();
}
