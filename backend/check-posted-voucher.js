const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Database configuration
const sequelize = new Sequelize(
  process.env.TENANT_DB_NAME || 'finvera_illusio_designs', // Use tenant database
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Define models (simplified versions for querying)
const Voucher = sequelize.define('Voucher', {
  id: { type: DataTypes.UUID, primaryKey: true },
  voucher_number: DataTypes.STRING,
  voucher_type: DataTypes.STRING,
  voucher_date: DataTypes.DATE,
  party_ledger_id: DataTypes.UUID,
  total_amount: DataTypes.DECIMAL(15, 2),
  status: DataTypes.STRING,
  narration: DataTypes.TEXT,
  reference_number: DataTypes.STRING,
  due_date: DataTypes.DATE,
  tenant_id: DataTypes.STRING,
  created_by: DataTypes.UUID,
}, {
  tableName: 'vouchers',
  timestamps: true,
});

const VoucherItem = sequelize.define('VoucherItem', {
  id: { type: DataTypes.UUID, primaryKey: true },
  voucher_id: DataTypes.UUID,
  inventory_item_id: DataTypes.UUID,
  item_description: DataTypes.STRING,
  quantity: DataTypes.DECIMAL(15, 3),
  rate: DataTypes.DECIMAL(15, 4),
  amount: DataTypes.DECIMAL(15, 2),
  hsn_sac_code: DataTypes.STRING,
  gst_rate: DataTypes.DECIMAL(6, 2),
  cgst_amount: DataTypes.DECIMAL(15, 2),
  sgst_amount: DataTypes.DECIMAL(15, 2),
  igst_amount: DataTypes.DECIMAL(15, 2),
  tenant_id: DataTypes.STRING,
}, {
  tableName: 'voucher_items',
  timestamps: true,
});

const InventoryItem = sequelize.define('InventoryItem', {
  id: { type: DataTypes.UUID, primaryKey: true },
  item_key: DataTypes.STRING,
  item_code: DataTypes.STRING,
  item_name: DataTypes.STRING,
  barcode: DataTypes.STRING,
  hsn_sac_code: DataTypes.STRING,
  uqc: DataTypes.STRING,
  gst_rate: DataTypes.DECIMAL(6, 2),
  quantity_on_hand: DataTypes.DECIMAL(15, 3),
  avg_cost: DataTypes.DECIMAL(15, 4),
  is_active: DataTypes.BOOLEAN,
}, {
  tableName: 'inventory_items',
  timestamps: true,
});

const StockMovement = sequelize.define('StockMovement', {
  id: { type: DataTypes.UUID, primaryKey: true },
  inventory_item_id: DataTypes.UUID,
  warehouse_id: DataTypes.UUID,
  voucher_id: DataTypes.UUID,
  movement_type: DataTypes.ENUM('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'),
  quantity: DataTypes.DECIMAL(15, 3),
  rate: DataTypes.DECIMAL(15, 4),
  amount: DataTypes.DECIMAL(15, 2),
  reference_number: DataTypes.STRING,
  narration: DataTypes.TEXT,
  movement_date: DataTypes.DATE,
  tenant_id: DataTypes.STRING,
}, {
  tableName: 'stock_movements',
  timestamps: true,
});

const Ledger = sequelize.define('Ledger', {
  id: { type: DataTypes.UUID, primaryKey: true },
  ledger_name: DataTypes.STRING,
  ledger_code: DataTypes.STRING,
  account_group_id: DataTypes.UUID,
  opening_balance: DataTypes.DECIMAL(15, 2),
  opening_balance_type: DataTypes.ENUM('Dr', 'Cr'),
  balance_type: DataTypes.ENUM('debit', 'credit'),
  current_balance: DataTypes.DECIMAL(15, 2),
  address: DataTypes.TEXT,
  city: DataTypes.STRING,
  state: DataTypes.STRING,
  pincode: DataTypes.STRING,
  country: DataTypes.STRING,
  gstin: DataTypes.STRING,
  pan: DataTypes.STRING,
  email: DataTypes.STRING,
  contact_number: DataTypes.STRING,
  is_default: DataTypes.BOOLEAN,
  is_active: DataTypes.BOOLEAN,
  tenant_id: DataTypes.STRING,
}, {
  tableName: 'ledgers',
  timestamps: true,
});

const VoucherLedgerEntry = sequelize.define('VoucherLedgerEntry', {
  id: { type: DataTypes.UUID, primaryKey: true },
  voucher_id: DataTypes.UUID,
  ledger_id: DataTypes.UUID,
  debit_amount: DataTypes.DECIMAL(15, 2),
  credit_amount: DataTypes.DECIMAL(15, 2),
  narration: DataTypes.TEXT,
  tenant_id: DataTypes.STRING,
}, {
  tableName: 'voucher_ledger_entries',
  timestamps: true,
});

// Define associations
Voucher.hasMany(VoucherItem, { foreignKey: 'voucher_id', as: 'items' });
VoucherItem.belongsTo(Voucher, { foreignKey: 'voucher_id', as: 'voucher' });

Voucher.hasMany(VoucherLedgerEntry, { foreignKey: 'voucher_id', as: 'ledgerEntries' });
VoucherLedgerEntry.belongsTo(Voucher, { foreignKey: 'voucher_id', as: 'voucher' });

VoucherItem.belongsTo(InventoryItem, { foreignKey: 'inventory_item_id', as: 'inventoryItem' });
InventoryItem.hasMany(VoucherItem, { foreignKey: 'inventory_item_id', as: 'voucherItems' });

InventoryItem.hasMany(StockMovement, { foreignKey: 'inventory_item_id', as: 'movements' });
StockMovement.belongsTo(InventoryItem, { foreignKey: 'inventory_item_id', as: 'item' });

Voucher.belongsTo(Ledger, { foreignKey: 'party_ledger_id', as: 'partyLedger' });
VoucherLedgerEntry.belongsTo(Ledger, { foreignKey: 'ledger_id', as: 'ledger' });

async function checkPostedVoucher(voucherNumber = null, voucherId = null, showAll = false) {
  try {
    console.log('🔍 CHECKING POSTED VOUCHER INVENTORY INTEGRATION\n');
    console.log('=' .repeat(60));
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    let vouchers = [];
    
    if (voucherNumber) {
      // Find specific voucher by number
      const voucher = await Voucher.findOne({
        where: { voucher_number: voucherNumber },
        include: [
          { 
            model: VoucherItem, 
            as: 'items',
            include: [{ model: InventoryItem, as: 'inventoryItem' }]
          },
          { model: Ledger, as: 'partyLedger' },
          { 
            model: VoucherLedgerEntry, 
            as: 'ledgerEntries',
            include: [{ model: Ledger, as: 'ledger' }]
          }
        ]
      });
      
      if (voucher) {
        vouchers = [voucher];
      } else {
        console.log(`❌ Voucher with number '${voucherNumber}' not found`);
        return;
      }
    } else if (voucherId) {
      // Find specific voucher by ID
      const voucher = await Voucher.findByPk(voucherId, {
        include: [
          { 
            model: VoucherItem, 
            as: 'items',
            include: [{ model: InventoryItem, as: 'inventoryItem' }]
          },
          { model: Ledger, as: 'partyLedger' },
          { 
            model: VoucherLedgerEntry, 
            as: 'ledgerEntries',
            include: [{ model: Ledger, as: 'ledger' }]
          }
        ]
      });
      
      if (voucher) {
        vouchers = [voucher];
      } else {
        console.log(`❌ Voucher with ID '${voucherId}' not found`);
        return;
      }
    } else {
      // Find recent posted vouchers
      const limit = showAll ? 100 : 5;
      vouchers = await Voucher.findAll({
        where: { 
          status: 'posted',
          voucher_type: ['Purchase', 'purchase_invoice', 'Sales', 'sales_invoice']
        },
        include: [
          { 
            model: VoucherItem, 
            as: 'items',
            include: [{ model: InventoryItem, as: 'inventoryItem' }]
          },
          { model: Ledger, as: 'partyLedger' },
          { 
            model: VoucherLedgerEntry, 
            as: 'ledgerEntries',
            include: [{ model: Ledger, as: 'ledger' }]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: limit
      });
      
      if (vouchers.length === 0) {
        console.log('❌ No posted vouchers found');
        return;
      }
      
      console.log(`📋 Found ${vouchers.length} recent posted voucher(s)\n`);
    }
    
    // Analyze each voucher
    for (let i = 0; i < vouchers.length; i++) {
      const voucher = vouchers[i];
      
      if (vouchers.length > 1) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`VOUCHER ${i + 1} of ${vouchers.length}`);
        console.log(`${'='.repeat(60)}`);
      }
      
      await analyzeVoucher(voucher);
    }
    
  } catch (error) {
    console.error('❌ Error checking voucher:', error.message);
    if (error.name === 'SequelizeConnectionError') {
      console.log('\n💡 Database connection failed. Please check:');
      console.log('   - Database server is running');
      console.log('   - Database credentials in .env file');
      console.log('   - Database name exists');
    }
  } finally {
    await sequelize.close();
  }
}

async function analyzeVoucher(voucher) {
  console.log('📄 VOUCHER DETAILS');
  console.log('-'.repeat(30));
  console.log(`ID: ${voucher.id}`);
  console.log(`Number: ${voucher.voucher_number}`);
  console.log(`Type: ${voucher.voucher_type}`);
  console.log(`Date: ${voucher.voucher_date?.toISOString().split('T')[0]}`);
  console.log(`Status: ${voucher.status}`);
  console.log(`Total Amount: ₹${parseFloat(voucher.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
  
  if (voucher.partyLedger) {
    console.log(`Party: ${voucher.partyLedger.ledger_name}`);
  }
  
  if (voucher.reference_number) {
    console.log(`Reference: ${voucher.reference_number}`);
  }
  
  if (voucher.narration) {
    console.log(`Narration: ${voucher.narration}`);
  }
  
  console.log(`Created: ${voucher.createdAt?.toLocaleString()}`);
  console.log(`Updated: ${voucher.updatedAt?.toLocaleString()}`);
  
  // Check voucher items
  console.log('\n📦 VOUCHER ITEMS');
  console.log('-'.repeat(30));
  
  if (!voucher.items || voucher.items.length === 0) {
    console.log('❌ No items found for this voucher');
    return;
  }
  
  console.log(`Found ${voucher.items.length} item(s):`);
  
  for (let i = 0; i < voucher.items.length; i++) {
    const item = voucher.items[i];
    console.log(`\n  Item ${i + 1}:`);
    console.log(`    Description: ${item.item_description}`);
    console.log(`    Quantity: ${parseFloat(item.quantity || 0)}`);
    console.log(`    Rate: ₹${parseFloat(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`    Amount: ₹${parseFloat(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`    GST Rate: ${parseFloat(item.gst_rate || 0)}%`);
    console.log(`    CGST: ₹${parseFloat(item.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`    SGST: ₹${parseFloat(item.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`    IGST: ₹${parseFloat(item.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    
    const totalTax = parseFloat(item.cgst_amount || 0) + parseFloat(item.sgst_amount || 0) + parseFloat(item.igst_amount || 0);
    const totalAmount = parseFloat(item.amount || 0) + totalTax;
    console.log(`    Total: ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    
    if (item.inventory_item_id) {
      console.log(`    Inventory Item ID: ${item.inventory_item_id}`);
      
      if (item.inventoryItem) {
        console.log(`    ✅ Linked to inventory item: ${item.inventoryItem.item_name}`);
        console.log(`    Current Stock: ${parseFloat(item.inventoryItem.quantity_on_hand || 0)}`);
        console.log(`    Average Cost: ₹${parseFloat(item.inventoryItem.avg_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 4 })}`);
      } else {
        console.log(`    ❌ Inventory item not found (ID: ${item.inventory_item_id})`);
      }
    } else {
      console.log(`    ❌ No inventory item linked`);
    }
  }
  
  // Check stock movements
  console.log('\n📊 STOCK MOVEMENTS');
  console.log('-'.repeat(30));
  
  const stockMovements = await StockMovement.findAll({
    where: { voucher_id: voucher.id },
    include: [{ model: InventoryItem, as: 'item' }],
    order: [['createdAt', 'ASC']]
  });
  
  if (stockMovements.length === 0) {
    console.log('❌ No stock movements found for this voucher');
    console.log('   This indicates inventory integration is NOT working');
  } else {
    console.log(`✅ Found ${stockMovements.length} stock movement(s):`);
    
    for (let i = 0; i < stockMovements.length; i++) {
      const movement = stockMovements[i];
      console.log(`\n  Movement ${i + 1}:`);
      console.log(`    Type: ${movement.movement_type}`);
      console.log(`    Item: ${movement.item?.item_name || 'Unknown'}`);
      console.log(`    Quantity: ${parseFloat(movement.quantity || 0)}`);
      console.log(`    Rate: ₹${parseFloat(movement.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 4 })}`);
      console.log(`    Amount: ₹${parseFloat(movement.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      console.log(`    Reference: ${movement.reference_number}`);
      console.log(`    Date: ${movement.movement_date?.toISOString().split('T')[0]}`);
      console.log(`    Narration: ${movement.narration}`);
    }
  }
  
  // Check ledger entries
  console.log('\n💰 LEDGER ENTRIES');
  console.log('-'.repeat(30));
  
  if (!voucher.ledgerEntries || voucher.ledgerEntries.length === 0) {
    console.log('❌ No ledger entries found for this voucher');
  } else {
    console.log(`Found ${voucher.ledgerEntries.length} ledger entry(ies):`);
    
    let totalDebit = 0;
    let totalCredit = 0;
    
    for (let i = 0; i < voucher.ledgerEntries.length; i++) {
      const entry = voucher.ledgerEntries[i];
      const debit = parseFloat(entry.debit_amount || 0);
      const credit = parseFloat(entry.credit_amount || 0);
      
      totalDebit += debit;
      totalCredit += credit;
      
      console.log(`\n  Entry ${i + 1}:`);
      console.log(`    Ledger: ${entry.ledger?.ledger_name || 'Unknown'}`);
      console.log(`    Debit: ₹${debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      console.log(`    Credit: ₹${credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      console.log(`    Narration: ${entry.narration}`);
    }
    
    console.log(`\n  Summary:`);
    console.log(`    Total Debit: ₹${totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`    Total Credit: ₹${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`    Balanced: ${Math.abs(totalDebit - totalCredit) < 0.01 ? '✅ Yes' : '❌ No'}`);
  }
  
  // Integration status summary
  console.log('\n🔍 INTEGRATION STATUS');
  console.log('-'.repeat(30));
  
  const hasItems = voucher.items && voucher.items.length > 0;
  const hasStockMovements = stockMovements.length > 0;
  const hasLedgerEntries = voucher.ledgerEntries && voucher.ledgerEntries.length > 0;
  const isInventoryVoucher = ['Purchase', 'purchase_invoice', 'Sales', 'sales_invoice'].includes(voucher.voucher_type);
  
  console.log(`Voucher Type: ${isInventoryVoucher ? '✅ Inventory-related' : '❌ Non-inventory'}`);
  console.log(`Has Items: ${hasItems ? '✅ Yes' : '❌ No'}`);
  console.log(`Has Stock Movements: ${hasStockMovements ? '✅ Yes' : '❌ No'}`);
  console.log(`Has Ledger Entries: ${hasLedgerEntries ? '✅ Yes' : '❌ No'}`);
  
  if (isInventoryVoucher && hasItems) {
    if (hasStockMovements) {
      console.log('\n🎉 INVENTORY INTEGRATION: ✅ WORKING CORRECTLY');
      console.log('   - Voucher is posted');
      console.log('   - Stock movements created');
      console.log('   - Inventory quantities should be updated');
    } else {
      console.log('\n⚠️  INVENTORY INTEGRATION: ❌ NOT WORKING');
      console.log('   - Voucher is posted but no stock movements found');
      console.log('   - Inventory quantities may not be updated');
      console.log('   - Check voucher controller implementation');
    }
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('-'.repeat(30));
  
  if (!hasStockMovements && isInventoryVoucher && hasItems) {
    console.log('❌ Missing stock movements - inventory integration not working');
    console.log('   → Check if voucher controller calls applyInventoryUpdates()');
    console.log('   → Verify inventory service is properly configured');
    console.log('   → Check database permissions for stock_movements table');
  }
  
  if (!hasLedgerEntries) {
    console.log('❌ Missing ledger entries - accounting integration incomplete');
    console.log('   → Check if voucher service creates ledger entries');
    console.log('   → Verify double-entry bookkeeping is implemented');
  }
  
  if (hasItems) {
    const itemsWithoutInventoryLink = voucher.items.filter(item => !item.inventory_item_id);
    if (itemsWithoutInventoryLink.length > 0) {
      console.log(`❌ ${itemsWithoutInventoryLink.length} item(s) not linked to inventory`);
      console.log('   → Check if findOrCreateInventoryItem() is working');
      console.log('   → Verify inventory_item_id is being set correctly');
    }
  }
  
  if (hasStockMovements && hasItems && isInventoryVoucher) {
    console.log('✅ Integration appears to be working correctly');
    console.log('   → Inventory quantities should reflect the voucher');
    console.log('   → Stock movements provide complete audit trail');
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('📋 VOUCHER CHECKER - Usage:');
    console.log('');
    console.log('Check specific voucher by number:');
    console.log('  node check-posted-voucher.js --number PI20241201001');
    console.log('');
    console.log('Check specific voucher by ID:');
    console.log('  node check-posted-voucher.js --id 12345678-1234-1234-1234-123456789012');
    console.log('');
    console.log('Check recent posted vouchers (default 5):');
    console.log('  node check-posted-voucher.js');
    console.log('');
    console.log('Check all posted vouchers:');
    console.log('  node check-posted-voucher.js --all');
    console.log('');
    return;
  }
  
  const numberIndex = args.indexOf('--number');
  const idIndex = args.indexOf('--id');
  const showAll = args.includes('--all');
  
  let voucherNumber = null;
  let voucherId = null;
  
  if (numberIndex !== -1 && args[numberIndex + 1]) {
    voucherNumber = args[numberIndex + 1];
  }
  
  if (idIndex !== -1 && args[idIndex + 1]) {
    voucherId = args[idIndex + 1];
  }
  
  await checkPostedVoucher(voucherNumber, voucherId, showAll);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkPostedVoucher };