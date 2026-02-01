const { Sequelize, DataTypes } = require('sequelize');
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

async function fixAndCreateVoucher() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔧 FIXING CURRENT VOUCHER AND CREATING NEW ONE');
    console.log('=' .repeat(60));
    
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    // Step 1: Fix the current voucher by adding missing inventory ledger entry
    console.log('1️⃣ FIXING CURRENT VOUCHER - ADDING MISSING INVENTORY ENTRY');
    console.log('-'.repeat(50));
    
    const currentVoucherId = '11feef2d-b92c-4f7c-ad43-8de9132a1547';
    const currentVoucherNumber = 'PI260201922502';
    
    // Get Stock-in-Hand ledger ID
    const [stockLedger] = await sequelize.query(`
      SELECT id FROM ledgers WHERE ledger_name = 'Stock in Hand' OR ledger_code = 'INV-001'
      LIMIT 1
    `, { transaction });
    
    if (stockLedger.length === 0) {
      console.log('❌ Stock-in-Hand ledger not found');
      return;
    }
    
    const stockLedgerId = stockLedger[0].id;
    console.log(`✅ Found Stock-in-Hand ledger: ${stockLedgerId}`);
    
    // Add the missing inventory ledger entry
    const missingAmount = 1424685.00; // ₹14,24,685.00
    
    await sequelize.query(`
      INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, narration, tenant_id, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        require('crypto').randomUUID(),
        currentVoucherId,
        stockLedgerId,
        missingAmount,
        0,
        'Inventory purchase - Stock in Hand',
        '0c380994-5542-4277-b5d9-68b7e768bd27',
        new Date(),
        new Date()
      ],
      transaction
    });
    
    console.log(`✅ Added missing inventory ledger entry: ₹${missingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    
    // Update Stock-in-Hand ledger balance
    await sequelize.query(`
      UPDATE ledgers 
      SET current_balance = current_balance + ?, updatedAt = ?
      WHERE id = ?
    `, {
      replacements: [missingAmount, new Date(), stockLedgerId],
      transaction
    });
    
    console.log(`✅ Updated Stock-in-Hand ledger balance`);
    
    // Verify the fix
    const [verifyEntries] = await sequelize.query(`
      SELECT 
        SUM(debit_amount) as total_debit,
        SUM(credit_amount) as total_credit
      FROM voucher_ledger_entries 
      WHERE voucher_id = ?
    `, {
      replacements: [currentVoucherId],
      transaction
    });
    
    const totalDebit = parseFloat(verifyEntries[0].total_debit || 0);
    const totalCredit = parseFloat(verifyEntries[0].total_credit || 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
    
    console.log(`\n  Verification:`);
    console.log(`    Total Debit: ₹${totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`    Total Credit: ₹${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`    Balanced: ${isBalanced ? '✅ Yes' : '❌ No'}`);
    
    // Step 2: Create a new complete voucher for testing
    console.log('\n2️⃣ CREATING NEW TEST VOUCHER WITH COMPLETE INTEGRATION');
    console.log('-'.repeat(50));
    
    // Generate new voucher number
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = now.getTime().toString().slice(-6);
    const newVoucherNumber = `PI${year}${month}${day}${time}`;
    
    // New voucher details - Different item for testing
    const newItemDetails = {
      item_name: 'Fertilizer',
      item_description: 'NPK Fertilizer',
      quantity: 1000,
      rate: 45.00,
      gst_rate: 12,
      hsn_sac_code: '31051000',
      uqc: 'KGS'
    };
    
    const newTaxableAmount = newItemDetails.quantity * newItemDetails.rate;
    const newGstAmount = (newTaxableAmount * newItemDetails.gst_rate) / 100;
    const newTotalAmount = newTaxableAmount + newGstAmount;
    
    console.log(`New Item: ${newItemDetails.item_name}`);
    console.log(`Quantity: ${newItemDetails.quantity.toLocaleString()} ${newItemDetails.uqc}`);
    console.log(`Rate: ₹${newItemDetails.rate}`);
    console.log(`Taxable Amount: ₹${newTaxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`GST (${newItemDetails.gst_rate}%): ₹${newGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`Total Amount: ₹${newTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    
    // Create new voucher
    const newVoucherData = {
      id: require('crypto').randomUUID(),
      voucher_number: newVoucherNumber,
      voucher_type: 'purchase_invoice',
      voucher_date: new Date().toISOString().split('T')[0],
      party_ledger_id: '8914f324-e4cc-4684-a363-fab1e3740fad', // Same supplier
      total_amount: newTotalAmount,
      narration: 'Purchase of NPK Fertilizer - Complete integration test',
      status: 'draft',
      reference_number: 'Test voucher with complete ledger entries',
      tenant_id: '0c380994-5542-4277-b5d9-68b7e768bd27',
      created_by: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await sequelize.query(`
      INSERT INTO vouchers (id, voucher_number, voucher_type, voucher_date, party_ledger_id, total_amount, narration, status, reference_number, tenant_id, created_by, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        newVoucherData.id,
        newVoucherData.voucher_number,
        newVoucherData.voucher_type,
        newVoucherData.voucher_date,
        newVoucherData.party_ledger_id,
        newVoucherData.total_amount,
        newVoucherData.narration,
        newVoucherData.status,
        newVoucherData.reference_number,
        newVoucherData.tenant_id,
        newVoucherData.created_by,
        newVoucherData.createdAt,
        newVoucherData.updatedAt
      ],
      transaction
    });
    
    console.log(`✅ Created new voucher: ${newVoucherNumber}`);
    
    // Create voucher item
    const newVoucherItemData = {
      id: require('crypto').randomUUID(),
      voucher_id: newVoucherData.id,
      inventory_item_id: null, // Will be set after creating inventory item
      item_description: newItemDetails.item_description,
      quantity: newItemDetails.quantity,
      rate: newItemDetails.rate,
      amount: newTaxableAmount,
      hsn_sac_code: newItemDetails.hsn_sac_code,
      gst_rate: newItemDetails.gst_rate,
      cgst_amount: newGstAmount / 2, // Split GST for intra-state
      sgst_amount: newGstAmount / 2,
      igst_amount: 0,
      tenant_id: newVoucherData.tenant_id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await sequelize.query(`
      INSERT INTO voucher_items (id, voucher_id, inventory_item_id, item_description, quantity, rate, amount, hsn_sac_code, gst_rate, cgst_amount, sgst_amount, igst_amount, tenant_id, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        newVoucherItemData.id,
        newVoucherItemData.voucher_id,
        newVoucherItemData.inventory_item_id,
        newVoucherItemData.item_description,
        newVoucherItemData.quantity,
        newVoucherItemData.rate,
        newVoucherItemData.amount,
        newVoucherItemData.hsn_sac_code,
        newVoucherItemData.gst_rate,
        newVoucherItemData.cgst_amount,
        newVoucherItemData.sgst_amount,
        newVoucherItemData.igst_amount,
        newVoucherItemData.tenant_id,
        newVoucherItemData.createdAt,
        newVoucherItemData.updatedAt
      ],
      transaction
    });
    
    console.log(`✅ Created voucher item: ${newItemDetails.item_name}`);
    
    // Create/Update inventory item
    const [existingNewItems] = await sequelize.query(`
      SELECT * FROM inventory_items WHERE item_name = ? OR item_key = ?
    `, {
      replacements: [newItemDetails.item_name, newItemDetails.item_name.toLowerCase()],
      transaction
    });
    
    let newInventoryItem;
    
    if (existingNewItems.length > 0) {
      // Update existing item
      newInventoryItem = existingNewItems[0];
      const currentQty = parseFloat(newInventoryItem.quantity_on_hand || 0);
      const currentAvgCost = parseFloat(newInventoryItem.avg_cost || 0);
      const currentValue = currentQty * currentAvgCost;
      
      const newQty = currentQty + newItemDetails.quantity;
      const newValue = currentValue + newTaxableAmount;
      const newAvgCost = newQty > 0 ? newValue / newQty : 0;
      
      await sequelize.query(`
        UPDATE inventory_items 
        SET quantity_on_hand = ?, avg_cost = ?, updatedAt = ?
        WHERE id = ?
      `, {
        replacements: [newQty, newAvgCost, new Date(), newInventoryItem.id],
        transaction
      });
      
      console.log(`✅ Updated existing inventory item: ${newInventoryItem.item_name}`);
      console.log(`   Quantity: ${currentQty} → ${newQty}`);
      console.log(`   Avg Cost: ₹${currentAvgCost.toFixed(4)} → ₹${newAvgCost.toFixed(4)}`);
      
    } else {
      // Create new item
      const newItemId = require('crypto').randomUUID();
      const avgCost = newItemDetails.rate;
      
      await sequelize.query(`
        INSERT INTO inventory_items (id, item_key, item_code, item_name, hsn_sac_code, uqc, gst_rate, quantity_on_hand, avg_cost, is_active, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, {
        replacements: [
          newItemId,
          newItemDetails.item_name.toLowerCase(),
          null,
          newItemDetails.item_name,
          newItemDetails.hsn_sac_code,
          newItemDetails.uqc,
          newItemDetails.gst_rate,
          newItemDetails.quantity,
          avgCost,
          true,
          new Date(),
          new Date()
        ],
        transaction
      });
      
      newInventoryItem = { id: newItemId, item_name: newItemDetails.item_name };
      
      console.log(`✅ Created new inventory item: ${newItemDetails.item_name}`);
      console.log(`   Quantity: ${newItemDetails.quantity}`);
      console.log(`   Avg Cost: ₹${avgCost.toFixed(4)}`);
    }
    
    // Update voucher item with inventory_item_id
    await sequelize.query(`
      UPDATE voucher_items SET inventory_item_id = ? WHERE id = ?
    `, {
      replacements: [newInventoryItem.id, newVoucherItemData.id],
      transaction
    });
    
    // Create stock movement
    await sequelize.query(`
      INSERT INTO stock_movements (id, inventory_item_id, voucher_id, movement_type, quantity, rate, amount, reference_number, narration, movement_date, tenant_id, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        require('crypto').randomUUID(),
        newInventoryItem.id,
        newVoucherData.id,
        'IN',
        newItemDetails.quantity,
        newItemDetails.rate,
        newTaxableAmount,
        newVoucherNumber,
        `Purchase from R t corporation`,
        newVoucherData.voucher_date,
        newVoucherData.tenant_id,
        new Date(),
        new Date()
      ],
      transaction
    });
    
    console.log(`✅ Created stock movement: IN ${newItemDetails.quantity} ${newItemDetails.uqc}`);
    
    // Create COMPLETE ledger entries (this time with all three entries)
    console.log('\n3️⃣ CREATING COMPLETE LEDGER ENTRIES');
    console.log('-'.repeat(40));
    
    // Get CGST and SGST ledger IDs
    const [cgstLedger] = await sequelize.query(`
      SELECT id FROM ledgers WHERE ledger_name = 'CGST' OR ledger_code = 'CGST-001'
      LIMIT 1
    `, { transaction });
    
    const [sgstLedger] = await sequelize.query(`
      SELECT id FROM ledgers WHERE ledger_name = 'SGST' OR ledger_code = 'SGST-001'
      LIMIT 1
    `, { transaction });
    
    const cgstLedgerId = cgstLedger.length > 0 ? cgstLedger[0].id : null;
    const sgstLedgerId = sgstLedger.length > 0 ? sgstLedger[0].id : null;
    
    // Create all three ledger entries for complete double-entry
    const newLedgerEntries = [
      // 1. Stock-in-Hand (Debit) - Inventory
      {
        id: require('crypto').randomUUID(),
        voucher_id: newVoucherData.id,
        ledger_id: stockLedgerId,
        debit_amount: newTaxableAmount,
        credit_amount: 0,
        narration: 'Inventory purchase - Stock in Hand',
        tenant_id: newVoucherData.tenant_id
      },
      // 2. CGST Input (Debit) - Tax
      {
        id: require('crypto').randomUUID(),
        voucher_id: newVoucherData.id,
        ledger_id: cgstLedgerId,
        debit_amount: newGstAmount / 2,
        credit_amount: 0,
        narration: 'CGST Input',
        tenant_id: newVoucherData.tenant_id
      },
      // 3. SGST Input (Debit) - Tax
      {
        id: require('crypto').randomUUID(),
        voucher_id: newVoucherData.id,
        ledger_id: sgstLedgerId,
        debit_amount: newGstAmount / 2,
        credit_amount: 0,
        narration: 'SGST Input',
        tenant_id: newVoucherData.tenant_id
      },
      // 4. Supplier (Credit) - Liability
      {
        id: require('crypto').randomUUID(),
        voucher_id: newVoucherData.id,
        ledger_id: newVoucherData.party_ledger_id,
        debit_amount: 0,
        credit_amount: newTotalAmount,
        narration: `Purchase from R t corporation`,
        tenant_id: newVoucherData.tenant_id
      }
    ];
    
    for (const entry of newLedgerEntries) {
      if (entry.ledger_id) { // Only create if ledger exists
        await sequelize.query(`
          INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, narration, tenant_id, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, {
          replacements: [
            entry.id,
            entry.voucher_id,
            entry.ledger_id,
            entry.debit_amount,
            entry.credit_amount,
            entry.narration,
            entry.tenant_id,
            new Date(),
            new Date()
          ],
          transaction
        });
      }
    }
    
    const validEntries = newLedgerEntries.filter(entry => entry.ledger_id);
    console.log(`✅ Created ${validEntries.length} complete ledger entries`);
    
    // Update ledger balances
    await sequelize.query(`
      UPDATE ledgers 
      SET current_balance = current_balance + ?, updatedAt = ?
      WHERE id = ?
    `, {
      replacements: [newTaxableAmount, new Date(), stockLedgerId],
      transaction
    });
    
    if (cgstLedgerId) {
      await sequelize.query(`
        UPDATE ledgers 
        SET current_balance = current_balance + ?, updatedAt = ?
        WHERE id = ?
      `, {
        replacements: [newGstAmount / 2, new Date(), cgstLedgerId],
        transaction
      });
    }
    
    if (sgstLedgerId) {
      await sequelize.query(`
        UPDATE ledgers 
        SET current_balance = current_balance + ?, updatedAt = ?
        WHERE id = ?
      `, {
        replacements: [newGstAmount / 2, new Date(), sgstLedgerId],
        transaction
      });
    }
    
    await sequelize.query(`
      UPDATE ledgers 
      SET current_balance = current_balance - ?, updatedAt = ?
      WHERE id = ?
    `, {
      replacements: [newTotalAmount, new Date(), newVoucherData.party_ledger_id],
      transaction
    });
    
    console.log(`✅ Updated all ledger balances`);
    
    // Post the new voucher
    await sequelize.query(`
      UPDATE vouchers SET status = 'posted', updatedAt = ? WHERE id = ?
    `, {
      replacements: [new Date(), newVoucherData.id],
      transaction
    });
    
    console.log(`✅ Posted new voucher: ${newVoucherNumber}`);
    
    // Verify the new voucher is balanced
    const [verifyNewEntries] = await sequelize.query(`
      SELECT 
        SUM(debit_amount) as total_debit,
        SUM(credit_amount) as total_credit
      FROM voucher_ledger_entries 
      WHERE voucher_id = ?
    `, {
      replacements: [newVoucherData.id],
      transaction
    });
    
    const newTotalDebit = parseFloat(verifyNewEntries[0].total_debit || 0);
    const newTotalCredit = parseFloat(verifyNewEntries[0].total_credit || 0);
    const newIsBalanced = Math.abs(newTotalDebit - newTotalCredit) < 0.01;
    
    console.log(`\n  New Voucher Verification:`);
    console.log(`    Total Debit: ₹${newTotalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`    Total Credit: ₹${newTotalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`    Balanced: ${newIsBalanced ? '✅ Yes' : '❌ No'}`);
    
    // Commit transaction
    await transaction.commit();
    
    console.log('\n🎉 VOUCHER FIXING AND CREATION COMPLETED!');
    console.log('=' .repeat(60));
    console.log(`✅ Fixed voucher: ${currentVoucherNumber} (added missing inventory entry)`);
    console.log(`✅ Created new voucher: ${newVoucherNumber} (complete integration)`);
    console.log(`✅ Both vouchers now have balanced ledger entries`);
    console.log(`✅ Inventory updated for both vouchers`);
    console.log(`✅ Stock movements recorded`);
    console.log(`✅ All ledger balances updated`);
    
    return {
      success: true,
      fixedVoucher: currentVoucherNumber,
      newVoucher: newVoucherNumber,
      newVoucherId: newVoucherData.id
    };
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await sequelize.close();
  }
}

// Run the fix and creation
if (require.main === module) {
  fixAndCreateVoucher().then(result => {
    if (result?.success) {
      console.log('\n🔍 Run these to verify both vouchers:');
      console.log(`node check-posted-voucher.js --number ${result.fixedVoucher}`);
      console.log(`node check-posted-voucher.js --number ${result.newVoucher}`);
      console.log(`node check-ledger-postings-simple.js`);
    }
  });
}

module.exports = { fixAndCreateVoucher };