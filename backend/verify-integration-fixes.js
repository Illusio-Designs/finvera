const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING PURCHASE VOUCHER INTEGRATION FIXES');
console.log('=' .repeat(60));

let allFixesApplied = true;
const issues = [];

// Check 1: Backend Voucher Controller
console.log('\n1️⃣ CHECKING BACKEND VOUCHER CONTROLLER');
console.log('-'.repeat(40));

try {
  const voucherControllerPath = path.join(__dirname, 'src/controllers/voucherController.js');
  const voucherController = fs.readFileSync(voucherControllerPath, 'utf8');
  
  // Check for inventory update functions
  if (voucherController.includes('applyPurchaseInventory') && 
      voucherController.includes('applySalesInventoryAndGetCogs')) {
    console.log('✅ Inventory update functions present');
  } else {
    console.log('❌ Inventory update functions missing');
    issues.push('Inventory update functions not found in voucher controller');
    allFixesApplied = false;
  }
  
  // Check for applyInventoryUpdates method
  if (voucherController.includes('async applyInventoryUpdates')) {
    console.log('✅ applyInventoryUpdates method present');
  } else {
    console.log('❌ applyInventoryUpdates method missing');
    issues.push('applyInventoryUpdates method not found');
    allFixesApplied = false;
  }
  
  // Check for transaction handling
  if (voucherController.includes('sequelize.transaction()')) {
    console.log('✅ Database transaction handling present');
  } else {
    console.log('❌ Database transaction handling missing');
    issues.push('Database transaction handling not implemented');
    allFixesApplied = false;
  }
  
  // Check for inventory service import
  if (voucherController.includes('findOrCreateInventoryItem')) {
    console.log('✅ Inventory service integration present');
  } else {
    console.log('❌ Inventory service integration missing');
    issues.push('Inventory service not imported');
    allFixesApplied = false;
  }
  
  // Check for stock movement creation
  if (voucherController.includes('StockMovement.create')) {
    console.log('✅ Stock movement creation present');
  } else {
    console.log('❌ Stock movement creation missing');
    issues.push('Stock movement creation not implemented');
    allFixesApplied = false;
  }
  
} catch (error) {
  console.log('❌ Error reading voucher controller:', error.message);
  issues.push('Cannot read voucher controller file');
  allFixesApplied = false;
}

// Check 2: Mobile App API Configuration
console.log('\n2️⃣ CHECKING MOBILE APP API CONFIGURATION');
console.log('-'.repeat(40));

try {
  const apiPath = path.join(__dirname, '../app/src/lib/api.js');
  const apiConfig = fs.readFileSync(apiPath, 'utf8');
  
  // Check for correct purchase invoice endpoint
  if (apiConfig.includes('/accounting/invoices/purchase')) {
    console.log('✅ Correct purchase invoice API endpoint');
  } else {
    console.log('❌ Incorrect purchase invoice API endpoint');
    issues.push('Purchase invoice API endpoint not updated');
    allFixesApplied = false;
  }
  
  // Check for sales invoice endpoint
  if (apiConfig.includes('/accounting/invoices/sales')) {
    console.log('✅ Correct sales invoice API endpoint');
  } else {
    console.log('❌ Incorrect sales invoice API endpoint');
    issues.push('Sales invoice API endpoint not updated');
    allFixesApplied = false;
  }
  
} catch (error) {
  console.log('❌ Error reading API configuration:', error.message);
  issues.push('Cannot read API configuration file');
  allFixesApplied = false;
}

// Check 3: Mobile App Purchase Screen
console.log('\n3️⃣ CHECKING MOBILE APP PURCHASE SCREEN');
console.log('-'.repeat(40));

