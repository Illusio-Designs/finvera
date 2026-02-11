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
  try {
    const { startDate, endDate } = options;
    
    // Get Sales, Purchase, and other P&L accounts
    const plAccounts = await tenantModels.Ledger.findAll({
      where: {
        ledger_name: {
          [tenantModels.Sequelize.Op.or]: [
            { [tenantModels.Sequelize.Op.like]: '%Sales%' },
            { [tenantModels.Sequelize.Op.like]: '%Purchase%' },
            { [tenantModels.Sequelize.Op.like]: '%Round Off%' }
          ]
        }
      },
      include: [{
        model: tenantModels.VoucherLedgerEntry,
        as: 'ledgerEntries',
        attributes: ['debit_amount', 'credit_amount'],
        required: false
      }]
    });
    
    // Get Stock information
    const stockLedger = await tenantModels.Ledger.findOne({
      where: {
        ledger_name: {
          [tenantModels.Sequelize.Op.like]: '%Stock%'
        }
      },
      include: [{
        model: tenantModels.VoucherLedgerEntry,
        as: 'ledgerEntries',
        attributes: ['debit_amount', 'credit_amount'],
        required: false
      }]
    });
    
    const openingStock = parseFloat(stockLedger?.opening_balance || 0);
    const closingStock = parseFloat(stockLedger?.current_balance || 0);
    
    // Calculate totals
    let sales = 0;
    let purchases = 0;
    let expenses = 0;
    
    plAccounts.forEach(ledger => {
      const name = ledger.ledger_name.toLowerCase();
      const entries = ledger.ledgerEntries || [];
      
      const totalCredit = entries.reduce((sum, e) => sum + parseFloat(e.credit_amount || 0), 0);
      const totalDebit = entries.reduce((sum, e) => sum + parseFloat(e.debit_amount || 0), 0);
      
      if (name.includes('sales') && !name.includes('test')) {
        sales = totalCredit - totalDebit;
      } else if (name.includes('purchase') && !name.includes('test')) {
        purchases = totalDebit - totalCredit;
      } else if (name.includes('round off')) {
        expenses += Math.abs(totalDebit - totalCredit);
      }
    });
    
    // Calculate COGS
    const cogs = openingStock + purchases - closingStock;
    
    // Calculate profits
    const grossProfit = sales - cogs;
    const netProfit = grossProfit - expenses;
    
    // Calculate margins
    const grossProfitMargin = sales > 0 ? (grossProfit / sales * 100) : 0;
    const netProfitMargin = sales > 0 ? (netProfit / sales * 100) : 0;
    const cogsPercentage = sales > 0 ? (cogs / sales * 100) : 0;
    
    return {
      revenue: {
        sales,
        total: sales
      },
      costOfGoodsSold: {
        openingStock,
        purchases,
        goodsAvailable: openingStock + purchases,
        closingStock,
        total: cogs
      },
      grossProfit: {
        amount: grossProfit,
        margin: grossProfitMargin
      },
      expenses: {
        roundOff: expenses,
        total: expenses
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
