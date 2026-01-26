#!/usr/bin/env node

/**
 * Simple test script to verify API responses have correct structure
 * Run with: node test-api-responses.js
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

// Test configuration
const testConfig = {
  // Add your test token here if needed
  token: process.env.TEST_TOKEN || '',
  tenantId: process.env.TEST_TENANT_ID || '',
  companyId: process.env.TEST_COMPANY_ID || ''
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    ...(testConfig.token && { 'Authorization': `Bearer ${testConfig.token}` }),
    ...(testConfig.companyId && { 'x-company-id': testConfig.companyId })
  }
});

// Test endpoints
const testEndpoints = [
  {
    name: 'Inventory Items',
    url: '/accounting/inventory/items',
    method: 'GET',
    params: { limit: 5 }
  },
  {
    name: 'Stock Transfers',
    url: '/accounting/stock-transfers',
    method: 'GET',
    params: { limit: 5 }
  },
  {
    name: 'Warehouses',
    url: '/accounting/warehouses',
    method: 'GET',
    params: { limit: 5 }
  },
  {
    name: 'TDS Details',
    url: '/tds',
    method: 'GET',
    params: { limit: 5 }
  }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🧪 Testing ${endpoint.name}...`);
    console.log(`   URL: ${endpoint.method} ${endpoint.url}`);
    
    const response = await apiClient({
      method: endpoint.method,
      url: endpoint.url,
      params: endpoint.params
    });

    // Check response structure
    const data = response.data;
    const hasData = data && typeof data === 'object';
    const hasDataArray = hasData && (Array.isArray(data.data) || Array.isArray(data.items) || Array.isArray(data.transfers));
    const hasPagination = hasData && data.pagination && typeof data.pagination === 'object';

    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   ✅ Has response data: ${hasData}`);
    console.log(`   ✅ Has data array: ${hasDataArray}`);
    console.log(`   ✅ Has pagination: ${hasPagination}`);
    
    if (hasDataArray) {
      const dataArray = data.data || data.items || data.transfers || [];
      console.log(`   📊 Records count: ${dataArray.length}`);
    }

    if (hasPagination) {
      console.log(`   📄 Pagination: page ${data.pagination.page}, total ${data.pagination.total}`);
    }

    return { success: true, endpoint: endpoint.name };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`   📝 Response status: ${error.response.status}`);
      console.log(`   📝 Response data:`, error.response.data);
    }
    return { success: false, endpoint: endpoint.name, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting API Response Structure Tests');
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  
  if (!testConfig.token) {
    console.log('⚠️  No test token provided. Some endpoints may fail with 401.');
    console.log('   Set TEST_TOKEN environment variable for authenticated tests.');
  }

  const results = [];
  
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }

  // Summary
  console.log('\n📊 Test Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.endpoint}: ${r.error}`);
    });
  }

  console.log('\n🏁 Tests completed!');
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});