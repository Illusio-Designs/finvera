/**
 * Debug GST Calculation
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const GSTCalculationService = require('../src/services/gstCalculationService');

console.log('🔍 Debugging GST Calculation...\n');

// Test individual item GST calculation
console.log('1. Testing individual item GST calculation:');
const itemResult = GSTCalculationService.calculateItemGST(
  90000, // taxable amount (2 * 50000 * 0.9)
  18,    // GST rate
  'Maharashtra', // supplier state
  'Maharashtra'  // place of supply
);

console.log('Item GST Result:', itemResult);

// Test voucher GST calculation
console.log('\n2. Testing voucher GST calculation:');
const invoiceItems = [
  {
    item_description: 'Laptop Computer',
    hsn_sac_code: '847130',
    quantity: 2,
    rate: 50000,
    discount_percent: 10,
    gst_rate: 18
  },
  {
    item_description: 'Software License',
    hsn_sac_code: '998313',
    quantity: 1,
    rate: 25000,
    discount_percent: 0,
    gst_rate: 18
  }
];

console.log('Input items:', JSON.stringify(invoiceItems, null, 2));

const voucherResult = GSTCalculationService.calculateVoucherGST(
  invoiceItems,
  'Maharashtra', // Supplier state
  'Maharashtra'  // Place of supply (intrastate)
);

console.log('Voucher GST Result:', JSON.stringify(voucherResult, null, 2));

// Test intrastate detection
console.log('\n3. Testing intrastate detection:');
const isIntrastate = GSTCalculationService.isIntrastate('Maharashtra', 'Maharashtra');
console.log('Is intrastate (Maharashtra -> Maharashtra):', isIntrastate);

const isInterstate = GSTCalculationService.isIntrastate('Maharashtra', 'Karnataka');
console.log('Is intrastate (Maharashtra -> Karnataka):', isInterstate);

// Test individual calculations step by step
console.log('\n4. Step-by-step calculation:');

// Item 1: 2 * 50000 = 100000, discount 10% = 10000, taxable = 90000
const item1Taxable = 2 * 50000 * (1 - 10/100);
console.log('Item 1 taxable amount:', item1Taxable);

const item1GST = GSTCalculationService.calculateItemGST(item1Taxable, 18, 'Maharashtra', 'Maharashtra');
console.log('Item 1 GST:', item1GST);

// Item 2: 1 * 25000 = 25000, no discount, taxable = 25000
const item2Taxable = 1 * 25000;
console.log('Item 2 taxable amount:', item2Taxable);

const item2GST = GSTCalculationService.calculateItemGST(item2Taxable, 18, 'Maharashtra', 'Maharashtra');
console.log('Item 2 GST:', item2GST);

console.log('\n5. Expected totals:');
console.log('Total taxable:', item1Taxable + item2Taxable);
console.log('Total CGST:', item1GST.cgstAmount + item2GST.cgstAmount);
console.log('Total SGST:', item1GST.sgstAmount + item2GST.sgstAmount);
console.log('Total IGST:', item1GST.igstAmount + item2GST.igstAmount);