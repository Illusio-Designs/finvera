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

// Save test results to single consolidated file with enhanced reporting
function saveResults() {
  testResults.summary.endTime = new Date().toISOString();
  testResults.summary.duration = new Date(testResults.summary.endTime) - new Date(testResults.summary.startTime);
  testResults.summary.successRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1);
  
  // Add phase-wise breakdown
  testResults.summary.phaseBreakdown = {
    foundation: { passed: 0, failed: 0, total: 0 },
    company: { passed: 0, failed: 0, total: 0 },
    accounting: { passed: 0, failed: 0, total: 0 },
    gst_compliance: { passed: 0, failed: 0, total: 0 },
    income_tax: { passed: 0, failed: 0, total: 0 },
    admin: { passed: 0, failed: 0, total: 0 },
    other: { passed: 0, failed: 0, total: 0 }
  };

  // Categorize tests by phase
  testResults.tests.forEach(test => {
    let phase = 'other';
    if (test.endpoint.includes('/auth')) phase = 'foundation';
    else if (test.endpoint.includes('/companies') || test.endpoint.includes('/branches')) phase = 'company';
    else if (test.endpoint.includes('/accounting') || test.endpoint.includes('/reports')) phase = 'accounting';
    else if (test.endpoint.includes('/gst') || test.endpoint.includes('/tds')) phase = 'gst_compliance';
    else if (test.endpoint.includes('/income-tax')) phase = 'income_tax';
    else if (test.endpoint.includes('/admin')) phase = 'admin';

    testResults.summary.phaseBreakdown[phase].total++;
    if (test.success) {
      testResults.summary.phaseBreakdown[phase].passed++;
    } else {
      testResults.summary.phaseBreakdown[phase].failed++;
    }
  });

  // Add environment info
  testResults.environment = {
    baseUrl: BASE_URL,
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
    testDataSnapshot: {
      hasAccessToken: !!testData.accessToken,
      hasCompanyId: !!testData.companyId,
      hasBranchId: !!testData.branchId,
      hasLedgerId: !!testData.ledgerId,
      hasItemId: !!testData.itemId
    }
  };

  // Add failed tests summary
  testResults.failedTests = testResults.tests
    .filter(test => !test.success)
    .map(test => ({
      description: test.description,
      endpoint: test.endpoint,
      method: test.method,
      status: test.status,
      error: test.error?.message || test.error || 'Unknown error',
      timestamp: test.timestamp
    }));

  // Add sandbox API specific results
  testResults.sandboxApiResults = {
    gstApis: testResults.tests.filter(test => 
      test.endpoint.includes('/gst/') && 
      (test.endpoint.includes('validate') || test.endpoint.includes('rate') || test.endpoint.includes('analytics'))
    ).map(test => ({
      endpoint: test.endpoint,
      success: test.success,
      responseTime: test.responseTime,
      status: test.status
    })),
    tdsApis: testResults.tests.filter(test => 
      test.endpoint.includes('/tds/')
    ).map(test => ({
      endpoint: test.endpoint,
      success: test.success,
      responseTime: test.responseTime,
      status: test.status
    })),
    incomeTaxApis: testResults.tests.filter(test => 
      test.endpoint.includes('/income-tax/')
    ).map(test => ({
      endpoint: test.endpoint,
      success: test.success,
      responseTime: test.responseTime,
      status: test.status
    }))
  };

  // Add performance metrics
  testResults.performance = {
    averageResponseTime: testResults.tests
      .filter(test => test.success)
      .reduce((sum, test) => sum + test.responseTime, 0) / (testResults.summary.passed || 1),
    slowestTests: testResults.tests
      .filter(test => test.responseTime > 1000)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 10)
      .map(test => ({
        description: test.description,
        endpoint: test.endpoint,
        responseTime: test.responseTime
      })),
    fastestTests: testResults.tests
      .filter(test => test.success && test.responseTime < 100)
      .sort((a, b) => a.responseTime - b.responseTime)
      .slice(0, 10)
      .map(test => ({
        description: test.description,
        endpoint: test.endpoint,
        responseTime: test.responseTime
      }))
  };

  // Add API coverage analysis
  testResults.coverage = {
    totalEndpointsTested: testResults.summary.total,
    uniqueEndpoints: [...new Set(testResults.tests.map(test => test.endpoint))].length,
    httpMethods: {
      GET: testResults.tests.filter(test => test.method === 'GET').length,
      POST: testResults.tests.filter(test => test.method === 'POST').length,
      PUT: testResults.tests.filter(test => test.method === 'PUT').length,
      DELETE: testResults.tests.filter(test => test.method === 'DELETE').length,
      PATCH: testResults.tests.filter(test => test.method === 'PATCH').length
    },
    statusCodes: testResults.tests.reduce((acc, test) => {
      const status = test.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {})
  };

  // Save single consolidated results file
  const resultsFile = path.join(__dirname, 'api-test-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`\n💾 Consolidated test results saved to: ${resultsFile}`);
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
    branch_code: `MUM${Date.now()}`,
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

// Test Phase 4: Accounting Foundation (Enhanced)
async function testAccountingFoundation() {
  console.log('\n📊 PHASE 4: ACCOUNTING FOUNDATION (ENHANCED)');
  console.log('=============================================');

  // 4.1 Dashboard
  await apiCall('GET', '/accounting/dashboard', null, true, 'Get Accounting Dashboard');

  // 4.2 List Account Groups
  await apiCall('GET', '/accounting/groups', null, true, 'List Account Groups');

  // 4.3 Account Groups Tree
  await apiCall('GET', '/accounting/groups/tree', null, true, 'Get Account Groups Tree');

  // 4.4 Get Account Group by ID
  const groupsResult = await apiCall('GET', '/accounting/groups', null, true, 'Get Account Groups for ID Test');
  if (groupsResult.success && groupsResult.data.data && groupsResult.data.data.length > 0) {
    const firstGroupId = groupsResult.data.data[0].id;
    await apiCall('GET', `/accounting/groups/${firstGroupId}`, null, true, 'Get Account Group by ID');
  }

  // 4.5 List Voucher Types
  await apiCall('GET', '/accounting/voucher-types', null, true, 'List Voucher Types');

  // 4.6 Create Voucher Type
  const voucherTypeResult = await apiCall('POST', '/accounting/voucher-types', {
    voucher_type_name: 'Test Sales',
    voucher_type_code: 'TSL',
    category: 'sales',
    is_active: true
  }, true, 'Create Voucher Type');

  if (voucherTypeResult.success && voucherTypeResult.data.data?.id) {
    testData.voucherTypeId = voucherTypeResult.data.data.id;
    console.log(`📋 Voucher Type ID saved: ${testData.voucherTypeId}`);

    // 4.7 Get Voucher Type by ID
    await apiCall('GET', `/accounting/voucher-types/${testData.voucherTypeId}`, null, true, 'Get Voucher Type by ID');

    // 4.8 Update Voucher Type
    await apiCall('PUT', `/accounting/voucher-types/${testData.voucherTypeId}`, {
      voucher_type_name: 'Updated Test Sales'
    }, true, 'Update Voucher Type');
  }
}

// Test Phase 5: Ledger Management (Enhanced)
async function testLedgerManagement() {
  console.log('\n📚 PHASE 5: LEDGER MANAGEMENT (ENHANCED)');
  console.log('========================================');

  // 5.1 List Ledgers
  await apiCall('GET', '/accounting/ledgers?page=1&limit=20', null, true, 'List Ledgers');

  // 5.2 Create Ledger
  // First get account groups to find a valid ID
  const accountGroupsResult = await apiCall('GET', '/accounting/groups', null, true, 'Get Account Groups for Ledger');
  let validAccountGroupId = null;
  if (accountGroupsResult.success && accountGroupsResult.data.data && accountGroupsResult.data.data.length > 0) {
    // Find a suitable account group (preferably Cash or Bank)
    const cashGroup = accountGroupsResult.data.data.find(group => 
      group.group_name && (group.group_name.toLowerCase().includes('cash') || group.group_name.toLowerCase().includes('bank'))
    );
    validAccountGroupId = cashGroup ? cashGroup.id : accountGroupsResult.data.data[0].id;
  }

  if (validAccountGroupId) {
    const ledgerResult = await apiCall('POST', '/accounting/ledgers', {
      ledger_name: 'Test Cash Account',
      ledger_code: `CASH${Date.now()}`,
      account_group_id: validAccountGroupId,
      opening_balance: 10000.00,
      opening_balance_type: 'Dr'
    }, true, 'Create Ledger');

    if (ledgerResult.success && ledgerResult.data.data?.id) {
      testData.ledgerId = ledgerResult.data.data.id;
      console.log(`📚 Ledger ID saved: ${testData.ledgerId}`);

      // 5.3 Get Ledger by ID
      await apiCall('GET', `/accounting/ledgers/${testData.ledgerId}`, null, true, 'Get Ledger by ID');

      // 5.4 Update Ledger
      await apiCall('PUT', `/accounting/ledgers/${testData.ledgerId}`, {
        ledger_name: 'Updated Cash Account',
        opening_balance: 15000.00
      }, true, 'Update Ledger');

      // 5.5 Get Ledger Balance
      await apiCall('GET', `/accounting/ledgers/${testData.ledgerId}/balance`, null, true, 'Get Ledger Balance');

      // 5.6 Delete Ledger (test at the end)
      await apiCall('DELETE', `/accounting/ledgers/${testData.ledgerId}`, null, true, 'Delete Ledger');
    }
  } else {
    console.log('⚠️  Skipping ledger creation - no valid account group found');
  }
}

// Test Phase 6: Inventory Management (Enhanced)
async function testInventoryManagement() {
  console.log('\n📦 PHASE 6: INVENTORY MANAGEMENT (ENHANCED)');
  console.log('============================================');

  // 6.1 List Warehouses
  await apiCall('GET', '/accounting/warehouses', null, true, 'List Warehouses');

  // 6.2 Get All Warehouses
  await apiCall('GET', '/accounting/warehouses/all', null, true, 'Get All Warehouses');

  // 6.3 Create Warehouse
  const warehouseResult = await apiCall('POST', '/accounting/warehouses', {
    warehouse_name: 'Main Warehouse',
    warehouse_code: `MW${Date.now()}`,
    address: '123 Warehouse Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001'
  }, true, 'Create Warehouse');

  if (warehouseResult.success && warehouseResult.data.data?.id) {
    testData.warehouseId = warehouseResult.data.data.id;
    console.log(`📦 Warehouse ID saved: ${testData.warehouseId}`);

    // 6.4 Get Warehouse by ID
    await apiCall('GET', `/accounting/warehouses/${testData.warehouseId}`, null, true, 'Get Warehouse by ID');

    // 6.5 Update Warehouse
    await apiCall('PUT', `/accounting/warehouses/${testData.warehouseId}`, {
      warehouse_name: 'Updated Main Warehouse',
      address: '456 Updated Street'
    }, true, 'Update Warehouse');
  }

  // 6.6 List Inventory Items
  await apiCall('GET', '/accounting/inventory/items?page=1&limit=20', null, true, 'List Inventory Items');

  // 6.7 Create Inventory Item
  const itemResult = await apiCall('POST', '/accounting/inventory/items', {
    item_name: 'Test Product',
    item_code: `TP${Date.now()}`,
    category: 'Electronics',
    unit: 'Pcs',
    purchase_rate: 100.00,
    sales_rate: 150.00,
    hsn_code: '8517'
  }, true, 'Create Inventory Item');

  if (itemResult.success && itemResult.data.data?.id) {
    testData.itemId = itemResult.data.data.id;
    console.log(`📦 Item ID saved: ${testData.itemId}`);

    // 6.8 Get Item by ID
    await apiCall('GET', `/accounting/inventory/items/${testData.itemId}`, null, true, 'Get Inventory Item by ID');

    // 6.9 Update Item
    await apiCall('PUT', `/accounting/inventory/items/${testData.itemId}`, {
      item_name: 'Updated Test Product',
      sales_rate: 175.00
    }, true, 'Update Inventory Item');

    // 6.10 Generate Barcode for Item
    await apiCall('POST', `/accounting/inventory/items/${testData.itemId}/generate-barcode`, {}, true, 'Generate Item Barcode');

    // 6.11 Set Opening Stock by Warehouse
    if (testData.warehouseId) {
      await apiCall('POST', `/accounting/inventory/items/${testData.itemId}/opening-stock`, {
        warehouse_id: testData.warehouseId,
        opening_quantity: 100,
        opening_value: 10000
      }, true, 'Set Opening Stock by Warehouse');

      // 6.12 Get Stock by Warehouse
      await apiCall('GET', `/accounting/inventory/items/${testData.itemId}/warehouse-stock`, null, true, 'Get Stock by Warehouse');
    }
  }

  // 6.13 Bulk Generate Barcodes
  await apiCall('POST', '/accounting/inventory/items/bulk-generate-barcodes', {
    item_ids: testData.itemId ? [testData.itemId] : []
  }, true, 'Bulk Generate Barcodes');

  // 6.14 List Stock Adjustments
  await apiCall('GET', '/accounting/stock-adjustments', null, true, 'List Stock Adjustments');

  // 6.15 Create Stock Adjustment
  if (testData.itemId && testData.warehouseId) {
    await apiCall('POST', '/accounting/stock-adjustments', {
      adjustment_date: '2024-03-15',
      warehouse_id: testData.warehouseId,
      items: [{
        item_id: testData.itemId,
        current_quantity: 100,
        adjusted_quantity: 95,
        reason: 'Damaged goods'
      }]
    }, true, 'Create Stock Adjustment');
  }

  // 6.16 List Stock Transfers
  await apiCall('GET', '/accounting/stock-transfers', null, true, 'List Stock Transfers');

  // 6.17 Create Stock Transfer
  if (testData.itemId && testData.warehouseId) {
    await apiCall('POST', '/accounting/stock-transfers', {
      transfer_date: '2024-03-15',
      from_warehouse_id: testData.warehouseId,
      to_warehouse_id: testData.warehouseId,
      items: [{
        item_id: testData.itemId,
        quantity: 10
      }]
    }, true, 'Create Stock Transfer');
  }
}

// Test Phase 7: Transaction Processing (Enhanced)
async function testTransactionProcessing() {
  console.log('\n💰 PHASE 7: TRANSACTION PROCESSING (ENHANCED)');
  console.log('==============================================');

  // 7.1 List Vouchers
  await apiCall('GET', '/accounting/vouchers?page=1&limit=20', null, true, 'List Vouchers');

  // 7.2 Create Generic Voucher
  const voucherResult = await apiCall('POST', '/accounting/vouchers', {
    voucher_date: '2024-03-15',
    voucher_type: 'Journal',
    narration: 'Test journal entry',
    entries: [{
      ledger_id: testData.ledgerId,
      debit_amount: 1000,
      credit_amount: 0
    }]
  }, true, 'Create Generic Voucher');

  if (voucherResult.success && voucherResult.data.data?.id) {
    testData.voucherId = voucherResult.data.data.id;
    console.log(`💰 Voucher ID saved: ${testData.voucherId}`);

    // 7.3 Get Voucher by ID
    await apiCall('GET', `/accounting/vouchers/${testData.voucherId}`, null, true, 'Get Voucher by ID');

    // 7.4 Update Voucher
    await apiCall('PUT', `/accounting/vouchers/${testData.voucherId}`, {
      narration: 'Updated test journal entry'
    }, true, 'Update Voucher');

    // 7.5 Post Voucher
    await apiCall('POST', `/accounting/vouchers/${testData.voucherId}/post`, {}, true, 'Post Voucher');

    // 7.6 Cancel Voucher
    await apiCall('POST', `/accounting/vouchers/${testData.voucherId}/cancel`, {}, true, 'Cancel Voucher');
  }

  // 7.7 Create Sales Invoice
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
      testData.salesInvoiceId = salesResult.data.data.id;
    }
  }

  // 7.8 Create Purchase Invoice
  if (testData.ledgerId && testData.itemId) {
    await apiCall('POST', '/accounting/invoices/purchase', {
      voucher_date: '2024-01-15',
      party_ledger_id: testData.ledgerId,
      items: [{
        item_id: testData.itemId,
        quantity: 5,
        rate: 80.00,
        amount: 400.00
      }],
      total_amount: 400.00,
      narration: 'Test purchase invoice'
    }, true, 'Create Purchase Invoice');
  }

  // 7.9 Create Payment
  if (testData.ledgerId) {
    await apiCall('POST', '/accounting/payments', {
      voucher_date: '2024-01-15',
      payment_ledger_id: testData.ledgerId,
      party_ledger_id: testData.ledgerId,
      amount: 500.00,
      narration: 'Payment to supplier'
    }, true, 'Create Payment');
  }

  // 7.10 Create Receipt
  if (testData.ledgerId) {
    await apiCall('POST', '/accounting/receipts', {
      voucher_date: '2024-01-15',
      receipt_ledger_id: testData.ledgerId,
      party_ledger_id: testData.ledgerId,
      amount: 300.00,
      narration: 'Receipt from customer'
    }, true, 'Create Receipt');
  }

  // 7.11 Create Journal Entry
  if (testData.ledgerId) {
    await apiCall('POST', '/accounting/journals', {
      voucher_date: '2024-01-15',
      entries: [{
        ledger_id: testData.ledgerId,
        debit_amount: 1000,
        credit_amount: 0
      }],
      narration: 'Test journal entry'
    }, true, 'Create Journal Entry');
  }

  // 7.12 Create Contra Entry
  if (testData.ledgerId) {
    await apiCall('POST', '/accounting/contra', {
      voucher_date: '2024-01-15',
      from_ledger_id: testData.ledgerId,
      to_ledger_id: testData.ledgerId,
      amount: 200.00,
      narration: 'Bank to cash transfer'
    }, true, 'Create Contra Entry');
  }

  // 7.13 Get Outstanding Bills
  await apiCall('GET', '/accounting/outstanding', null, true, 'Get Outstanding Bills');

  // 7.14 Allocate Payment to Bill
  if (testData.salesInvoiceId) {
    await apiCall('POST', '/accounting/bills/allocate', {
      bill_id: testData.salesInvoiceId,
      payment_voucher_id: testData.voucherId,
      allocated_amount: 100.00
    }, true, 'Allocate Payment to Bill');
  }

  // 7.15 Get Aging Report
  await apiCall('GET', '/accounting/bills/aging', null, true, 'Get Bills Aging Report');
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

// Test Phase 9: GST & Compliance (Updated with Sandbox APIs)
async function testGSTCompliance() {
  console.log('\n🧾 PHASE 9: GST & COMPLIANCE (SANDBOX APIS)');
  console.log('============================================');

  // 9.1 List GSTINs
  await apiCall('GET', '/gst/gstins', null, true, 'List GSTINs');

  // 9.2 Create GSTIN
  const uniqueGstin = `27ABCDE${Date.now().toString().slice(-4)}F1Z5`;
  await apiCall('POST', '/gst/gstins', {
    gstin: uniqueGstin,
    legal_name: 'Test Company Pvt Ltd',
    trade_name: 'Test Company',
    state_code: '27',
    is_active: true
  }, true, 'Create GSTIN');

  // 9.3 Validate GSTIN (Sandbox API)
  await apiCall('POST', '/gst/validate', {
    gstin: '27ABCDE1234F1Z5'
  }, true, 'Validate GSTIN via Sandbox');

  // 9.4 Get GSTIN Details (Sandbox API)
  await apiCall('GET', '/gst/details/27ABCDE1234F1Z5', null, true, 'Get GSTIN Details via Sandbox');

  // 9.5 Get GST Rate by HSN (Sandbox API)
  await apiCall('GET', '/gst/rate?hsn_code=1001&state=Maharashtra', null, true, 'Get GST Rate by HSN via Sandbox');

  // 9.6 GSTR-2A Reconciliation Job (Sandbox API)
  await apiCall('POST', '/gst/analytics/gstr2a-reconciliation', {
    gstin: '27ABCDE1234F1Z5',
    year: 2024,
    month: 3,
    reconciliation_criteria: 'strict'
  }, true, 'Create GSTR-2A Reconciliation Job');

  // 9.7 Upload Purchase Ledger (Sandbox API)
  await apiCall('POST', '/gst/analytics/upload-purchase-ledger', {
    gstin: '27ABCDE1234F1Z5',
    file_type: 'csv',
    data: [
      {
        invoice_number: 'INV001',
        invoice_date: '2024-03-15',
        supplier_gstin: '29AABCU9603R1ZX',
        taxable_amount: 10000,
        igst_amount: 1800
      }
    ]
  }, true, 'Upload Purchase Ledger Data');

  // 9.8 TDS Calculation (Sandbox API)
  await apiCall('POST', '/tds/calculate', {
    amount: 10000,
    tds_section: '194C',
    pan_available: true
  }, true, 'Calculate TDS via Sandbox');

  // 9.9 TDS Analytics - Potential Notice (Sandbox API)
  await apiCall('POST', '/tds/analytics/potential-notice', {
    quarter: 'Q1',
    tan: 'ABCD12345E',
    form: '24Q',
    financial_year: '2023-24'
  }, true, 'TDS Potential Notice Analysis');

  // 9.10 TDS Calculator - Non-Salary (Sandbox API)
  await apiCall('POST', '/tds/calculator/non-salary', {
    payment_amount: 100000,
    section: '194C',
    deductee_pan: 'ABCDE1234F',
    payment_date: '2024-03-15',
    nature_of_payment: 'Contract Payment'
  }, true, 'Calculate Non-Salary TDS');

  // 9.11 TDS Compliance - 206AB Check (Sandbox API)
  await apiCall('POST', '/tds/compliance/206ab-check', {
    pan: 'ABCDE1234F',
    consent: true,
    reason: 'TDS rate verification'
  }, true, 'Section 206AB Compliance Check');

  // 9.12 TDS Compliance - CSI Download (Sandbox API)
  await apiCall('POST', '/tds/compliance/csi-download', {
    tan: 'ABCD12345E',
    quarter: 'Q1',
    financial_year: '2023-24'
  }, true, 'Download CSI Data');

  // 9.13 TDS Reports - TCS Report (Sandbox API)
  await apiCall('POST', '/tds/reports/tcs-report', {
    tan: 'ABCD12345E',
    quarter: 'Q1',
    financial_year: '2023-24',
    report_type: 'summary'
  }, true, 'Generate TCS Report');

  // 9.14 List TDS Records
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
  const pricingPlans = await apiCall('GET', '/pricing', null, false, 'List Pricing Plans for ID');
  let planId = null;
  if (pricingPlans.success && pricingPlans.data?.data?.length > 0) {
    planId = pricingPlans.data.data[0].id;
    await apiCall('GET', `/pricing/${planId}`, null, false, 'Get Pricing Plan by ID');
  } else {
    await apiCall('GET', '/pricing/1', null, false, 'Get Pricing Plan by ID');
  }
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

// Test Phase 13: Admin Portal APIs
async function testAdminAPIs() {
  console.log('\n👑 PHASE 13: ADMIN PORTAL APIS');
  console.log('==============================');

  // 13.1 Admin Dashboard
  await apiCall('GET', '/admin/dashboard', null, true, 'Admin Dashboard');

  // 13.2 List Tenants
  await apiCall('GET', '/admin/tenants', null, true, 'List Tenants');

  // 13.3 Get Tenant by ID
  if (testData.tenantId) {
    await apiCall('GET', `/admin/tenants/${testData.tenantId}`, null, true, 'Get Tenant by ID');
  }
}

// Test Phase 14: Distributor Management
async function testDistributorAPIs() {
  console.log('\n🏢 PHASE 14: DISTRIBUTOR MANAGEMENT');
  console.log('===================================');

  // 14.1 List Distributors
  await apiCall('GET', '/admin/distributors', null, true, 'List Distributors');

  // 14.2 Create Distributor
  const distributorResult = await apiCall('POST', '/admin/distributors', {
    distributor_code: `DIST${Date.now()}`,
    company_name: 'Test Distributor Ltd',
    contact_person: 'John Doe',
    email: `distributor${Date.now()}@test.com`,
    phone: '9876543210',
    address: '123 Distributor Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001'
  }, true, 'Create Distributor');

  if (distributorResult.success && distributorResult.data?.data?.id) {
    testData.distributorId = distributorResult.data.data.id;
    console.log(`🏢 Distributor ID saved: ${testData.distributorId}`);

    // 14.3 Get Distributor by ID
    await apiCall('GET', `/admin/distributors/${testData.distributorId}`, null, true, 'Get Distributor by ID');

    // 14.4 Update Distributor
    await apiCall('PUT', `/admin/distributors/${testData.distributorId}`, {
      company_name: 'Updated Distributor Ltd',
      phone: '9999999999'
    }, true, 'Update Distributor');

    // 14.5 Get Distributor Performance
    await apiCall('GET', `/admin/distributors/${testData.distributorId}/performance`, null, true, 'Get Distributor Performance');
  }
}

// Test Phase 15: Salesman Management
async function testSalesmanAPIs() {
  console.log('\n👨‍💼 PHASE 15: SALESMAN MANAGEMENT');
  console.log('=================================');

  // 15.1 List Salesmen
  await apiCall('GET', '/admin/salesmen', null, true, 'List Salesmen');

  // 15.2 Create Salesman
  const salesmanResult = await apiCall('POST', '/admin/salesmen', {
    salesman_code: `SALES${Date.now()}`,
    full_name: 'Test Salesman',
    email: `salesman${Date.now()}@test.com`,
    phone: '9876543210',
    address: '123 Salesman Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    distributor_id: testData.distributorId
  }, true, 'Create Salesman');

  if (salesmanResult.success && salesmanResult.data?.data?.id) {
    testData.salesmanId = salesmanResult.data.data.id;
    console.log(`👨‍💼 Salesman ID saved: ${testData.salesmanId}`);

    // 15.3 Get Salesman by ID
    await apiCall('GET', `/admin/salesmen/${testData.salesmanId}`, null, true, 'Get Salesman by ID');

    // 15.4 Update Salesman
    await apiCall('PUT', `/admin/salesmen/${testData.salesmanId}`, {
      full_name: 'Updated Salesman',
      phone: '9999999999'
    }, true, 'Update Salesman');

    // 15.5 Get Salesman Performance
    await apiCall('GET', `/admin/salesmen/${testData.salesmanId}/performance`, null, true, 'Get Salesman Performance');

    // 15.6 Get Salesman Leads
    await apiCall('GET', `/admin/salesmen/${testData.salesmanId}/leads`, null, true, 'Get Salesman Leads');
  }
}

// Test Phase 16: Target Management
async function testTargetAPIs() {
  console.log('\n🎯 PHASE 16: TARGET MANAGEMENT');
  console.log('==============================');

  // 16.1 List Targets
  await apiCall('GET', '/admin/targets', null, true, 'List Targets');

  // 16.2 Create Target
  if (testData.salesmanId) {
    const targetResult = await apiCall('POST', '/admin/targets', {
      target_type: 'salesman',
      target_entity_id: testData.salesmanId,
      target_period: 'monthly',
      target_year: 2024,
      target_month: 12,
      target_amount: 100000,
      target_quantity: 50
    }, true, 'Create Target');

    if (targetResult.success && targetResult.data?.data?.id) {
      testData.targetId = targetResult.data.data.id;
      console.log(`🎯 Target ID saved: ${testData.targetId}`);

      // 16.3 Get Target by ID
      await apiCall('GET', `/admin/targets/${testData.targetId}`, null, true, 'Get Target by ID');

      // 16.4 Update Target
      await apiCall('PUT', `/admin/targets/${testData.targetId}`, {
        target_amount: 150000,
        target_quantity: 75
      }, true, 'Update Target');
    }
  }
}

// Test Phase 17: Commission & Payout Management
async function testCommissionPayoutAPIs() {
  console.log('\n💰 PHASE 17: COMMISSION & PAYOUT MANAGEMENT');
  console.log('===========================================');

  // 17.1 List Commissions
  await apiCall('GET', '/admin/commissions', null, true, 'List Commissions');

  // 17.2 List Payouts
  await apiCall('GET', '/admin/payouts', null, true, 'List Payouts');

  // 17.3 Commission Payouts Summary
  await apiCall('GET', '/admin/commissions-payouts', null, true, 'Commission Payouts Summary');
}

// Test Phase 18: Referral System
async function testReferralAPIs() {
  console.log('\n🔗 PHASE 18: REFERRAL SYSTEM');
  console.log('=============================');

  // 18.1 List Referrals
  await apiCall('GET', '/referrals', null, true, 'List Referrals');

  // 18.2 Get Referral Stats
  await apiCall('GET', '/referrals/stats', null, true, 'Get Referral Stats');
}

// Test Phase 19: Product Attributes
async function testAttributeAPIs() {
  console.log('\n🏷️  PHASE 19: PRODUCT ATTRIBUTES');
  console.log('=================================');

  // 19.1 List Attributes
  await apiCall('GET', '/attributes', null, true, 'List Attributes');

  // 19.2 Create Attribute
  const attributeResult = await apiCall('POST', '/attributes', {
    attribute_name: 'Color',
    attribute_type: 'select',
    is_required: false
  }, true, 'Create Attribute');

  if (attributeResult.success && attributeResult.data?.data?.id) {
    testData.attributeId = attributeResult.data.data.id;
    console.log(`🏷️  Attribute ID saved: ${testData.attributeId}`);

    // 19.3 Update Attribute
    await apiCall('PUT', `/attributes/${testData.attributeId}`, {
      attribute_name: 'Updated Color',
      is_required: true
    }, true, 'Update Attribute');

    // 19.4 Add Attribute Value
    const valueResult = await apiCall('POST', `/attributes/${testData.attributeId}/values`, {
      value_name: 'Red',
      value_code: 'RED'
    }, true, 'Add Attribute Value');

    if (valueResult.success && valueResult.data?.data?.id) {
      testData.attributeValueId = valueResult.data.data.id;

      // 19.5 Remove Attribute Value
      await apiCall('DELETE', `/attributes/values/${testData.attributeValueId}`, null, true, 'Remove Attribute Value');
    }
  }
}

// Test Phase 20: Blog & Content Management
async function testBlogAPIs() {
  console.log('\n📝 PHASE 20: BLOG & CONTENT MANAGEMENT');
  console.log('======================================');

  // 20.1 List Blogs
  await apiCall('GET', '/blogs', null, false, 'List Blogs');

  // 20.2 List Blog Categories
  await apiCall('GET', '/blog-categories', null, false, 'List Blog Categories');

  // Note: Blog creation requires special admin roles, so we'll skip create/update/delete for now
}

// Test Phase 21: Review System
async function testReviewAPIs() {
  console.log('\n⭐ PHASE 21: REVIEW SYSTEM');
  console.log('==========================');

  // 21.1 List Reviews
  await apiCall('GET', '/reviews', null, true, 'List Reviews');

  // 21.2 Create Review
  const reviewResult = await apiCall('POST', '/reviews', {
    rating: 5,
    review_text: 'Excellent service!',
    reviewer_name: 'Test User',
    reviewer_email: 'test@example.com'
  }, true, 'Create Review');

  if (reviewResult.success && reviewResult.data?.data?.id) {
    testData.reviewId = reviewResult.data.data.id;
    console.log(`⭐ Review ID saved: ${testData.reviewId}`);

    // 21.3 Get Review by ID
    await apiCall('GET', `/reviews/${testData.reviewId}`, null, true, 'Get Review by ID');

    // 21.4 Update Review
    await apiCall('PUT', `/reviews/${testData.reviewId}`, {
      rating: 4,
      review_text: 'Good service!'
    }, true, 'Update Review');
  }
}

// Test Phase 24: File Management (Enhanced)
async function testFileManagement() {
  console.log('\n📁 PHASE 24: FILE MANAGEMENT (ENHANCED)');
  console.log('=======================================');

  // 24.1 Upload File (Note: This requires multipart/form-data)
  // We'll test the endpoint but expect it to fail without proper file data
  await apiCall('POST', '/files/upload', {
    // This will fail as we need actual file upload, but tests the endpoint
  }, true, 'Upload File (Expected to fail without file)');
}

// Test Phase 25: Tally Import & Export
async function testTallyIntegration() {
  console.log('\n📊 PHASE 25: TALLY IMPORT & EXPORT');
  console.log('==================================');

  // 25.1 Get Tally Import Template
  await apiCall('GET', '/accounting/tally-import/template', null, true, 'Get Tally Import Template');

  // 25.2 Import Tally Data (Note: This requires file upload)
  // We'll test the endpoint but expect it to fail without proper file data
  await apiCall('POST', '/accounting/tally-import', {
    // This will fail as we need actual file upload, but tests the endpoint
  }, true, 'Import Tally Data (Expected to fail without file)');
}

// Test Phase 26: SEO Management
async function testSEOManagement() {
  console.log('\n🔍 PHASE 26: SEO MANAGEMENT');
  console.log('===========================');

  // 26.1 List SEO Pages
  await apiCall('GET', '/seo', null, false, 'List SEO Pages');

  // 26.2 Get SEO by Path
  await apiCall('GET', '/seo/home', null, false, 'Get SEO by Path');

  // 26.3 Create SEO (Admin only - expected to fail)
  await apiCall('POST', '/seo', {
    path: '/test-page',
    title: 'Test Page',
    description: 'Test page description',
    keywords: 'test, page'
  }, true, 'Create SEO (Admin only - Expected to fail)');

  // 26.4 Update SEO (Admin only - expected to fail)
  await apiCall('PUT', '/seo/1', {
    title: 'Updated Test Page'
  }, true, 'Update SEO (Admin only - Expected to fail)');

  // 26.5 Delete SEO (Admin only - expected to fail)
  await apiCall('DELETE', '/seo/1', null, true, 'Delete SEO (Admin only - Expected to fail)');
}

// Test Phase 27: Cron Job Management
async function testCronManagement() {
  console.log('\n⏰ PHASE 27: CRON JOB MANAGEMENT');
  console.log('===============================');

  // 27.1 Get Cron Status
  await apiCall('GET', '/admin/cron/status', null, true, 'Get Cron Job Status');

  // 27.2 Trigger Trial Cleanup
  await apiCall('POST', '/admin/cron/trigger-trial-cleanup', {}, true, 'Trigger Trial Cleanup');

  // 27.3 Stop Cron Job
  await apiCall('POST', '/admin/cron/jobs/trial-cleanup/stop', {}, true, 'Stop Cron Job');

  // 27.4 Start Cron Job
  await apiCall('POST', '/admin/cron/jobs/trial-cleanup/start', {}, true, 'Start Cron Job');
}

// Test Phase 28: Finbox Integration (Enhanced)
async function testFinboxIntegration() {
  console.log('\n🏦 PHASE 28: FINBOX INTEGRATION (ENHANCED)');
  console.log('==========================================');

  // 28.1 Get Credit Score
  await apiCall('POST', '/finbox/credit-score', {
    customer_id: 'test_customer_123',
    phone: '9876543210',
    consent: true
  }, true, 'Get Credit Score');

  // 28.2 Get Inclusion Score
  await apiCall('GET', '/finbox/inclusion-score/test_customer_123', null, true, 'Get Inclusion Score');

  // 28.3 Check Loan Eligibility
  await apiCall('POST', '/finbox/eligibility', {
    customer_id: 'test_customer_123',
    loan_amount: 100000,
    loan_tenure: 12
  }, true, 'Check Loan Eligibility');

  // 28.4 Create Finbox User
  await apiCall('POST', '/finbox/user', {
    customer_id: 'test_customer_123',
    phone: '9876543210',
    email: 'test@example.com',
    name: 'Test User'
  }, true, 'Create Finbox User');

  // 28.5 Initiate Bank Statement
  await apiCall('POST', '/finbox/bank-statement/initiate', {
    customer_id: 'test_customer_123',
    bank_name: 'HDFC Bank'
  }, true, 'Initiate Bank Statement');

  // 28.6 Get Bank Statement Status
  await apiCall('GET', '/finbox/bank-statement/test_customer_123/status', null, true, 'Get Bank Statement Status');

  // 28.7 Get Bank Statement Analysis
  await apiCall('GET', '/finbox/bank-statement/test_customer_123/analysis', null, true, 'Get Bank Statement Analysis');

  // 28.8 Get Device Insights
  await apiCall('POST', '/finbox/device-insights', {
    customer_id: 'test_customer_123',
    device_data: {
      device_id: 'test_device_123',
      platform: 'android'
    }
  }, true, 'Get Device Insights');

  // 28.9 Generate Session Token
  await apiCall('POST', '/finbox/session', {
    customer_id: 'test_customer_123'
  }, true, 'Generate Session Token');

  // 28.10 Save Consent
  await apiCall('POST', '/finbox/consent', {
    customer_id: 'test_customer_123',
    consent_type: 'credit_score',
    consent_given: true
  }, true, 'Save Consent');

  // 28.11 Get Consent
  await apiCall('GET', '/finbox/consent?customer_id=test_customer_123', null, true, 'Get Consent');
}

// Test Phase 29: HSN Code Management (Enhanced)
async function testHSNManagement() {
  console.log('\n🏷️  PHASE 29: HSN CODE MANAGEMENT (ENHANCED)');
  console.log('=============================================');

  // 29.1 Search HSN Codes
  await apiCall('GET', '/hsn/search?q=mobile&limit=10', null, true, 'Search HSN Codes');

  // 29.2 Get HSN by Code
  await apiCall('GET', '/hsn/8517', null, true, 'Get HSN by Code');

  // 29.3 Validate HSN Code
  await apiCall('GET', '/hsn/8517/validate', null, true, 'Validate HSN Code');

  // 29.4 Get HSN Config Status
  await apiCall('GET', '/hsn/config/status', null, true, 'Get HSN Config Status');
}

// Test Phase 23: Income Tax & Advanced Integrations (Sandbox APIs)
async function testAdvancedIntegrations() {
  console.log('\n🧮 PHASE 23: INCOME TAX & ADVANCED INTEGRATIONS (SANDBOX APIS)');
  console.log('===============================================================');

  // 23.1 Income Tax Calculator - Tax P&L (Sandbox API)
  await apiCall('POST', '/income-tax/calculator/tax-pl', {
    financial_year: '2023-24',
    assessee_type: 'Individual',
    residential_status: 'Resident',
    income_sources: {
      salary: { amount: 800000 },
      other_sources: { amount: 50000 }
    },
    deductions: {
      section_80c: { amount: 150000 },
      section_80d: { amount: 25000 }
    }
  }, true, 'Calculate Income Tax P&L via Sandbox');

  // 23.2 Income Tax Calculator - Upload Trading Data (Sandbox API)
  await apiCall('POST', '/income-tax/calculator/upload-trading-data', {
    financial_year: '2023-24',
    trading_data: [
      {
        security_name: 'RELIANCE',
        buy_date: '2023-04-01',
        sell_date: '2023-06-15',
        buy_price: 2500,
        sell_price: 2800,
        quantity: 10
      }
    ]
  }, true, 'Upload Trading Data for Tax Calculation');

  // 23.3 Finbox Credit Score (if available)
  await apiCall('GET', '/finbox/credit-score', null, true, 'Get Credit Score via Finbox');

  // 23.4 E-Invoice Generation (Sandbox API)
  await apiCall('POST', '/einvoice/generate', {
    invoice_number: 'INV001',
    invoice_date: '2024-03-15',
    supplier_gstin: '27ABCDE1234F1Z5',
    buyer_gstin: '29AABCU9603R1ZX',
    items: [
      {
        description: 'Test Product',
        hsn_code: '8517',
        quantity: 1,
        unit_price: 10000,
        taxable_amount: 10000,
        igst_rate: 18,
        igst_amount: 1800
      }
    ]
  }, true, 'Generate E-Invoice via Sandbox');

  // 23.5 E-Way Bill Generation (Sandbox API)
  await apiCall('POST', '/ewaybill/generate', {
    invoice_number: 'INV001',
    invoice_date: '2024-03-15',
    supplier_gstin: '27ABCDE1234F1Z5',
    buyer_gstin: '29AABCU9603R1ZX',
    transport_mode: 'Road',
    vehicle_number: 'MH12AB1234',
    distance: 100,
    items: [
      {
        description: 'Test Product',
        hsn_code: '8517',
        quantity: 1,
        taxable_amount: 10000,
        igst_amount: 1800
      }
    ]
  }, true, 'Generate E-Way Bill via Sandbox');
}
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

    // Phase 13: Admin Portal APIs
    await testAdminAPIs();

    // Phase 14: Distributor Management
    await testDistributorAPIs();

    // Phase 15: Salesman Management
    await testSalesmanAPIs();

    // Phase 16: Target Management
    await testTargetAPIs();

    // Phase 17: Commission & Payout Management
    await testCommissionPayoutAPIs();

    // Phase 18: Referral System
    await testReferralAPIs();

    // Phase 19: Product Attributes
    await testAttributeAPIs();

    // Phase 20: Blog & Content Management
    await testBlogAPIs();

    // Phase 22: Review System
    await testReviewAPIs();

    // Phase 23: Income Tax & Advanced Integrations (Sandbox APIs)
    await testAdvancedIntegrations();

    // Phase 24: File Management (Enhanced)
    await testFileManagement();

    // Phase 25: Tally Import & Export
    await testTallyIntegration();

    // Phase 26: SEO Management
    await testSEOManagement();

    // Phase 27: Cron Job Management
    await testCronManagement();

    // Phase 28: Finbox Integration (Enhanced)
    await testFinboxIntegration();

    // Phase 29: HSN Code Management (Enhanced)
    await testHSNManagement();

  } catch (error) {
    console.log('\n💥 Test execution crashed:', error.message);
  } finally {
    // Save results and show summary
    saveResults();
    showSummary();
  }
}

