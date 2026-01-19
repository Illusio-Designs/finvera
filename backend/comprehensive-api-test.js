#!/usr/bin/env node

/**
 * Comprehensive API Testing Script
 * Tests ALL backend APIs one by one and stores responses
 * Maintains proper flow and sequence
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';
let testData = {
  accessToken: '',
  refreshToken: '',
  userId: '',
  tenantId: '',
  companyId: '',
  branchId: '',
  ledgerId: '',
  voucherTypeId: '',
  voucherId: '',
  itemId: '',
  warehouseId: '',
  ticketId: '',
  notificationId: '',
  planId: ''
};

let testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    startTime: new Date().toISOString(),
    endTime: null
  },
  tests: []
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, useAuth = false, description = '') {
  const testStart = Date.now();
  const testInfo = {
    method,
    endpoint,
    description,
    timestamp: new Date().toISOString(),
    success: false,
    status: null,
    responseTime: 0,
    request: data,
    response: null,
    error: null
  };

  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: 10000,
      headers: {}
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    if (useAuth && testData.accessToken) {
      config.headers.Authorization = `Bearer ${testData.accessToken}`;
    }

    // For GET requests, don't set Content-Type
    if (method === 'GET') {
      delete config.headers['Content-Type'];
    }

    console.log(`\n🧪 ${description}`);
    console.log(`📡 ${method} ${endpoint}`);

    const response = await axios(config);
    const responseTime = Date.now() - testStart;

    testInfo.success = true;
    testInfo.status = response.status;
    testInfo.responseTime = responseTime;
    testInfo.response = response.data;

    console.log(`✅ SUCCESS (${response.status}) - ${responseTime}ms`);
    
    // Show key response data
    if (response.data) {
      const keys = Object.keys(response.data);
      console.log(`📥 Response keys: [${keys.join(', ')}]`);
      
      // Show important data briefly
      if (response.data.data) {
        const dataKeys = Object.keys(response.data.data);
        if (dataKeys.length > 0) {
          console.log(`📊 Data keys: [${dataKeys.slice(0, 5).join(', ')}${dataKeys.length > 5 ? '...' : ''}]`);
        }
      }
    }

    testResults.summary.passed++;
    return { success: true, data: response.data, status: response.status };

  } catch (error) {
    const responseTime = Date.now() - testStart;
    
    testInfo.success = false;
    testInfo.status = error.response?.status || 500;
    testInfo.responseTime = responseTime;
    testInfo.error = error.response?.data || error.message;

    console.log(`❌ FAILED (${error.response?.status || 'Network'}) - ${responseTime}ms`);
    console.log(`📥 Error: ${error.response?.data?.message || error.message}`);

    testResults.summary.failed++;
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  } finally {
    testResults.summary.total++;
    testResults.tests.push(testInfo);
  }
}

// Save test results to file
function saveResults() {
  testResults.summary.endTime = new Date().toISOString();
  const resultsFile = path.join(__dirname, 'api-test-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`\n💾 Test results saved to: ${resultsFile}`);
}

// Test Phase 1: Foundation
async function testFoundation() {
  console.log('\n🏗️  PHASE 1: FOUNDATION TESTING');
  console.log('================================');

  // 1.1 Health Check
  await apiCall('GET', '/health', null, false, 'Health Check');

  // 1.2 Register User
  const uniqueEmail = `test${Date.now()}@finvera.com`;
  const registerResult = await apiCall('POST', '/auth/register', {
    email: uniqueEmail,
    password: 'Test123456',
    full_name: 'Test User',
    phone: '9876543210'
  }, false, 'Register New User');

  if (registerResult.success) {
    testData.accessToken = registerResult.data.accessToken;
    testData.refreshToken = registerResult.data.refreshToken;
    testData.userId = registerResult.data.user?.id;
    testData.tenantId = registerResult.data.user?.tenant_id;
    console.log('🔑 Tokens and IDs saved for subsequent tests');
  }

  // 1.3 Get User Profile
  await apiCall('GET', '/auth/profile', null, true, 'Get User Profile');

  // 1.4 Refresh Token
  if (testData.refreshToken) {
    const refreshResult = await apiCall('POST', '/auth/refresh', {
      refreshToken: testData.refreshToken
    }, false, 'Refresh Access Token');

    if (refreshResult.success) {
      testData.accessToken = refreshResult.data.accessToken;
      testData.refreshToken = refreshResult.data.refreshToken;
    }
  }

  return testData.accessToken ? true : false;
}

// Test Phase 2: Company & Tenant Setup
async function testCompanySetup() {
  console.log('\n🏢 PHASE 2: COMPANY & TENANT SETUP');
  console.log('==================================');

  // 2.1 Get Tenant Profile
  await apiCall('GET', '/tenants/profile', null, true, 'Get Tenant Profile');

  // 2.2 Company Status
  await apiCall('GET', '/companies/status', null, true, 'Get Company Status');

  // 2.3 List Companies
  await apiCall('GET', '/companies', null, true, 'List Companies');

  // 2.4 Create Company
  const companyResult = await apiCall('POST', '/companies', {
    company_name: 'Test Company Ltd',
    company_code: 'TCL001',
    company_type: 'private_limited',
    address: '123 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    phone: '9876543210',
    email: 'company@test.com',
    gstin: '27ABCDE1234F1Z5',
    pan: 'ABCDE1234F'
  }, true, 'Create Company');

  if (companyResult.success && companyResult.data.data?.id) {
    testData.companyId = companyResult.data.data.id;
    console.log(`🏢 Company ID saved: ${testData.companyId}`);
  }

  // 2.5 Get Company by ID
  if (testData.companyId) {
    await apiCall('GET', `/companies/${testData.companyId}`, null, true, 'Get Company by ID');
  }

  // 2.6 Update Company
  if (testData.companyId) {
    await apiCall('PUT', `/companies/${testData.companyId}`, {
      company_name: 'Updated Test Company Ltd',
      phone: '9999999999'
    }, true, 'Update Company');
  }
}

// Test Phase 3: Branch Management
async function testBranchManagement() {
  console.log('\n🏪 PHASE 3: BRANCH MANAGEMENT');
  console.log('=============================');

  if (!testData.companyId) {
    console.log('⚠️  Skipping branch tests - no company ID');
    return;
  }

  // 3.1 List Branches by Company
  await apiCall('GET', `/branches/company/${testData.companyId}`, null, true, 'List Branches by Company');

  // 3.2 Create Branch
  const branchResult = await apiCall('POST', '/branches', {
    branch_name: 'Mumbai Branch',
    branch_code: 'MUM001',
    address: '123 Branch Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    phone: '9876543210',
    email: 'mumbai@test.com',
    company_id: testData.companyId
  }, true, 'Create Branch');

  if (branchResult.success && branchResult.data.data?.id) {
    testData.branchId = branchResult.data.data.id;
    console.log(`🏪 Branch ID saved: ${testData.branchId}`);
  }

  // 3.3 Get Branch by ID
  if (testData.branchId) {
    await apiCall('GET', `/branches/${testData.branchId}`, null, true, 'Get Branch by ID');
  }

  // 3.4 Update Branch
  if (testData.branchId) {
    await apiCall('PUT', `/branches/${testData.branchId}`, {
      branch_name: 'Updated Mumbai Branch',
      phone: '9999999999'
    }, true, 'Update Branch');
  }
}

// Test Phase 4: Accounting Foundation
async function testAccountingFoundation() {
  console.log('\n📊 PHASE 4: ACCOUNTING FOUNDATION');
  console.log('=================================');

  // 4.1 Dashboard
  await apiCall('GET', '/accounting/dashboard', null, true, 'Get Accounting Dashboard');

  // 4.2 List Account Groups
  await apiCall('GET', '/accounting/groups', null, true, 'List Account Groups');

  // 4.3 Account Groups Tree
  await apiCall('GET', '/accounting/groups/tree', null, true, 'Get Account Groups Tree');

  // 4.4 List Voucher Types
  await apiCall('GET', '/accounting/voucher-types', null, true, 'List Voucher Types');

  // 4.5 Create Voucher Type
  const voucherTypeResult = await apiCall('POST', '/accounting/voucher-types', {
    voucher_type_name: 'Test Sales',
    voucher_type_code: 'TSL',
    category: 'sales',
    is_active: true
  }, true, 'Create Voucher Type');

  if (voucherTypeResult.success && voucherTypeResult.data.data?.id) {
    testData.voucherTypeId = voucherTypeResult.data.data.id;
    console.log(`📋 Voucher Type ID saved: ${testData.voucherTypeId}`);
  }
}

// Test Phase 5: Ledger Management
async function testLedgerManagement() {
  console.log('\n📚 PHASE 5: LEDGER MANAGEMENT');
  console.log('=============================');

  // 5.1 List Ledgers
  await apiCall('GET', '/accounting/ledgers?page=1&limit=20', null, true, 'List Ledgers');

  // 5.2 Create Ledger
  const ledgerResult = await apiCall('POST', '/accounting/ledgers', {
    ledger_name: 'Test Cash Account',
    ledger_code: 'CASH001',
    account_group_id: 1,
    opening_balance: 10000.00,
    opening_balance_type: 'Dr'
  }, true, 'Create Ledger');

  if (ledgerResult.success && ledgerResult.data.data?.id) {
    testData.ledgerId = ledgerResult.data.data.id;
    console.log(`📚 Ledger ID saved: ${testData.ledgerId}`);
  }

  // 5.3 Get Ledger by ID (Previously problematic)
  if (testData.ledgerId) {
    await apiCall('GET', `/accounting/ledgers/${testData.ledgerId}`, null, true, 'Get Ledger by ID (Previously Problematic)');
  }

  // 5.4 Update Ledger
  if (testData.ledgerId) {
    await apiCall('PUT', `/accounting/ledgers/${testData.ledgerId}`, {
      ledger_name: 'Updated Cash Account',
      opening_balance: 15000.00
    }, true, 'Update Ledger');
  }

  // 5.5 Get Ledger Balance (Previously problematic)
  if (testData.ledgerId) {
    await apiCall('GET', `/accounting/ledgers/${testData.ledgerId}/balance`, null, true, 'Get Ledger Balance (Previously Problematic)');
  }
}

// Test Phase 6: Inventory Management
async function testInventoryManagement() {
  console.log('\n📦 PHASE 6: INVENTORY MANAGEMENT');
  console.log('================================');

  // 6.1 List Warehouses
  await apiCall('GET', '/accounting/warehouses', null, true, 'List Warehouses');

  // 6.2 Create Warehouse
  const warehouseResult = await apiCall('POST', '/accounting/warehouses', {
    warehouse_name: 'Main Warehouse',
    warehouse_code: 'MW001',
    address: '123 Warehouse Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001'
  }, true, 'Create Warehouse');

  if (warehouseResult.success && warehouseResult.data.data?.id) {
    testData.warehouseId = warehouseResult.data.data.id;
    console.log(`📦 Warehouse ID saved: ${testData.warehouseId}`);
  }

  // 6.3 List Inventory Items
  await apiCall('GET', '/accounting/inventory/items?page=1&limit=20', null, true, 'List Inventory Items');

  // 6.4 Create Inventory Item
  const itemResult = await apiCall('POST', '/accounting/inventory/items', {
    item_name: 'Test Product',
    item_code: 'TP001',
    category: 'Electronics',
    unit: 'Pcs',
    purchase_rate: 100.00,
    sales_rate: 150.00,
    hsn_code: '8517'
  }, true, 'Create Inventory Item');

  if (itemResult.success && itemResult.data.data?.id) {
    testData.itemId = itemResult.data.data.id;
    console.log(`📦 Item ID saved: ${testData.itemId}`);
  }
}

// Test Phase 7: Transaction Processing
async function testTransactionProcessing() {
  console.log('\n💰 PHASE 7: TRANSACTION PROCESSING');
  console.log('==================================');

  // 7.1 List Vouchers
  await apiCall('GET', '/accounting/vouchers?page=1&limit=20', null, true, 'List Vouchers');

  // 7.2 Create Sales Invoice
  if (testData.ledgerId && testData.itemId) {
    const salesResult = await apiCall('POST', '/accounting/invoices/sales', {
      voucher_date: '2024-01-15',
      party_ledger_id: testData.ledgerId,
      items: [{
        item_id: testData.itemId,
        quantity: 10,
        rate: 100.00,
        amount: 1000.00
      }],
      total_amount: 1000.00,
      narration: 'Test sales invoice'
    }, true, 'Create Sales Invoice');

    if (salesResult.success && salesResult.data.data?.id) {
      testData.voucherId = salesResult.data.data.id;
      console.log(`💰 Voucher ID saved: ${testData.voucherId}`);
    }
  }

  // 7.3 Create Payment
  if (testData.ledgerId) {
    await apiCall('POST', '/accounting/payments', {
      voucher_date: '2024-01-15',
      payment_ledger_id: testData.ledgerId,
      party_ledger_id: testData.ledgerId,
      amount: 500.00,
      narration: 'Payment to supplier'
    }, true, 'Create Payment');
  }
}

// Test Phase 8: Reports
async function testReports() {
  console.log('\n📈 PHASE 8: REPORTS');
  console.log('===================');

  // 8.1 Trial Balance
  await apiCall('GET', '/reports/trial-balance?from_date=2024-01-01&to_date=2024-12-31', null, true, 'Generate Trial Balance');

  // 8.2 Balance Sheet
  await apiCall('GET', '/reports/balance-sheet?as_on_date=2024-12-31', null, true, 'Generate Balance Sheet');

  // 8.3 Profit & Loss
  await apiCall('GET', '/reports/profit-loss?from_date=2024-01-01&to_date=2024-12-31', null, true, 'Generate Profit & Loss');

  // 8.4 Ledger Statement
  if (testData.ledgerId) {
    await apiCall('GET', `/reports/ledger-statement?ledger_id=${testData.ledgerId}&from_date=2024-01-01&to_date=2024-12-31`, null, true, 'Generate Ledger Statement');
  }

  // 8.5 Stock Summary
  await apiCall('GET', '/reports/stock-summary', null, true, 'Generate Stock Summary');
}

// Test Phase 9: GST & Compliance
async function testGSTCompliance() {
  console.log('\n🧾 PHASE 9: GST & COMPLIANCE');
  console.log('============================');

  // 9.1 List GSTINs
  await apiCall('GET', '/gst/gstins', null, true, 'List GSTINs');

  // 9.2 Create GSTIN
  await apiCall('POST', '/gst/gstins', {
    gstin: '27ABCDE1234F1Z5',
    legal_name: 'Test Company Pvt Ltd',
    trade_name: 'Test Company',
    state_code: '27',
    is_active: true
  }, true, 'Create GSTIN');

  // 9.3 Validate GSTIN
  await apiCall('POST', '/gst/validate', {
    gstin: '27ABCDE1234F1Z5'
  }, true, 'Validate GSTIN');

  // 9.4 Get GST Rates
  await apiCall('GET', '/gst/rates', null, true, 'Get GST Rates');

  // 9.5 TDS Calculation
  await apiCall('POST', '/tds/calculate', {
    amount: 10000,
    tds_section: '194C',
    pan_available: true
  }, true, 'Calculate TDS');

  // 9.6 List TDS Records
  await apiCall('GET', '/tds', null, true, 'List TDS Records');
}

// Test Phase 10: Support & Notifications
async function testSupportNotifications() {
  console.log('\n🔔 PHASE 10: SUPPORT & NOTIFICATIONS');
  console.log('===================================');

  // 10.1 Create Support Ticket
  const ticketResult = await apiCall('POST', '/support/tickets', {
    subject: 'Test Support Ticket',
    description: 'This is a test support ticket',
    priority: 'medium',
    category: 'technical',
    email: 'test@finvera.com',
    name: 'Test User'
  }, false, 'Create Support Ticket');

  if (ticketResult.success && ticketResult.data.data?.id) {
    testData.ticketId = ticketResult.data.data.id;
    console.log(`🎫 Ticket ID saved: ${testData.ticketId}`);
  }

  // 10.2 Get My Tickets
  await apiCall('GET', '/support/my-tickets', null, true, 'Get My Support Tickets');

  // 10.3 Get Notifications
  await apiCall('GET', '/notifications?page=1&limit=20', null, true, 'Get Notifications');

  // 10.4 Get Unread Count
  await apiCall('GET', '/notifications/unread-count', null, true, 'Get Unread Notification Count');

  // 10.5 Get Notification Preferences
  await apiCall('GET', '/notifications/preferences', null, true, 'Get Notification Preferences');
}

// Test Phase 11: Subscriptions & Pricing
async function testSubscriptionsPricing() {
  console.log('\n💳 PHASE 11: SUBSCRIPTIONS & PRICING');
  console.log('====================================');

  // 11.1 Get Current Subscription
  await apiCall('GET', '/subscriptions/current', null, true, 'Get Current Subscription');

  // 11.2 Get Payment History
  await apiCall('GET', '/subscriptions/payments/history', null, true, 'Get Payment History');

  // 11.3 List Pricing Plans
  await apiCall('GET', '/pricing', null, false, 'List Pricing Plans');

  // 11.4 Get Pricing Plan by ID
  await apiCall('GET', '/pricing/1', null, false, 'Get Pricing Plan by ID');
}

// Test Phase 12: Advanced Features
async function testAdvancedFeatures() {
  console.log('\n🔍 PHASE 12: ADVANCED FEATURES');
  console.log('==============================');

  // 12.1 Global Search
  await apiCall('GET', '/search?q=test&type=all', null, true, 'Global Search');

  // 12.2 Search HSN Codes
  await apiCall('GET', '/hsn/search?q=mobile&limit=10', null, true, 'Search HSN Codes');

  // 12.3 Get HSN by Code
  await apiCall('GET', '/hsn/8517', null, true, 'Get HSN by Code');

  // 12.4 List E-Invoices
  await apiCall('GET', '/einvoice', null, true, 'List E-Invoices');

  // 12.5 List E-Way Bills
  await apiCall('GET', '/ewaybill', null, true, 'List E-Way Bills');
}

// Main test runner
async function runComprehensiveTests() {
  console.log('🚀 COMPREHENSIVE BACKEND API TESTING');
  console.log('====================================');
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);

  try {
    // Phase 1: Foundation (Critical)
    const foundationSuccess = await testFoundation();
    if (!foundationSuccess) {
      console.log('\n❌ Foundation tests failed. Cannot proceed with authenticated tests.');
      saveResults();
      return;
    }

    // Phase 2: Company & Tenant Setup
    await testCompanySetup();

    // Phase 3: Branch Management
    await testBranchManagement();

    // Phase 4: Accounting Foundation
    await testAccountingFoundation();

    // Phase 5: Ledger Management (Previously problematic)
    await testLedgerManagement();

    // Phase 6: Inventory Management
    await testInventoryManagement();

    // Phase 7: Transaction Processing
    await testTransactionProcessing();

    // Phase 8: Reports
    await testReports();

    // Phase 9: GST & Compliance
    await testGSTCompliance();

    // Phase 10: Support & Notifications
    await testSupportNotifications();

    // Phase 11: Subscriptions & Pricing
    await testSubscriptionsPricing();

    // Phase 12: Advanced Features
    await testAdvancedFeatures();

  } catch (error) {
    console.log('\n💥 Test execution crashed:', error.message);
  } finally {
    // Save results and show summary
    saveResults();
    showSummary();
  }
}

// Show test summary
function showSummary() {
  console.log('\n📊 COMPREHENSIVE TEST RESULTS');
  console.log('==============================');
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`📊 Total: ${testResults.summary.total}`);
  console.log(`⏱️  Duration: ${new Date(testResults.summary.endTime) - new Date(testResults.summary.startTime)}ms`);

  const successRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1);
  console.log(`📈 Success Rate: ${successRate}%`);

  // Show failed tests
  const failedTests = testResults.tests.filter(test => !test.success);
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(test => {
      console.log(`  - ${test.description} (${test.status}): ${test.error?.message || 'Unknown error'}`);
    });
  }

  // Show key findings
  console.log('\n🔍 Key Findings:');
  const authTests = testResults.tests.filter(test => test.endpoint.includes('/auth'));
  const companyTests = testResults.tests.filter(test => test.endpoint.includes('/companies'));
  const accountingTests = testResults.tests.filter(test => test.endpoint.includes('/accounting'));

  console.log(`  - Authentication: ${authTests.filter(t => t.success).length}/${authTests.length} passed`);
  console.log(`  - Company Management: ${companyTests.filter(t => t.success).length}/${companyTests.length} passed`);
  console.log(`  - Accounting APIs: ${accountingTests.filter(t => t.success).length}/${accountingTests.length} passed`);

  console.log('\n💾 Detailed results saved to: api-test-results.json');
  console.log('📋 Use this data to identify and fix issues systematically');
}

// Run the comprehensive test
runComprehensiveTests().catch(console.error);