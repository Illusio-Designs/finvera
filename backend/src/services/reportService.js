const logger = require('../utils/logger');

/**
 * Report Service
 * Handles generation of financial reports (P&L, Balance Sheet, Trial Balance, etc.)
 * Uses enhanced account group metadata (nature, bs_category, affects_pl, is_tax_group)
 */

// Helper function to safely parse numbers
function toNum(v, fallback = 0) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Generate Profit & Loss Report
 * @param {Object} tenantModels - Tenant database models
 * @param {Object} masterModels - Master database models
 * @param {Object} options - Report options (startDate, endDate, etc.)
 * @returns {Object} - P&L report data
 */
async function generateProfitLossReport(tenantModels, masterModels, options = {}) {
  const { Sequelize } = tenantModels;
  const { Op } = Sequelize;
  
  try {
    const { startDate, endDate } = options;
    
    console.log('📊 Report Service - Generating P&L Report');
    console.log(`📅 Period: ${startDate} to ${endDate}`);
    
    // Get all account groups with new metadata
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
        debit: toNum(entry.total_debit, 0),
        credit: toNum(entry.total_credit, 0)
      });
    });
    
    // Get stock information (INV group)
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
        const qty = toNum(item.quantity_on_hand, 0);
        const avgCost = toNum(item.avg_cost, 0);
        openingStock += toNum(item.opening_balance, 0);
        closingStock += qty * avgCost;
      });
    } else {
      // Fallback to ledger balances
      stockLedgers.forEach(ledger => {
        openingStock += toNum(ledger.opening_balance, 0);
        closingStock += toNum(ledger.current_balance, 0);
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
    
    // Process each ledger - USE affects_pl flag
    ledgers.forEach(ledger => {
      const group = groupMap.get(ledger.account_group_id);
      if (!group) return;
      
      // Only process P&L accounts (affects_pl = true)
      if (!group.affects_pl) return;
      
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
        // Other Incomes (DIR_INC, IND_INC)
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
        // Direct Expenses (DIR_EXP)
        else if (['DIR_EXP'].includes(group.group_code)) {
          totalDirectExpenses += amt;
        }
        // Indirect Expenses (IND_EXP)
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
 * @param {Object} masterModels - Master database models
 * @param {Object} options - Report options (asOnDate, etc.)
 * @returns {Object} - Balance sheet data
 */
async function generateBalanceSheetReport(tenantModels, masterModels, options = {}) {
  const { Sequelize } = tenantModels;
  const { Op } = Sequelize;
  
  try {
    const { asOnDate } = options;
    const asOn = asOnDate || new Date().toISOString().slice(0, 10);
    
    console.log('📊 Report Service - Generating Balance Sheet');
    console.log(`📅 As on: ${asOn}`);
    
    // Get all account groups with new metadata
    const accountGroups = await masterModels.AccountGroup.findAll();
    const groupMap = new Map();
    accountGroups.forEach(g => groupMap.set(g.id, g));
    
    // Get all active ledgers
    const ledgers = await tenantModels.Ledger.findAll({ 
      where: { is_active: true }
    });
    
    // Calculate P&L for the period (to add to liabilities)
    const plReport = await generateProfitLossReport(tenantModels, masterModels, {
      startDate: '2026-01-31',
      endDate: asOn
    });
    
    const netProfitLoss = plReport.netProfit.amount;
    
    // Categorize assets and liabilities using bs_category
    const assets = {
      fixed_assets: [],
      current_assets: [],
      investments: [],
      other_assets: []
    };
    
    const liabilities = {
      capital: [],
      reserves: [],
      current_liabilities: [],
      noncurrent_liabilities: [],
      other_liabilities: []
    };
    
    let totalAssets = 0;
    let totalLiabilities = netProfitLoss; // Start with P&L

    ledgers.forEach(ledger => {
      const group = groupMap.get(ledger.account_group_id);
      if (!group) return;

      // Skip P&L accounts (they don't appear in Balance Sheet)
      if (group.affects_pl) return;

      const rawBalance = toNum(ledger.current_balance, 0);
      const balanceType = (ledger.balance_type || 'debit').toLowerCase();
      
      let signedBalance = 0;
      
      // Determine signed balance based on group nature
      if (group.nature === 'asset') {
        signedBalance = balanceType === 'debit' ? rawBalance : -rawBalance;
      } else if (group.nature === 'liability' || group.nature === 'equity') {
        signedBalance = balanceType === 'credit' ? rawBalance : -rawBalance;
      } else {
        return; // Skip if nature is not recognized
      }
      
      if (Math.abs(signedBalance) < 0.01) return;

      const ledgerInfo = {
        name: ledger.ledger_name,
        code: ledger.ledger_code,
        balance: signedBalance,
        balance_type: balanceType,
        group: group.name,
        bs_category: group.bs_category
      };

      // ASSETS - Use bs_category
      if (group.nature === 'asset') {
        totalAssets += signedBalance;

        if (group.bs_category === 'fixed_asset') {
          assets.fixed_assets.push(ledgerInfo);
        } else if (group.bs_category === 'current_asset') {
          assets.current_assets.push(ledgerInfo);
        } else if (group.bs_category === 'investment') {
          assets.investments.push(ledgerInfo);
        } else {
          assets.other_assets.push(ledgerInfo);
        }
      }
      // LIABILITIES & EQUITY - Use bs_category and is_tax_group
      else if (group.nature === 'liability' || group.nature === 'equity') {
        totalLiabilities += signedBalance;

        if (group.nature === 'equity' || group.bs_category === 'equity') {
          // Capital and Reserves
          if (group.group_code === 'CAP') {
            liabilities.capital.push(ledgerInfo);
          } else {
            liabilities.reserves.push(ledgerInfo);
          }
        } else if (group.bs_category === 'current_liability') {
          liabilities.current_liabilities.push(ledgerInfo);
        } else if (group.bs_category === 'noncurrent_liability') {
          liabilities.noncurrent_liabilities.push(ledgerInfo);
        } else if (group.is_tax_group) {
          // GST/Tax ledgers - special handling
          // Input GST (debit) = Asset, Output GST (credit) = Liability
          if (balanceType === 'debit') {
            // Input GST - treat as current asset
            totalAssets += signedBalance;
            totalLiabilities -= signedBalance; // Remove from liabilities
            assets.current_assets.push({
              ...ledgerInfo,
              group: `${group.name} (Input GST)`
            });
          } else {
            // Output GST - treat as current liability
            liabilities.current_liabilities.push({
              ...ledgerInfo,
              group: `${group.name} (Output GST)`
            });
          }
        } else {
          liabilities.other_liabilities.push(ledgerInfo);
        }
      }
    });

    // Calculate totals
    const fixedAssetsTotal = assets.fixed_assets.reduce((sum, a) => sum + a.balance, 0);
    const currentAssetsTotal = assets.current_assets.reduce((sum, a) => sum + a.balance, 0);
    const investmentsTotal = assets.investments.reduce((sum, a) => sum + a.balance, 0);
    const otherAssetsTotal = assets.other_assets.reduce((sum, a) => sum + a.balance, 0);

    const capitalTotal = liabilities.capital.reduce((sum, l) => sum + l.balance, 0);
    const reservesTotal = liabilities.reserves.reduce((sum, l) => sum + l.balance, 0);
    const currentLiabilitiesTotal = liabilities.current_liabilities.reduce((sum, l) => sum + l.balance, 0);
    const noncurrentLiabilitiesTotal = liabilities.noncurrent_liabilities.reduce((sum, l) => sum + l.balance, 0);
    const otherLiabilitiesTotal = liabilities.other_liabilities.reduce((sum, l) => sum + l.balance, 0);

    const difference = totalAssets - totalLiabilities;
    const isBalanced = Math.abs(difference) < 1.0;

    // Key ratios
    const currentRatio = currentLiabilitiesTotal > 0 ? (currentAssetsTotal / currentLiabilitiesTotal) : 0;
    const debtToEquity = (capitalTotal + reservesTotal) > 0 ? (noncurrentLiabilitiesTotal / (capitalTotal + reservesTotal)) : 0;
    const workingCapital = currentAssetsTotal - currentLiabilitiesTotal;

    console.log(`  Total Assets: ₹${totalAssets.toFixed(2)}`);
    console.log(`  Total Liabilities: ₹${totalLiabilities.toFixed(2)}`);
    console.log(`  Difference: ₹${difference.toFixed(2)} ${isBalanced ? '✓' : '✗'}`);

    return {
      liabilities_and_equity: {
        capital: {
          total: capitalTotal,
          accounts: liabilities.capital
        },
        reserves_and_surplus: {
          total: reservesTotal,
          accounts: liabilities.reserves
        },
        profit_and_loss: {
          amount: netProfitLoss,
          type: netProfitLoss >= 0 ? 'profit' : 'loss',
          as_of_date: asOn
        },
        noncurrent_liabilities: {
          total: noncurrentLiabilitiesTotal,
          accounts: liabilities.noncurrent_liabilities
        },
        current_liabilities: {
          total: currentLiabilitiesTotal,
          accounts: liabilities.current_liabilities
        },
        other_liabilities: {
          total: otherLiabilitiesTotal,
          accounts: liabilities.other_liabilities
        },
        total: totalLiabilities
      },
      assets: {
        fixed_assets: {
          total: fixedAssetsTotal,
          accounts: assets.fixed_assets
        },
        investments: {
          total: investmentsTotal,
          accounts: assets.investments
        },
        current_assets: {
          total: currentAssetsTotal,
          accounts: assets.current_assets
        },
        other_assets: {
          total: otherAssetsTotal,
          accounts: assets.other_assets
        },
        total: totalAssets
      },
      balance_check: {
        total_assets: totalAssets,
        total_liabilities_and_equity: totalLiabilities,
        difference: difference,
        is_balanced: isBalanced
      },
      financial_ratios: {
        current_ratio: currentRatio,
        debt_to_equity_ratio: debtToEquity,
        working_capital: workingCapital
      },
      as_on_date: asOn,
      format: "balance_sheet"
    };
  } catch (error) {
    logger.error('Error generating balance sheet:', error);
    throw error;
  }
}

/**
 * Generate Trial Balance Report
 * @param {Object} tenantModels - Tenant database models
 * @param {Object} masterModels - Master database models
 * @param {Object} options - Report options
 * @returns {Object} - Trial balance data
 */
async function generateTrialBalanceReport(tenantModels, masterModels, options = {}) {
  const { Sequelize } = tenantModels;
  const { Op } = Sequelize;
  
  try {
    const { asOnDate } = options;
    const asOn = asOnDate || new Date().toISOString().slice(0, 10);
    
    console.log('📊 Report Service - Generating Trial Balance');
    console.log(`📅 As on: ${asOn}`);
    
    // Get all account groups
    const accountGroups = await masterModels.AccountGroup.findAll();
    const groupMap = new Map();
    accountGroups.forEach(g => groupMap.set(g.id, g));
    
    // Get all active ledgers
    const ledgers = await tenantModels.Ledger.findAll({
      where: { is_active: true }
    });
    
    // Get movements up to asOnDate
    const voucherWhere = { 
      status: 'posted',
      voucher_date: { [Op.lte]: asOn }
    };
    
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
    
    const moveMap = new Map();
    ledgerEntries.forEach(entry => {
      moveMap.set(entry.ledger_id, {
        debit: toNum(entry.total_debit, 0),
        credit: toNum(entry.total_credit, 0)
      });
    });
    
    const trialBalance = [];
    let totalDebits = 0;
    let totalCredits = 0;
    
    ledgers.forEach(ledger => {
      const group = groupMap.get(ledger.account_group_id);
      const opening = toNum(ledger.opening_balance, 0);
      const move = moveMap.get(ledger.id) || { debit: 0, credit: 0 };
      
      const debitTotal = opening + move.debit;
      const creditTotal = move.credit;
      
      if (debitTotal > 0.01 || creditTotal > 0.01) {
        trialBalance.push({
          ledgerName: ledger.ledger_name,
          ledgerCode: ledger.ledger_code,
          groupName: group?.name || 'Unknown',
          nature: group?.nature || 'unknown',
          debit: debitTotal,
          credit: creditTotal,
          balance: debitTotal - creditTotal
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
        difference: Math.abs(totalDebits - totalCredits),
        isBalanced: Math.abs(totalDebits - totalCredits) < 1.0
      },
      as_on_date: asOn
    };
  } catch (error) {
    logger.error('Error generating trial balance:', error);
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
      const subtotal = items.reduce((sum, item) => sum + toNum(item.amount, 0), 0);
      const tax = items.reduce((sum, item) => 
        sum + toNum(item.cgst_amount, 0) + 
        toNum(item.sgst_amount, 0) + 
        toNum(item.igst_amount, 0), 0
      );
      
      return {
        voucherNumber: v.voucher_number,
        voucherDate: v.voucher_date,
        subtotal,
        tax,
        total: toNum(v.total_amount, 0),
        items: items.map(item => ({
          name: item.item_name,
          quantity: toNum(item.quantity, 0),
          rate: toNum(item.rate, 0),
          amount: toNum(item.amount, 0)
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
          const cost = toNum(item.inventoryItem.avg_cost || item.inventoryItem.purchase_price, 0);
          const quantity = toNum(item.quantity, 0);
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

module.exports = {
  generateProfitLossReport,
  generateBalanceSheetReport,
  generateTrialBalanceReport,
  getVoucherAnalysis,
  getCOGSAnalysis
};
