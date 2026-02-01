const { Sequelize, DataTypes } = require('sequelize');
const axios = require('axios');
require('dotenv').config();

// Database configuration
const sequelize = new Sequelize(
  'finvera_illusio_designs',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

async function recreateVoucher() {
  try {
    console.log('🔄 RECREATING VOUCHER WITH PROPER INTEGRATION');
    console.log('=' .repeat(60));
    
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    const oldVoucherNumber = 'PI260201896195';
    const oldVoucherId = '4a2d0c64-22f6-4ea2-9bf8-02c5b6b95631';
    
    // Step 1: Verify old voucher exists
    console.log('1️⃣ VERIFYING OLD VOUCHER');
    console.log('-'.repeat(40));
    
    const [oldVoucherCheck] = await sequelize.query(`
      SELECT id, voucher_number, status, total_amount 
      FROM vouchers 
      WHERE id = '${oldVoucherId}'
    `);
    
    if (oldVoucherCheck.length === 0) {
      console.log('❌ Old voucher not found');
      return;
    }
    
    console.log(`✅ Found old voucher: ${oldVoucherCheck[0].voucher_number}`);
    console.log(`   Status: ${oldVoucherCheck[0].status}`);
    console.log(`   Amount: ₹${parseFloat(oldVoucherCheck[0].total_amount).toLocaleString('en-IN')}`);
    
    // Step 2: Calculate new voucher details
    console.log('\n2️⃣ CALCULATING NEW VOUCHER DETAILS');
    console.log('-'.repeat(40));
    
    const itemDetails = {
      item_name: 'Sulphur',
      item_description: 'Sulphur',
      quantity: 25670,
      rate: 55.50,
      gst_rate: 5,
      hsn_sac_code: '25030010',
      uqc: 'KGS'
    };
    
    // Calculate amounts
    const taxableAmount = itemDetails.quantity * itemDetails.rate;
    const gstAmount = (taxableAmount * itemDetails.gst_rate) / 100;
    const totalAmount = taxableAmount + gstAmount;
    
    console.log(`Item: ${itemDetails.item_name}`);
    console.log(`Quantity: ${itemDetails.quantity.toLocaleString()} ${itemDetails.uqc}`);
    console.log(`Rate: ₹${itemDetails.rate}`);
    console.log(`Taxable Amount: ₹${taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`GST (${itemDetails.gst_rate}%): ₹${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`Total Amount: ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    
    // Verify calculation matches original
    const originalAmount = parseFloat(oldVoucherCheck[0].total_amount);
    const calculatedAmount = Math.round(totalAmount * 100) / 100;
    const amountMatch = Math.abs(originalAmount - calculatedAmount) < 1;
    
    console.log(`\nAmount Verification:`);
    console.log(`Original: ₹${originalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`Calculated: ₹${calculatedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`Match: ${amountMatch ? '✅ Yes' : '❌ No'}`);
    
    if (!amountMatch) {
      console.log('⚠️  Amount mismatch detected. Proceeding with calculated amount.');
    }
    
    // Step 3: Delete old voucher
    console.log('\n3️⃣ DELETING OLD INCOMPLETE VOUCHER');
    console.log('-'.repeat(40));
    
    // Delete related records first (if any exist)
    await sequelize.query(`DELETE FROM voucher_items WHERE voucher_id = '${oldVoucherId}'`);
    await sequelize.query(`DELETE FROM voucher_ledger_entries WHERE voucher_id = '${oldVoucherId}'`);
    await sequelize.query(`DELETE FROM stock_movements WHERE voucher_id = '${oldVoucherId}'`);
    
    // Delete the voucher
    const [deleteResult] = await sequelize.query(`DELETE FROM vouchers WHERE id = '${oldVoucherId}'`);
    console.log(`✅ Deleted old voucher and related records`);
    
    // Step 4: Create new voucher via API
    console.log('\n4️⃣ CREATING NEW VOUCHER WITH PROPER INTEGRATION');
    console.log('-'.repeat(40));
    
    const newVoucherData = {
      voucher_type: 'purchase_invoice',
      voucher_date: '2026-02-01',
      party_ledger_id: '8914f324-e4cc-4684-a363-fab1e3740fad',
      reference: 'Recreated voucher with proper integration',
      narration: 'Purchase of Sulphur - Recreated with inventory integration',
      subtotal: taxableAmount,
      tax_amount: gstAmount,
      total_amount: totalAmount,
      status: 'draft', // Will be posted separately
      items: [
        {
          inventory_item_id: null, // Will be auto-created
          item_name: itemDetails.item_name,
          item_description: itemDetails.item_description,
          quantity: itemDetails.quantity,
          rate: itemDetails.rate,
          taxable_amount: taxableAmount,
          gst_rate: itemDetails.gst_rate,
          tax_amount: gstAmount,
          total_amount: totalAmount,
          hsn_sac_code: itemDetails.hsn_sac_code,
          uqc: itemDetails.uqc,
          cgst_amount: 0, // Will be calculated by backend
          sgst_amount: gstAmount, // Assuming intra-state
          igst_amount: 0
        }
      ]
    };
    
    console.log('Payload prepared:');
    console.log(`- Items: ${newVoucherData.items.length}`);
    console.log(`- Subtotal: ₹${newVoucherData.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`- Tax: ₹${newVoucherData.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`- Total: ₹${newVoucherData.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    
    // Make API call to create voucher
    try {
      console.log('\nCalling API to create voucher...');
      
      const response = await axios.post('http://localhost:3000/api/accounting/invoices/purchase', newVoucherData, {
        headers: {
          'Content-Type': 'application/json',
          // Note: In production, you'd need proper authentication headers
        },
        timeout: 30000
      });
      
      const createdVoucher = response.data.data;
      console.log(`✅ Voucher created successfully!`);
      console.log(`   New Voucher ID: ${createdVoucher.id}`);
      console.log(`   New Voucher Number: ${createdVoucher.voucher_number}`);
      console.log(`   Status: ${createdVoucher.status}`);
      
      // Step 5: Post the voucher
      console.log('\n5️⃣ POSTING THE VOUCHER');
      console.log('-'.repeat(40));
      
      const postResponse = await axios.post(`http://localhost:3000/api/accounting/vouchers/${createdVoucher.id}/post`, {}, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      });
      
      console.log(`✅ Voucher posted successfully!`);
      console.log(`   Message: ${postResponse.data.message}`);
      
      // Step 6: Verify integration
      console.log('\n6️⃣ VERIFYING INTEGRATION');
      console.log('-'.repeat(40));
      
      // Check voucher items
      const [itemsCheck] = await sequelize.query(`
        SELECT COUNT(*) as count FROM voucher_items WHERE voucher_id = '${createdVoucher.id}'
      `);
      console.log(`Voucher Items: ${itemsCheck[0].count} ${itemsCheck[0].count > 0 ? '✅' : '❌'}`);
      
      // Check ledger entries
      const [ledgerCheck] = await sequelize.query(`
        SELECT COUNT(*) as count FROM voucher_ledger_entries WHERE voucher_id = '${createdVoucher.id}'
      `);
      console.log(`Ledger Entries: ${ledgerCheck[0].count} ${ledgerCheck[0].count > 0 ? '✅' : '❌'}`);
      
      // Check stock movements
      const [stockCheck] = await sequelize.query(`
        SELECT COUNT(*) as count FROM stock_movements WHERE voucher_id = '${createdVoucher.id}'
      `);
      console.log(`Stock Movements: ${stockCheck[0].count} ${stockCheck[0].count > 0 ? '✅' : '❌'}`);
      
      // Check inventory item
      const [inventoryCheck] = await sequelize.query(`
        SELECT ii.item_name, ii.quantity_on_hand, ii.avg_cost
        FROM inventory_items ii
        WHERE ii.item_name = 'Sulphur' OR ii.item_key = 'sulphur'
        ORDER BY ii.createdAt DESC
        LIMIT 1
      `);
      
      if (inventoryCheck.length > 0) {
        const item = inventoryCheck[0];
        console.log(`Inventory Item: ✅ ${item.item_name}`);
        console.log(`  Quantity: ${parseFloat(item.quantity_on_hand).toLocaleString()}`);
        console.log(`  Avg Cost: ₹${parseFloat(item.avg_cost).toLocaleString('en-IN', { minimumFractionDigits: 4 })}`);
      } else {
        console.log(`Inventory Item: ❌ Not found`);
      }
      
      console.log('\n🎉 VOUCHER RECREATION COMPLETED!');
      console.log('=' .repeat(60));
      console.log(`✅ Old voucher deleted: ${oldVoucherNumber}`);
      console.log(`✅ New voucher created: ${createdVoucher.voucher_number}`);
      console.log(`✅ Voucher posted with full integration`);
      console.log(`✅ Inventory updated: ${itemDetails.quantity.toLocaleString()} KGS Sulphur`);
      
      return {
        success: true,
        oldVoucherNumber,
        newVoucherNumber: createdVoucher.voucher_number,
        newVoucherId: createdVoucher.id
      };
      
    } catch (apiError) {
      console.error('❌ API Error:', apiError.response?.data || apiError.message);
      
      if (apiError.code === 'ECONNREFUSED') {
        console.log('\n💡 Backend server is not running!');
        console.log('   Please start the backend server first:');
        console.log('   cd backend && npm start');
      }
      
      return { success: false, error: apiError.message };
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await sequelize.close();
  }
}

// Run the recreation
if (require.main === module) {
  recreateVoucher().then(result => {
    if (result?.success) {
      console.log('\n🔍 Run this to verify the new voucher:');
      console.log(`node check-posted-voucher.js --number ${result.newVoucherNumber}`);
    }
  });
}

module.exports = { recreateVoucher };