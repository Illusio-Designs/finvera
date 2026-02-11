const logger = require('../utils/logger');

/**
 * Report Service
 * Handles generation of financial reports (P&L, Balance Sheet, etc.)
 */

/**
 * Generate Profit & Loss Report
 * @param {Object} tenantModels - Tenant database models
 * @param {Object} options - Report options (startDate, endDate, etc.)
 * @returns {Object} - P&L report data
 */
async function generateProfitLossReport(tenantModels, options = {}) {
  const { Sequelize } = tenantModels;
  const { Op } = Sequelize;
  
  try {
    const { startDate, endDate } = options;
    
    console.log('📊 Report Service - Generating P&L Report');
    console.log(`📅 Period: ${startDate} to ${endDate}`);
    
    // Get master models to access AccountGroup
    const masterModels = require('../models/masterModels');
    
    // Get all account groups
    const accountGroups = await masterModels.AccountGroup.findAll();
    console.log(`📊 Total account groups: ${accountGroups.length}`);
    
    // Create a map of group_id to group
    const groupMap = new Map();
    accountGroups.forEach(g => groupMap.set(g.id, g));
    
    // Get all active ledgers
    const ledgers = await tenantModels.Ledger.findAll({ 
      where: { is_active: true }
    });
    console.log(`📊 Total active ledgers: ${ledgers.length}`);
    
    // Build voucher where clause for date range
    const voucherWhere = { status: 'posted' };
    if (startDate && endDate) {
      voucherWhere.voucher_date = { [Op.between]: [startDate, endDate] };
    }
    
    // Get ledger movements (debit/credit totals) for the period
    const ledgerEntries = await tenantModels.VoucherLedgerEntry.findAll({
      attributes: [
        'ledger_id',
        [Sequelize.fn('SUM', Sequelize.col('VoucherLedgerEntry.debit_amount')), 'total_debit'],
        [Sequelize.fn('SUM', Sequelize.col('VoucherLedgerEntry.credit_amount')), 'total_credit'],
      ],
      include: [{ 
        model: tenantModels.Voucher, 
        as: 'voucher', 
        attributes: [], 
        where: voucherWhere, 
        required: true 
      }],
      group: ['ledger_id'],
      raw: true,
    });
    
    console.log(`📊 Ledger entries with movements: ${ledgerEntries.length}`);
    
    // Create movement map
    const moveMap = new Map();
    ledgerEntries.forEach(entry => {
      moveMap.set(entry.ledger_id, {
        debit: parseFloat(entry.total_debit || 0),
        credit: parseFloat(entry.total_credit || 0)
      });
    });
    
    // Get stock information
    const stockLedgers = ledgers.filter(l => {
      const group = groupMap.get(l.account_group_id);
      return group && group.group_code === 'INV';
    });
    
    let openingStock = 0;
    let closingStock = 0;
    
    // Get inventory items for stock calculation
    const inventoryItems = await tenantModels.InventoryItem.findAll({
      where: { is_active: true }
    });
    
    if (inventoryItems.length > 0) {
      inventoryItems.forEach(item => {
        const qty = parseFloat(item.quantity_on_hand || 0);
        const avgCost = parseFloat(item.avg_cost || 0);
        openingStock += parseFloat(item.opening_balance || 0);
        closingStock += qty * avgCost;
      });
    } else {
      // Fallback to ledger balances
      stockLedgers.forEach(ledger => {
        openingStock += parseFloat(ledger.opening_balance || 0);
        closingStock += parseFloat(ledger.current_balance || 0);
      });
    }
    
    console.log(`📊 Opening Stock: ${openingStock}, Closing Stock: ${closingStock}`);
    
    // Initialize totals
    let totalSales = 0;
    let totalSalesReturns = 0;
    let totalPurchases = 0;
    let totalPurchaseReturns = 0;
    let totalDirectExpenses = 0;
    let totalIndirectExpenses = 0;
    let totalOtherIncomes = 0;
    
    // Process each ledger
    ledgers.forEach(ledger => {
      const group = groupMap.get(ledger.account_group_id);
      if (!group) return;
      
      const move = moveMap.get(ledger.id) || { debit: 0, credit: 0 };
      const movementSigned = move.debit - move.credit;
      
      // Skip stock accounts
      if (group.group_code === 'INV') return;
      
      // INCOME ACCOUNTS
      if (group.nature === 'income') {
        const amt = -movementSigned; // income increases on credit
        if (amt <= 0.009) return;
        
        console.log(`💰 Income: ${ledger.ledger_name} (${group.group_code}) = ${amt}`);
        
        // Sales
        if (['SAL', 'SALES'].includes(group.group_code)) {
          totalSales += amt;
        }
        // Sales Returns
        else if (['SAL_RET', 'SALES_RETURNS'].includes(group.group_code)) {
          totalSalesReturns += amt;
        }
        // Other Incomes
        else {
          totalOtherIncomes += amt;
        }
      }
      // EXPENSE ACCOUNTS
      else if (group.nature === 'expense') {
        const amt = movementSigned; // expense increases on debit
        if (amt <= 0.009) return;
        
        console.log(`💸 Expense: ${ledger.ledger_name} (${group.group_code}) = ${amt}`);
        
        // Purchases
        if (['PUR', 'PURCHASE'].includes(group.group_code)) {
          totalPurchases += amt;
        }
        // Purchase Returns
        else if (['PUR_RET', 'PURCHASE_RETURNS'].includes(group.group_code)) {
          totalPurchaseReturns += amt;
        }
        // Direct Expenses
        else if (['DIR_EXP', 'FREIGHT_IN', 'CARRIAGE', 'WAGES', 'MFG_EXP', 'PROD_EXP'].includes(group.group_code)) {
          totalDirectExpenses += amt;
        }
        // Indirect Expenses
        else {
          totalIndirectExpenses += amt;
        }
      }
    });
    
    // Calculate P&L components
    const netSales = totalSales - totalSalesReturns;
    const netPurchases = totalPurchases - totalPurchaseReturns;
    const cogs = openingStock + netPurchases + totalDirectExpenses - closingStock;
    const grossProfit = netSales - cogs;
    const netProfit = grossProfit + totalOtherIncomes - totalIndirectExpenses;
    
    console.log(`📊 Calculations:`);
    console.log(`  Sales: ${totalSales}, Returns: ${totalSalesReturns}, Net: ${netSales}`);
    console.log(`  Purchases: ${totalPurchases}, Returns: ${totalPurchaseReturns}, Net: ${netPurchases}`);
    console.log(`  COGS: ${cogs}, Gross Profit: ${grossProfit}, Net Profit: ${netProfit}`);
    
    // Calculate margins
    const grossProfitMargin = netSales > 0 ? (grossProfit / netSales * 100) : 0;
    const netProfitMargin = netSales > 0 ? (netProfit / netSales * 100) : 0;
    const cogsPercentage = netSales > 0 ? (cogs / netSales * 100) : 0;
    
    return {
      revenue: {
        sales: netSales,
        total: netSales
      },
      costOfGoodsSold: {
        openingStock,
        purchases: netPurchases,
        directExpenses: totalDirectExpenses,
        goodsAvailable: openingStock + netPurchases + totalDirectExpenses,
        closingStock,
        total: cogs
      },
      grossProfit: {
        amount: grossProfit,
        margin: grossProfitMargin
      },
      expenses: {
        indirect: totalIndirectExpenses,
        total: totalIndirectExpenses
      },
      otherIncomes: {
        total: totalOtherIncomes
      },
      netProfit: {
        amount: netProfit,
        margin: netProfitMargin
      },
      metrics: {
        grossProfitMargin,
        netProfitMargin,
        cogsPercentage
      }
    };
  } catch (error) {
    logger.error('Error generating P&L report:', error);
    throw error;
  }
}

