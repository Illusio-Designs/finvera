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

// Import the voucher controller functions
const { findOrCreateInventoryItem } = require('./src/services/inventoryService');

function toNum(v, fallback = 0) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

async function recreateVoucherDirect() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔄 RECREATING VOUCHER DIRECTLY IN DATABASE');
    console.log('=' .repeat(60));
    
    const oldVoucherNumber = 'PI260201896195';
    const oldVoucherId = '4a2d0c64-22f6-4ea2-9bf8-02c5b6b95631';
    
    // Step 1: Delete old voucher
    console.log('1️⃣ DELETING OLD INCOMPLETE VOUCHER');
    console.log('-'.repeat(40));
    
    await sequelize.query(`DELETE FROM voucher_items WHERE voucher_id = '${oldVoucherId}'`, { transaction });
    await sequelize.query(`DELETE FROM voucher_ledger_entries WHERE voucher_id = '${oldVoucherId}'`, { transaction });
    await sequelize.query(`DELETE FROM stock_movements WHERE voucher_id = '${oldVoucherId}'`, { transaction });
    await sequelize.query(`DELETE FROM vouchers WHERE id = '${oldVoucherId}'`, { transaction });
    
    console.log(`✅ Deleted old voucher: ${oldVoucherNumber}`);
    
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
    
    const taxableAmount = itemDetails.quantity * itemDetails.rate;
    const gstAmount = (taxableAmount * itemDetails.gst_rate) / 100;
    const totalAmount = taxableAmount + gstAmount;
    
    console.log(`Item: ${itemDetails.item_name}`);
    console.log(`Quantity: ${itemDetails.quantity.toLocaleString()} ${itemDetails.uqc}`);
    console.log(`Rate: ₹${itemDetails.rate}`);
    console.log(`Taxable Amount: ₹${taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`GST (${itemDetails.gst_rate}%): ₹${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`Total Amount: ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    
    // Step 3: Generate new voucher number
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = now.getTime().toString().slice(-6);
    const newVoucherNumber = `PI${year}${month}${day}${time}`;
    
    // Step 4: Create new voucher
    console.log('\n3️⃣ CREATING NEW VOUCHER');
    console.log('-'.repeat(40));
    
    const voucherData = {
      id: require('crypto').randomUUID(),
      voucher_number: newVoucherNumber,
      voucher_type: 'purchase_invoice',
      voucher_date: '2026-02-01',
      party_ledger_id: '8914f324-e4cc-4684-a363-fab1e3740fad',
      total_amount: totalAmount,
      narration: 'Purchase of Sulphur - Recreated with inventory integration',
      status: 'draft',
      reference_number: 'Recreated voucher',
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
        voucherData.id,
        voucherData.voucher_number,
        voucherData.voucher_type,
        voucherData.voucher_date,
        voucherData.party_ledger_id,
        voucherData.total_amount,
        voucherData.narration,
        voucherData.status,
        voucherData.reference_number,
        voucherData.tenant_id,
        voucherData.created_by,
        voucherData.createdAt,
        voucherData.updatedAt
      ],
      transaction
    });
    
    console.log(`✅ Created voucher: ${newVoucherNumber}`);
    
    // Step 5: Create voucher item
    console.log('\n4️⃣ CREATING VOUCHER ITEM');
    console.log('-'.repeat(40));
    
    const voucherItemData = {
      id: require('crypto').randomUUID(),
      voucher_id: voucherData.id,
      inventory_item_id: null, // Will be set after creating inventory item
      item_description: itemDetails.item_description,
      quantity: itemDetails.quantity,
      rate: itemDetails.rate,
      amount: taxableAmount,
      hsn_sac_code: itemDetails.hsn_sac_code,
      gst_rate: itemDetails.gst_rate,
      cgst_amount: 0,
      sgst_amount: gstAmount, // Assuming intra-state
      igst_amount: 0,
      tenant_id: voucherData.tenant_id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await sequelize.query(`
      INSERT INTO voucher_items (id, voucher_id, inventory_item_id, item_description, quantity, rate, amount, hsn_sac_code, gst_rate, cgst_amount, sgst_amount, igst_amount, tenant_id, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        voucherItemData.id,
        voucherItemData.voucher_id,
        voucherItemData.inventory_item_id,
        voucherItemData.item_description,
        voucherItemData.quantity,
        voucherItemData.rate,
        voucherItemData.amount,
        voucherItemData.hsn_sac_code,
        voucherItemData.gst_rate,
        voucherItemData.cgst_amount,
        voucherItemData.sgst_amount,
        voucherItemData.igst_amount,
        voucherItemData.tenant_id,
        voucherItemData.createdAt,
        voucherItemData.updatedAt
      ],
      transaction
    });
    
    console.log(`✅ Created voucher item: ${itemDetails.item_name}`);
    
    // Step 6: Create/Update inventory item
    console.log('\n5️⃣ CREATING/UPDATING INVENTORY ITEM');
    console.log('-'.repeat(40));
    
    // Check if inventory item exists
    const [existingItems] = await sequelize.query(`
      SELECT * FROM inventory_items WHERE item_name = ? OR item_key = ?
    `, {
      replacements: [itemDetails.item_name, itemDetails.item_name.toLowerCase()],
      transaction
    });
    
    let inventoryItem;
    
    if (existingItems.length > 0) {
      // Update existing item
      inventoryItem = existingItems[0];
      const currentQty = toNum(inventoryItem.quantity_on_hand, 0);
      const currentAvgCost = toNum(inventoryItem.avg_cost, 0);
      const currentValue = currentQty * currentAvgCost;
      
      const newQty = currentQty + itemDetails.quantity;
      const newValue = currentValue + taxableAmount;
      const newAvgCost = newQty > 0 ? newValue / newQty : 0;
      
      await sequelize.query(`
        UPDATE inventory_items 
        SET quantity_on_hand = ?, avg_cost = ?, updatedAt = ?
        WHERE id = ?
      `, {
        replacements: [newQty, newAvgCost, new Date(), inventoryItem.id],
        transaction
      });
      
      console.log(`✅ Updated existing inventory item: ${inventoryItem.item_name}`);
      console.log(`   Quantity: ${currentQty} → ${newQty}`);
      console.log(`   Avg Cost: ₹${currentAvgCost.toFixed(4)} → ₹${newAvgCost.toFixed(4)}`);
      
    } else {
      // Create new item
      const newItemId = require('crypto').randomUUID();
      const avgCost = itemDetails.rate;
      
      await sequelize.query(`
        INSERT INTO inventory_items (id, item_key, item_code, item_name, hsn_sac_code, uqc, gst_rate, quantity_on_hand, avg_cost, is_active, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, {
        replacements: [
          newItemId,
          itemDetails.item_name.toLowerCase(),
          null,
          itemDetails.item_name,
          itemDetails.hsn_sac_code,
          itemDetails.uqc,
          itemDetails.gst_rate,
          itemDetails.quantity,
          avgCost,
          true,
          new Date(),
          new Date()
        ],
        transaction
      });
      
      inventoryItem = { id: newItemId, item_name: itemDetails.item_name };
      
      console.log(`✅ Created new inventory item: ${itemDetails.item_name}`);
      console.log(`   Quantity: ${itemDetails.quantity}`);
      console.log(`   Avg Cost: ₹${avgCost.toFixed(4)}`);
    }
    
    // Update voucher item with inventory_item_id
    await sequelize.query(`
      UPDATE voucher_items SET inventory_item_id = ? WHERE id = ?
    `, {
      replacements: [inventoryItem.id, voucherItemData.id],
      transaction
    });
    
    // Step 7: Create stock movement
    console.log('\n6️⃣ CREATING STOCK MOVEMENT');
    console.log('-'.repeat(40));
    
    await sequelize.query(`
      INSERT INTO stock_movements (id, inventory_item_id, voucher_id, movement_type, quantity, rate, amount, reference_number, narration, movement_date, tenant_id, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        require('crypto').randomUUID(),
        inventoryItem.id,
        voucherData.id,
        'IN',
        itemDetails.quantity,
        itemDetails.rate,
        taxableAmount,
        newVoucherNumber,
        `Purchase from R t corporation`,
        voucherData.voucher_date,
        voucherData.tenant_id,
        new Date(),
        new Date()
      ],
      transaction
    });
    
    console.log(`✅ Created stock movement: IN ${itemDetails.quantity} ${itemDetails.uqc}`);
    
    // Step 8: Create ledger entries
    console.log('\n7️⃣ CREATING LEDGER ENTRIES');
    console.log('-'.repeat(40));
    
    // Get or create system ledgers
    const [inventoryLedgers] = await sequelize.query(`
      SELECT id FROM ledgers WHERE ledger_name = 'Stock-in-Hand' OR ledger_code = 'INVENTORY'
      LIMIT 1
    `, { transaction });
    
    const [gstLedgers] = await sequelize.query(`
      SELECT id FROM ledgers WHERE ledger_name LIKE '%GST Input%' OR ledger_name LIKE '%SGST%'
      LIMIT 1
    `, { transaction });
    
    let inventoryLedgerId = inventoryLedgers.length > 0 ? inventoryLedgers[0].id : null;
    let gstLedgerId = gstLedgers.length > 0 ? gstLedgers[0].id : null;
    
    // Create basic ledger entries
    const ledgerEntries = [
      {
        id: require('crypto').randomUUID(),
        voucher_id: voucherData.id,
        ledger_id: voucherData.party_ledger_id, // Supplier (Credit)
        debit_amount: 0,
        credit_amount: totalAmount,
        narration: `Purchase from R t corporation`,
        tenant_id: voucherData.tenant_id
      }
    ];
    
    if (inventoryLedgerId) {
      ledgerEntries.push({
        id: require('crypto').randomUUID(),
        voucher_id: voucherData.id,
        ledger_id: inventoryLedgerId, // Inventory (Debit)
        debit_amount: taxableAmount,
        credit_amount: 0,
        narration: 'Inventory purchase',
        tenant_id: voucherData.tenant_id
      });
    }
    
    if (gstLedgerId && gstAmount > 0) {
      ledgerEntries.push({
        id: require('crypto').randomUUID(),
        voucher_id: voucherData.id,
        ledger_id: gstLedgerId, // GST Input (Debit)
        debit_amount: gstAmount,
        credit_amount: 0,
        narration: 'GST Input',
        tenant_id: voucherData.tenant_id
      });
    }
    
    for (const entry of ledgerEntries) {
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
    
    console.log(`✅ Created ${ledgerEntries.length} ledger entries`);
    
    // Step 9: Post the voucher
    console.log('\n8️⃣ POSTING THE VOUCHER');
    console.log('-'.repeat(40));
    
    await sequelize.query(`
      UPDATE vouchers SET status = 'posted', updatedAt = ? WHERE id = ?
    `, {
      replacements: [new Date(), voucherData.id],
      transaction
    });
    
    console.log(`✅ Voucher posted successfully`);
    
    // Commit transaction
    await transaction.commit();
    
    console.log('\n🎉 VOUCHER RECREATION COMPLETED!');
    console.log('=' .repeat(60));
    console.log(`✅ Old voucher deleted: ${oldVoucherNumber}`);
    console.log(`✅ New voucher created: ${newVoucherNumber}`);
    console.log(`✅ Voucher items: 1 item (${itemDetails.item_name})`);
    console.log(`✅ Inventory updated: +${itemDetails.quantity.toLocaleString()} ${itemDetails.uqc}`);
    console.log(`✅ Stock movements: 1 movement (IN)`);
    console.log(`✅ Ledger entries: ${ledgerEntries.length} entries`);
    console.log(`✅ Status: Posted`);
    
    return {
      success: true,
      oldVoucherNumber,
      newVoucherNumber,
      newVoucherId: voucherData.id,
      totalAmount
    };
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await sequelize.close();
  }
}

// Run the recreation
if (require.main === module) {
  recreateVoucherDirect().then(result => {
    if (result?.success) {
      console.log('\n🔍 Run this to verify the new voucher:');
      console.log(`node check-posted-voucher.js --number ${result.newVoucherNumber}`);
    }
  });
}

module.exports = { recreateVoucherDirect };