// Show test summary with enhanced reporting
function showSummary() {
  console.log('\n📊 COMPREHENSIVE TEST RESULTS');
  console.log('==============================');
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`📊 Total: ${testResults.summary.total}`);
  console.log(`⏱️  Duration: ${testResults.summary.duration}ms`);
  console.log(`📈 Success Rate: ${testResults.summary.successRate}%`);

  // Show phase-wise breakdown
  console.log('\n📋 Phase-wise Breakdown:');
  Object.entries(testResults.summary.phaseBreakdown).forEach(([phase, stats]) => {
    if (stats.total > 0) {
      const phaseSuccessRate = ((stats.passed / stats.total) * 100).toFixed(1);
      console.log(`  ${phase.replace('_', ' ').toUpperCase()}: ${stats.passed}/${stats.total} (${phaseSuccessRate}%)`);
    }
  });

  // Show Sandbox API specific results
  console.log('\n🔗 Sandbox API Results:');
  const gstSuccess = testResults.sandboxApiResults.gstApis.filter(api => api.success).length;
  const gstTotal = testResults.sandboxApiResults.gstApis.length;
  const tdsSuccess = testResults.sandboxApiResults.tdsApis.filter(api => api.success).length;
  const tdsTotal = testResults.sandboxApiResults.tdsApis.length;
  const itSuccess = testResults.sandboxApiResults.incomeTaxApis.filter(api => api.success).length;
  const itTotal = testResults.sandboxApiResults.incomeTaxApis.length;

  console.log(`  GST APIs: ${gstSuccess}/${gstTotal} ${gstTotal > 0 ? `(${((gstSuccess/gstTotal)*100).toFixed(1)}%)` : ''}`);
  console.log(`  TDS APIs: ${tdsSuccess}/${tdsTotal} ${tdsTotal > 0 ? `(${((tdsSuccess/tdsTotal)*100).toFixed(1)}%)` : ''}`);
  console.log(`  Income Tax APIs: ${itSuccess}/${itTotal} ${itTotal > 0 ? `(${((itSuccess/itTotal)*100).toFixed(1)}%)` : ''}`);

  // Show API coverage
  console.log('\n📊 API Coverage Analysis:');
  console.log(`  Total Endpoints Tested: ${testResults.coverage.totalEndpointsTested}`);
  console.log(`  Unique Endpoints: ${testResults.coverage.uniqueEndpoints}`);
  console.log(`  HTTP Methods: GET(${testResults.coverage.httpMethods.GET}) POST(${testResults.coverage.httpMethods.POST}) PUT(${testResults.coverage.httpMethods.PUT}) DELETE(${testResults.coverage.httpMethods.DELETE})`);

  // Show failed tests
  if (testResults.failedTests.length > 0) {
    console.log('\n❌ Failed Tests (Top 10):');
    testResults.failedTests.slice(0, 10).forEach(test => {
      console.log(`  - ${test.description} (${test.status}): ${test.error}`);
    });
    if (testResults.failedTests.length > 10) {
      console.log(`  ... and ${testResults.failedTests.length - 10} more (see JSON report)`);
    }
  }

  // Show performance insights
  console.log('\n⚡ Performance Insights:');
  console.log(`  Average Response Time: ${testResults.performance.averageResponseTime.toFixed(0)}ms`);
  
  if (testResults.performance.slowestTests.length > 0) {
    console.log('  Slowest APIs (>1s):');
    testResults.performance.slowestTests.slice(0, 5).forEach(test => {
      console.log(`    - ${test.description}: ${test.responseTime}ms`);
    });
  }

  console.log('\n💾 Report Generated:');
  console.log('  - api-test-results.json (consolidated results with all data)');
  console.log('\n📋 Use this report to identify and fix issues systematically');
  console.log(`🎯 Current API Coverage: ${testResults.coverage.totalEndpointsTested} endpoints tested`);
}

// Run the comprehensive test
runComprehensiveTests().catch(console.error);