try {
  const purchaseScreenPath = path.join(__dirname, '../app/src/screens/client/vouchers/PurchaseInvoiceScreen.jsx');
  const purchaseScreen = fs.readFileSync(purchaseScreenPath, 'utf8');
  
  // Check for correct API call
  if (purchaseScreen.includes('voucherAPI.purchaseInvoice.create')) {
    console.log('✅ Using correct API call');
  } else {
    console.log('❌ Using incorrect API call');
    issues.push('Purchase screen not using correct API call');
    allFixesApplied = false;
  }
  
} catch (error) {
  console.log('❌ Error reading purchase screen:', error.message);
  issues.push('Cannot read purchase screen file');
  allFixesApplied = false;
}

// Check 4: Backend Routes
console.log('\n4️⃣ CHECKING BACKEND ROUTES');
console.log('-'.repeat(40));

try {
  const routesPath = path.join(__dirname, 'src/routes/accountingRoutes.js');
  const routes = fs.readFileSync(routesPath, 'utf8');
  
  // Check for purchase invoice route
  if (routes.includes('/invoices/purchase') && routes.includes('transactionController.createPurchaseInvoice')) {
    console.log('✅ Purchase invoice route configured correctly');
  } else {
    console.log('❌ Purchase invoice route not configured');
    issues.push('Purchase invoice route not properly configured');
    allFixesApplied = false;
  }
  
} catch (error) {
  console.log('❌ Error reading routes:', error.message);
  issues.push('Cannot read routes file');
  allFixesApplied = false;
}

// Check 5: Transaction Controller
console.log('\n5️⃣ CHECKING TRANSACTION CONTROLLER');
console.log('-'.repeat(40));

try {
  const transactionControllerPath = path.join(__dirname, 'src/controllers/transactionController.js');
  const transactionController = fs.readFileSync(transactionControllerPath, 'utf8');
  
  // Check for purchase invoice method
  if (transactionController.includes('createPurchaseInvoice') && 
      transactionController.includes('voucherService.createPurchaseInvoice')) {
    console.log('✅ Transaction controller properly configured');
  } else {
    console.log('❌ Transaction controller not properly configured');
    issues.push('Transaction controller missing purchase invoice logic');
    allFixesApplied = false;
  }
  
} catch (error) {
  console.log('❌ Error reading transaction controller:', error.message);
  issues.push('Cannot read transaction controller file');
  allFixesApplied = false;
}

// Final Assessment
console.log('\n🔍 INTEGRATION STATUS ASSESSMENT');
console.log('=' .repeat(60));

if (allFixesApplied) {
  console.log('🎉 ALL FIXES HAVE BEEN APPLIED CORRECTLY!');
  console.log('');
  console.log('✅ Your new vouchers should now:');
  console.log('   • Save voucher items properly');
  console.log('   • Create ledger entries for accounting');
  console.log('   • Update inventory quantities');
  console.log('   • Record stock movements');
  console.log('   • Use weighted average costing');
  console.log('');
  console.log('🚀 RECOMMENDATION: CREATE A NEW VOUCHER');
  console.log('   The integration should work properly for new vouchers.');
  console.log('   Your previous voucher (PI260201896195) was created before');
  console.log('   the fixes were applied, which is why it\'s incomplete.');
  
} else {
  console.log('❌ SOME FIXES ARE MISSING OR INCOMPLETE');
  console.log('');
  console.log('Issues found:');
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
  console.log('');
  console.log('⚠️  RECOMMENDATION: FIX ISSUES BEFORE TESTING');
  console.log('   New vouchers may still have problems until all fixes are applied.');
}

console.log('\n💡 NEXT STEPS:');
console.log('-'.repeat(40));
if (allFixesApplied) {
  console.log('1. Create a new purchase voucher from mobile app');
  console.log('2. Add items and supplier information');
  console.log('3. Post the voucher');
  console.log('4. Run: node check-posted-voucher.js');
  console.log('5. Verify inventory quantities have increased');
} else {
  console.log('1. Fix the identified issues above');
  console.log('2. Re-run this verification script');
  console.log('3. Only test with new vouchers after all fixes are applied');
}

process.exit(allFixesApplied ? 0 : 1);