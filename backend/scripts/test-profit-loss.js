/**
 * Test Profit & Loss Report Generation
 * This script checks the actual data structure and generates a P&L report
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Sequelize, Op } = require('sequelize');
const masterSequelize = require('../src/config/masterDatabase');
const masterModels = require('../src/models/masterModels');
const tenantConnectionManager = require('../src/config/tenantConnectionManager');

async function testProfitLoss() {
  try {
    console.log('\n🔍 === TESTING PROFIT & LOSS DATA ===\n');

    // Get first active company
    const company = await masterModels.Company.findOne({
      where: { 
        is_active: true
      }
    });

    if (!company) {
      console.log('❌ No active company found');
      return;
    }

    console.log(`✅ Testing with company: ${company.company_name}`);
    console.log(`📊 Tenant ID: ${company.tenant_id}`);
    console.log(`🏢 Business Type: ${company.business_type}`);
    console.log(`🗄️  DB Name: ${company.db_name}`);
    console.log(`🔐 DB User: ${company.db_user}\n`);

    // Get tenant connection
    const tenantConnection = await tenantConnectionManager.getConnection({
      id: company.tenant_id,
      db_name: company.db_name,
      db_host: process.env.DB_HOST,
      db_port: process.env.DB_PORT,
      db_user: process.env.DB_USER,
      db_password: process.env.DB_PASSWORD
    });
    const tenantModels = require('../src/services/tenantModels')(tenantConnection);

    // Date range - use full year to ensure we catch all data
    const startDate = '2025-01-01';
    const endDate = '2026-12-31';

    console.log(`📅 Period: ${startDate} to ${endDate}\n`);

    // Step 1: Check Account Groups
    console.log('📋 === CHECKING ACCOUNT GROUPS ===');
    const accountGroups = await masterModels.AccountGroup.findAll({
      order: [['group_code', 'ASC']]
    });
    
    console.log(`Total account groups: ${accountGroups.length}\n`);
    
    const plGroups = accountGroups.filter(g => g.affects_pl);
    console.log(`P&L affecting groups: ${plGroups.length}`);
    plGroups.forEach(g => {
      console.log(`  - ${g.group_code}: ${g.group_name} (${g.nature})`);
    });

    // Step 2: Check Ledgers
    console.log('\n📒 === CHECKING LEDGERS ===');
    const ledgers = await tenantModels.Ledger.findAll({
      where: { is_active: true }
    });

    console.log(`Total active ledgers: ${ledgers.length}\n`);

    // Group ledgers by account group
    const groupMap = new Map();
    accountGroups.forEach(g => groupMap.set(g.id, g));

    const ledgersByGroup = {};
    ledgers.forEach(ledger => {
      const group = groupMap.get(ledger.account_group_id);
      if (group) {
        if (!ledgersByGroup[group.group_code]) {
          ledgersByGroup[group.group_code] = [];
        }
        ledgersByGroup[group.group_code].push({
          name: ledger.ledger_name,
          opening: parseFloat(ledger.opening_balance) || 0,
          current: parseFloat(ledger.current_balance) || 0
        });
      }
    });

    console.log('Ledgers by group:');
    Object.keys(ledgersByGroup).sort().forEach(code => {
      const ledgerList = ledgersByGroup[code];
      console.log(`\n  ${code}: ${ledgerList.length} ledgers`);
      ledgerList.forEach(l => {
        console.log(`    - ${l.name}: Opening=₹${l.opening.toFixed(2)}, Current=₹${l.current.toFixed(2)}`);
      });
    });

    // Step 3: Check Vouchers
    console.log('\n\n📝 === CHECKING VOUCHERS ===');
    const vouchers = await tenantModels.Voucher.findAll({
      where: {
        status: 'posted',
        voucher_date: { [Op.between]: [startDate, endDate] }
      },
      attributes: ['voucher_type', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['voucher_type'],
      raw: true
    });

    console.log('Vouchers by type:');
    vouchers.forEach(v => {
      console.log(`  - ${v.voucher_type}: ${v.count} vouchers`);
    });

    // Step 4: Check Ledger Entries
    console.log('\n\n💰 === CHECKING LEDGER ENTRIES ===');
    
    console.log(`Query date range: ${startDate} to ${endDate}`);
    
    // First, get all posted voucher IDs
    const postedVouchers = await tenantModels.Voucher.findAll({
      where: {
        status: 'posted',
        voucher_date: { [Op.between]: [startDate, endDate] }
      },
      attributes: ['id'],
      raw: true
    });
    
    const voucherIds = postedVouchers.map(v => v.id);
    console.log(`Posted vouchers in range: ${voucherIds.length}`);
    
    if (voucherIds.length === 0) {
      console.log('⚠️  No posted vouchers found in date range!');
      console.log('Ledgers with movements: 0\n');
    } else {
      // Get ledger entries for these vouchers
      const ledgerEntries = await tenantModels.VoucherLedgerEntry.findAll({
        attributes: [
          'ledger_id',
          [Sequelize.fn('SUM', Sequelize.col('debit_amount')), 'total_debit'],
          [Sequelize.fn('SUM', Sequelize.col('credit_amount')), 'total_credit'],
        ],
        where: {
          voucher_id: { [Op.in]: voucherIds }
        },
        group: ['ledger_id'],
        raw: true,
      });

      console.log(`Ledgers with movements: ${ledgerEntries.length}`);
      
      if (ledgerEntries.length > 0) {
        console.log('\nSample entries:');
        ledgerEntries.slice(0, 5).forEach(e => {
          console.log(`  Ledger ${e.ledger_id}: Dr=₹${parseFloat(e.total_debit).toFixed(2)}, Cr=₹${parseFloat(e.total_credit).toFixed(2)}`);
        });
      }
    }
    console.log();

    // Map movements to ledgers
    const moveMap = new Map();
    ledgerEntries.forEach(entry => {
      moveMap.set(entry.ledger_id, {
        debit: parseFloat(entry.total_debit) || 0,
        credit: parseFloat(entry.total_credit) || 0
      });
    });

    // Step 5: Analyze P&L Data
    console.log('📊 === ANALYZING P&L DATA ===\n');

    let totalSales = 0;
    let totalSalesReturns = 0;
    let totalPurchases = 0;
    let totalPurchaseReturns = 0;
    let totalDirectExpenses = 0;
    let totalIndirectExpenses = 0;
    let totalOtherIncomes = 0;

    const salesLedgers = [];
    const purchaseLedgers = [];
    const expenseLedgers = [];
    const incomeLedgers = [];

    // Get posted voucher IDs for analysis (reuse from earlier)
    const voucherIds2 = postedVouchers.map(v => v.id);
    
    // Map movements to ledgers
    const moveMap = new Map();
    
    if (voucherIds2.length > 0) {
      const ledgerEntries = await tenantModels.VoucherLedgerEntry.findAll({
        attributes: [
          'ledger_id',
          [Sequelize.fn('SUM', Sequelize.col('debit_amount')), 'total_debit'],
          [Sequelize.fn('SUM', Sequelize.col('credit_amount')), 'total_credit'],
        ],
        where: {
          voucher_id: { [Op.in]: voucherIds2 }
        },
        group: ['ledger_id'],
        raw: true,
      });
      
      ledgerEntries.forEach(entry => {
        moveMap.set(entry.ledger_id, {
          debit: parseFloat(entry.total_debit) || 0,
          credit: parseFloat(entry.total_credit) || 0
        });
      });
    }

    // Process each ledger
    ledgers.forEach(ledger => {
      const group = groupMap.get(ledger.account_group_id);
      if (!group || !group.affects_pl) return;

      const move = moveMap.get(ledger.id) || { debit: 0, credit: 0 };
      const movementSigned = move.debit - move.credit;

      // Skip if no movement
      if (Math.abs(movementSigned) < 0.01) return;

      if (group.nature === 'income') {
        const amt = -movementSigned; // income increases on credit
        
        if (['SAL', 'SALES'].includes(group.group_code)) {
          totalSales += amt;
          salesLedgers.push({ name: ledger.ledger_name, amount: amt, type: 'Sales' });
        } else if (['SAL_RET', 'SALES_RETURNS'].includes(group.group_code)) {
          totalSalesReturns += amt;
          salesLedgers.push({ name: ledger.ledger_name, amount: amt, type: 'Sales Returns' });
        } else {
          totalOtherIncomes += amt;
          incomeLedgers.push({ name: ledger.ledger_name, amount: amt, group: group.group_code });
        }
      } else if (group.nature === 'expense') {
        const amt = movementSigned; // expense increases on debit
        
        if (['PUR', 'PURCHASE'].includes(group.group_code)) {
          totalPurchases += amt;
          purchaseLedgers.push({ name: ledger.ledger_name, amount: amt, type: 'Purchases' });
        } else if (['PUR_RET', 'PURCHASE_RETURNS'].includes(group.group_code)) {
          totalPurchaseReturns += amt;
          purchaseLedgers.push({ name: ledger.ledger_name, amount: amt, type: 'Purchase Returns' });
        } else if (['DIR_EXP'].includes(group.group_code)) {
          totalDirectExpenses += amt;
          expenseLedgers.push({ name: ledger.ledger_name, amount: amt, type: 'Direct Expense' });
        } else {
          totalIndirectExpenses += amt;
          expenseLedgers.push({ name: ledger.ledger_name, amount: amt, type: 'Indirect Expense', group: group.group_code });
        }
      }
    });

    console.log('💰 SALES:');
    salesLedgers.forEach(l => console.log(`  ${l.type}: ${l.name} = ₹${l.amount.toFixed(2)}`));
    console.log(`  Total Sales: ₹${totalSales.toFixed(2)}`);
    console.log(`  Sales Returns: ₹${totalSalesReturns.toFixed(2)}`);
    console.log(`  Net Sales: ₹${(totalSales - totalSalesReturns).toFixed(2)}\n`);

    console.log('🛒 PURCHASES:');
    purchaseLedgers.forEach(l => console.log(`  ${l.type}: ${l.name} = ₹${l.amount.toFixed(2)}`));
    console.log(`  Total Purchases: ₹${totalPurchases.toFixed(2)}`);
    console.log(`  Purchase Returns: ₹${totalPurchaseReturns.toFixed(2)}`);
    console.log(`  Net Purchases: ₹${(totalPurchases - totalPurchaseReturns).toFixed(2)}\n`);

    console.log('💸 EXPENSES:');
    expenseLedgers.forEach(l => console.log(`  ${l.type} (${l.group || 'N/A'}): ${l.name} = ₹${l.amount.toFixed(2)}`));
    console.log(`  Direct Expenses: ₹${totalDirectExpenses.toFixed(2)}`);
    console.log(`  Indirect Expenses: ₹${totalIndirectExpenses.toFixed(2)}\n`);

    console.log('💵 OTHER INCOMES:');
    incomeLedgers.forEach(l => console.log(`  ${l.group}: ${l.name} = ₹${l.amount.toFixed(2)}`));
    console.log(`  Total Other Incomes: ₹${totalOtherIncomes.toFixed(2)}\n`);

    // Step 6: Check Stock
    console.log('📦 === CHECKING STOCK ===');
    
    const stockLedgers = ledgers.filter(l => {
      const group = groupMap.get(l.account_group_id);
      return group && group.group_code === 'INV';
    });

    console.log(`Stock ledgers: ${stockLedgers.length}`);
    
    let openingStock = 0;
    let closingStock = 0;

    const inventoryItems = await tenantModels.InventoryItem.findAll({
      where: { is_active: true }
    });

    console.log(`Inventory items: ${inventoryItems.length}\n`);

    if (inventoryItems.length > 0) {
      inventoryItems.forEach(item => {
        const qty = parseFloat(item.quantity_on_hand) || 0;
        const avgCost = parseFloat(item.avg_cost) || 0;
        const opening = parseFloat(item.opening_balance) || 0;
        const closing = qty * avgCost;
        
        openingStock += opening;
        closingStock += closing;
        
        console.log(`  ${item.item_name}:`);
        console.log(`    Opening: ₹${opening.toFixed(2)}`);
        console.log(`    Qty: ${qty}, Avg Cost: ₹${avgCost.toFixed(2)}`);
        console.log(`    Closing: ₹${closing.toFixed(2)}`);
      });
    } else {
      stockLedgers.forEach(ledger => {
        openingStock += parseFloat(ledger.opening_balance) || 0;
        closingStock += parseFloat(ledger.current_balance) || 0;
        console.log(`  ${ledger.ledger_name}:`);
        console.log(`    Opening: ₹${ledger.opening_balance}`);
        console.log(`    Current: ₹${ledger.current_balance}`);
      });
    }

    console.log(`\n  Total Opening Stock: ₹${openingStock.toFixed(2)}`);
    console.log(`  Total Closing Stock: ₹${closingStock.toFixed(2)}\n`);

    // Step 7: Calculate P&L
    console.log('📊 === PROFIT & LOSS CALCULATION ===\n');

    const netSales = totalSales - totalSalesReturns;
    const netPurchases = totalPurchases - totalPurchaseReturns;
    const cogs = openingStock + netPurchases + totalDirectExpenses - closingStock;
    const grossProfit = netSales - cogs;
    const netProfit = grossProfit + totalOtherIncomes - totalIndirectExpenses;

    console.log('TRADING ACCOUNT:');
    console.log(`  Opening Stock:        ₹${openingStock.toFixed(2)}`);
    console.log(`  + Purchases:          ₹${netPurchases.toFixed(2)}`);
    console.log(`  + Direct Expenses:    ₹${totalDirectExpenses.toFixed(2)}`);
    console.log(`  - Closing Stock:      ₹${closingStock.toFixed(2)}`);
    console.log(`  = Cost of Goods Sold: ₹${cogs.toFixed(2)}`);
    console.log(`  Net Sales:            ₹${netSales.toFixed(2)}`);
    console.log(`  = GROSS PROFIT:       ₹${grossProfit.toFixed(2)}\n`);

    console.log('PROFIT & LOSS ACCOUNT:');
    console.log(`  Gross Profit b/f:     ₹${grossProfit.toFixed(2)}`);
    console.log(`  + Other Incomes:      ₹${totalOtherIncomes.toFixed(2)}`);
    console.log(`  - Indirect Expenses:  ₹${totalIndirectExpenses.toFixed(2)}`);
    console.log(`  = NET PROFIT:         ₹${netProfit.toFixed(2)}\n`);

    const grossProfitMargin = netSales > 0 ? (grossProfit / netSales * 100) : 0;
    const netProfitMargin = netSales > 0 ? (netProfit / netSales * 100) : 0;

    console.log('MARGINS:');
    console.log(`  Gross Profit Margin:  ${grossProfitMargin.toFixed(2)}%`);
    console.log(`  Net Profit Margin:    ${netProfitMargin.toFixed(2)}%\n`);

    console.log('✅ Test completed successfully\n');

    await tenantConnectionManager.closeConnection(company.tenant_id);
    await masterSequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}


testProfitLoss();