/**
 * Generate Balance Sheet Report
 * @param {Object} tenantModels - Tenant database models
 * @param {Object} options - Report options (asOnDate, etc.)
 * @returns {Object} - Balance sheet data
 */
async function generateBalanceSheetReport(tenantModels, options = {}) {
  try {
    const { asOnDate } = options;
    
    // Get all ledgers with their balances
    const ledgers = await tenantModels.Ledger.findAll({
      include: [{
        model: tenantModels.VoucherLedgerEntry,
        as: 'ledgerEntries',
        attributes: ['debit_amount', 'credit_amount'],
        required: false
      }]
    });
    
    // Categorize ledgers
    const assets = [];
    const liabilities = [];
    
    let totalAssets = 0;
    let totalLiabilities = 0;
    
    for (const ledger of ledgers) {
      const balance = parseFloat(ledger.current_balance || 0);
      const balanceType = ledger.balance_type?.toLowerCase() || '';
      const ledgerName = ledger.ledger_name.toLowerCase();
      
      // Skip P&L accounts (Sales, Purchase, Round Off)
      if (ledgerName.includes('sales') && !ledgerName.includes('test')) continue;
      if (ledgerName.includes('purchase') && !ledgerName.includes('test')) continue;
      if (ledgerName.includes('round off')) continue;
      
      if (balance <= 0) continue;
      
      // Determine category
      let category = 'Other';
      if (ledgerName.includes('stock')) category = 'Inventory';
      else if (ledgerName.includes('cash')) category = 'Cash & Bank';
      else if (ledgerName.includes('bank')) category = 'Cash & Bank';
      else if (ledgerName.includes('gst') || ledgerName.includes('tax')) category = 'Tax Accounts';
      else if (ledgerName.includes('test sales')) category = 'Sundry Debtors';
      else if (ledgerName.includes('test purchase')) category = 'Sundry Creditors';
      
      const ledgerInfo = {
        name: ledger.ledger_name,
        category,
        balance
      };
      
      // Categorize based on balance type
      if (balanceType === 'debit') {
        assets.push(ledgerInfo);
        totalAssets += balance;
      } else if (balanceType === 'credit') {
        liabilities.push(ledgerInfo);
        totalLiabilities += balance;
      }
    }
    
    // Calculate Net Profit from P&L
    const plReport = await generateProfitLossReport(tenantModels, options);
    const netProfit = plReport.netProfit.amount;
    
    // Group assets and liabilities by category
    const groupedAssets = groupByCategory(assets);
    const groupedLiabilities = groupByCategory(liabilities);
    
    return {
      capital: {
        netProfit,
        total: netProfit
      },
      liabilities: {
        items: groupedLiabilities,
        total: totalLiabilities
      },
      assets: {
        items: groupedAssets,
        total: totalAssets
      },
      totals: {
        liabilitiesAndCapital: netProfit + totalLiabilities,
        assets: totalAssets,
        difference: Math.abs((netProfit + totalLiabilities) - totalAssets)
      }
    };
  } catch (error) {
    logger.error('Error generating balance sheet:', error);
    throw error;
  }
}

/**
 * Get detailed voucher analysis for reports
 * @param {Object} tenantModels - Tenant database models
 * @param {String} voucherType - Type of voucher (sales_invoice, purchase_invoice)
 * @returns {Array} - Voucher details
 */
async function getVoucherAnalysis(tenantModels, voucherType) {
  try {
    const vouchers = await tenantModels.Voucher.findAll({
      where: {
        voucher_type: voucherType
      },
      include: [{
        model: tenantModels.VoucherItem,
        as: 'items',
        attributes: ['item_name', 'quantity', 'rate', 'amount', 'cgst_amount', 'sgst_amount', 'igst_amount']
      }],
      order: [['voucher_date', 'DESC']]
    });
    
    return vouchers.map(v => {
      const items = v.items || [];
      const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const tax = items.reduce((sum, item) => 
        sum + parseFloat(item.cgst_amount || 0) + 
        parseFloat(item.sgst_amount || 0) + 
        parseFloat(item.igst_amount || 0), 0
      );
      
      return {
        voucherNumber: v.voucher_number,
        voucherDate: v.voucher_date,
        subtotal,
        tax,
        total: parseFloat(v.total_amount || 0),
        items: items.map(item => ({
          name: item.item_name,
          quantity: parseFloat(item.quantity || 0),
          rate: parseFloat(item.rate || 0),
          amount: parseFloat(item.amount || 0)
        }))
      };
    });
  } catch (error) {
    logger.error('Error getting voucher analysis:', error);
    throw error;
  }
}

/**
 * Get COGS analysis for sold items
 * @param {Object} tenantModels - Tenant database models
 * @returns {Array} - COGS details
 */
async function getCOGSAnalysis(tenantModels) {
  try {
    const salesVouchers = await tenantModels.Voucher.findAll({
      where: {
        voucher_type: 'sales_invoice'
      },
      include: [{
        model: tenantModels.VoucherItem,
        as: 'items',
        include: [{
          model: tenantModels.InventoryItem,
          as: 'inventoryItem',
          attributes: ['avg_cost', 'purchase_price']
        }]
      }]
    });
    
    const cogsDetails = [];
    
    salesVouchers.forEach(voucher => {
      voucher.items?.forEach(item => {
        if (item.inventoryItem) {
          const cost = parseFloat(item.inventoryItem.avg_cost || item.inventoryItem.purchase_price || 0);
          const quantity = parseFloat(item.quantity || 0);
          const cogs = cost * quantity;
          
          cogsDetails.push({
            voucherNumber: voucher.voucher_number,
            itemName: item.item_name,
            quantity,
            costPerUnit: cost,
            totalCOGS: cogs
          });
        }
      });
    });
    
    return cogsDetails;
  } catch (error) {
    logger.error('Error getting COGS analysis:', error);
    throw error;
  }
}

/**
 * Helper function to group items by category
 */
function groupByCategory(items) {
  const grouped = {};
  
  items.forEach(item => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push({
      name: item.name,
      balance: item.balance
    });
  });
  
  return grouped;
}

/**
 * Generate Trial Balance Report
 * @param {Object} tenantModels - Tenant database models
 * @param {Object} options - Report options
 * @returns {Object} - Trial balance data
 */
async function generateTrialBalanceReport(tenantModels, options = {}) {
  try {
    const ledgers = await tenantModels.Ledger.findAll({
      include: [{
        model: tenantModels.VoucherLedgerEntry,
        as: 'ledgerEntries',
        attributes: ['debit_amount', 'credit_amount'],
        required: false
      }]
    });
    
    const trialBalance = [];
    let totalDebits = 0;
    let totalCredits = 0;
    
    ledgers.forEach(ledger => {
      const entries = ledger.ledgerEntries || [];
      const debitTotal = entries.reduce((sum, e) => sum + parseFloat(e.debit_amount || 0), 0);
      const creditTotal = entries.reduce((sum, e) => sum + parseFloat(e.credit_amount || 0), 0);
      
      if (debitTotal > 0 || creditTotal > 0) {
        trialBalance.push({
          ledgerName: ledger.ledger_name,
          debit: debitTotal,
          credit: creditTotal
        });
        
        totalDebits += debitTotal;
        totalCredits += creditTotal;
      }
    });
    
    return {
      ledgers: trialBalance,
      totals: {
        debit: totalDebits,
        credit: totalCredits,
        difference: Math.abs(totalDebits - totalCredits)
      }
    };
  } catch (error) {
    logger.error('Error generating trial balance:', error);
    throw error;
  }
}

module.exports = {
  generateProfitLossReport,
  generateBalanceSheetReport,
  getVoucherAnalysis,
  getCOGSAnalysis,
  generateTrialBalanceReport
};
