const logger = require('../utils/logger');

/**
 * Voucher Posting Service
 * Handles ledger entry generation and posting for different voucher types
 */

/**
 * Generate ledger entries based on voucher type
 * @param {Object} tenantModels - Tenant database models
 * @param {Object} voucher - Voucher object
 * @param {Array} items - Voucher items
 * @param {Object} transaction - Database transaction
 * @returns {Array} - Array of ledger entries
 */
async function generateLedgerEntriesByType(tenantModels, voucher, items, transaction) {
  const voucherType = voucher.voucher_type?.toLowerCase();
  
  switch (voucherType) {
    // Sales related vouchers
    case 'sales_invoice':
    case 'tax_invoice':
    case 'retail_invoice':
    case 'export_invoice':
      return await generateSalesInvoiceEntries(tenantModels, voucher, items, transaction);
    
    // Purchase related vouchers
    case 'purchase_invoice':
    case 'purchase':
      return await generatePurchaseInvoiceEntries(tenantModels, voucher, items, transaction);
    
    // Delivery and supply vouchers (no accounting entries, just inventory movement)
    case 'delivery_challan':
    case 'bill_of_supply':
      return await generateDeliveryChallanEntries(tenantModels, voucher, items, transaction);
    
    // Order vouchers (no accounting entries until converted to invoice)
    case 'sales_order':
    case 'purchase_order':
    case 'proforma_invoice':
      logger.info(`${voucherType} - No ledger entries generated (order/proforma)`);
      return [];
    
    // Payment and receipt vouchers
    case 'payment':
      return await generatePaymentEntries(tenantModels, voucher, items, transaction);
    
    case 'receipt':
      return await generateReceiptEntries(tenantModels, voucher, items, transaction);
    
    // Journal voucher
    case 'journal':
      return await generateJournalEntries(tenantModels, voucher, items, transaction);
    
    // Credit and debit notes
    case 'credit_note':
      return await generateCreditNoteEntries(tenantModels, voucher, items, transaction);
    
    case 'debit_note':
      return await generateDebitNoteEntries(tenantModels, voucher, items, transaction);
    
    // Contra voucher
    case 'contra':
      return await generateContraEntries(tenantModels, voucher, items, transaction);
    
    default:
      logger.warn(`No posting method defined for voucher type: ${voucherType}`);
      return [];
  }
}

/**
 * Generate ledger entries for Sales Invoice
 */
async function generateSalesInvoiceEntries(tenantModels, voucher, items, transaction) {
  const ledgerEntries = [];
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const totalCGST = items.reduce((sum, item) => sum + parseFloat(item.cgst_amount || 0), 0);
  const totalSGST = items.reduce((sum, item) => sum + parseFloat(item.sgst_amount || 0), 0);
  const totalIGST = items.reduce((sum, item) => sum + parseFloat(item.igst_amount || 0), 0);
  const totalAmount = subtotal + totalCGST + totalSGST + totalIGST;
  
  // Calculate COGS (Cost of Goods Sold) for Stock in Hand credit
  let totalCOGS = 0;
  for (const item of items) {
    if (item.inventory_item_id) {
      const inventoryItem = await tenantModels.InventoryItem.findByPk(item.inventory_item_id, { transaction });
      if (inventoryItem) {
        const cost = parseFloat(inventoryItem.avg_cost || inventoryItem.purchase_price || 0);
        const quantity = parseFloat(item.quantity || 0);
        totalCOGS += cost * quantity;
      }
    }
  }
  
  // Find required ledgers
  const salesLedger = await findLedger(tenantModels, voucher.tenant_id, ['Sales', '%sales%'], transaction);
  const cgstLedger = await findLedger(tenantModels, voucher.tenant_id, ['%CGST%'], transaction);
  const sgstLedger = await findLedger(tenantModels, voucher.tenant_id, ['%SGST%'], transaction);
  const igstLedger = await findLedger(tenantModels, voucher.tenant_id, ['%IGST%'], transaction);
  const stockLedger = await findLedger(tenantModels, voucher.tenant_id, ['%Stock%'], transaction);
  
  // 1. Debit Customer Account (Sundry Debtor)
  if (voucher.party_ledger_id) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: voucher.party_ledger_id,
      debit_amount: totalAmount,
      credit_amount: 0,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 2. Credit Sales Account
  if (salesLedger && subtotal > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: salesLedger.id,
      debit_amount: 0,
      credit_amount: subtotal,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 3. Credit CGST (Output Tax)
  if (cgstLedger && totalCGST > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: cgstLedger.id,
      debit_amount: 0,
      credit_amount: totalCGST,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 4. Credit SGST (Output Tax)
  if (sgstLedger && totalSGST > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: sgstLedger.id,
      debit_amount: 0,
      credit_amount: totalSGST,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 5. Credit IGST (for interstate sales)
  if (igstLedger && totalIGST > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: igstLedger.id,
      debit_amount: 0,
      credit_amount: totalIGST,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 6. Credit Stock in Hand (Cost of Goods Sold)
  if (stockLedger && totalCOGS > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: stockLedger.id,
      debit_amount: 0,
      credit_amount: totalCOGS,
      tenant_id: voucher.tenant_id,
    });
    logger.info(`Added Stock in Hand credit entry: ${totalCOGS} (COGS)`);
  }
  
  return ledgerEntries;
}

/**
 * Generate ledger entries for Purchase Invoice
 */
async function generatePurchaseInvoiceEntries(tenantModels, voucher, items, transaction) {
  const ledgerEntries = [];
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const totalCGST = items.reduce((sum, item) => sum + parseFloat(item.cgst_amount || 0), 0);
  const totalSGST = items.reduce((sum, item) => sum + parseFloat(item.sgst_amount || 0), 0);
  const totalIGST = items.reduce((sum, item) => sum + parseFloat(item.igst_amount || 0), 0);
  const totalAmount = subtotal + totalCGST + totalSGST + totalIGST;
  
  // Find required ledgers
  const purchaseLedger = await findLedger(tenantModels, voucher.tenant_id, ['Purchase', 'Purchases', '%purchase%'], transaction);
  const cgstLedger = await findLedger(tenantModels, voucher.tenant_id, ['%CGST%'], transaction);
  const sgstLedger = await findLedger(tenantModels, voucher.tenant_id, ['%SGST%'], transaction);
  const igstLedger = await findLedger(tenantModels, voucher.tenant_id, ['%IGST%'], transaction);
  const stockLedger = await findLedger(tenantModels, voucher.tenant_id, ['%Stock%'], transaction);
  
  // 1. Debit Purchase Account
  if (purchaseLedger && subtotal > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: purchaseLedger.id,
      debit_amount: subtotal,
      credit_amount: 0,
      tenant_id: voucher.tenant_id,
    });
    logger.info(`Added Purchase debit entry: ${subtotal}`);
  }
  
  // 2. Debit Stock in Hand (inventory value increases)
  if (stockLedger && subtotal > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: stockLedger.id,
      debit_amount: subtotal,
      credit_amount: 0,
      tenant_id: voucher.tenant_id,
    });
    logger.info(`Added Stock in Hand debit entry: ${subtotal}`);
  }
  
  // 3. Debit CGST (Input Tax Credit)
  if (cgstLedger && totalCGST > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: cgstLedger.id,
      debit_amount: totalCGST,
      credit_amount: 0,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 4. Debit SGST (Input Tax Credit)
  if (sgstLedger && totalSGST > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: sgstLedger.id,
      debit_amount: totalSGST,
      credit_amount: 0,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 5. Debit IGST (for interstate purchases)
  if (igstLedger && totalIGST > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: igstLedger.id,
      debit_amount: totalIGST,
      credit_amount: 0,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 6. Credit Supplier Account (Sundry Creditor)
  if (voucher.party_ledger_id) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: voucher.party_ledger_id,
      debit_amount: 0,
      credit_amount: totalAmount,
      tenant_id: voucher.tenant_id,
    });
  }
  
  return ledgerEntries;
}

/**
 * Generate ledger entries for Delivery Challan / Bill of Supply
 * These are typically for goods movement without immediate sale
 * No accounting entries, just for tracking
 */
async function generateDeliveryChallanEntries(tenantModels, voucher, items, transaction) {
  // Delivery challans don't create accounting entries
  // They are used for goods movement tracking only
  logger.info('Delivery Challan/Bill of Supply - No ledger entries generated (goods movement only)');
  return [];
}

/**
 * Generate ledger entries for Payment Voucher
 */
async function generatePaymentEntries(tenantModels, voucher, items, transaction) {
  const ledgerEntries = [];
  
  // Payment: Debit Party (Creditor/Expense), Credit Bank/Cash
  const totalAmount = parseFloat(voucher.total_amount || 0);
  
  // 1. Debit Party Account
  if (voucher.party_ledger_id && totalAmount > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: voucher.party_ledger_id,
      debit_amount: totalAmount,
      credit_amount: 0,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 2. Credit Bank/Cash Account (from voucher.bank_ledger_id or default cash)
  if (voucher.bank_ledger_id && totalAmount > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: voucher.bank_ledger_id,
      debit_amount: 0,
      credit_amount: totalAmount,
      tenant_id: voucher.tenant_id,
    });
  }
  
  return ledgerEntries;
}

/**
 * Generate ledger entries for Receipt Voucher
 */
async function generateReceiptEntries(tenantModels, voucher, items, transaction) {
  const ledgerEntries = [];
  
  // Receipt: Debit Bank/Cash, Credit Party (Debtor/Income)
  const totalAmount = parseFloat(voucher.total_amount || 0);
  
  // 1. Debit Bank/Cash Account
  if (voucher.bank_ledger_id && totalAmount > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: voucher.bank_ledger_id,
      debit_amount: totalAmount,
      credit_amount: 0,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 2. Credit Party Account
  if (voucher.party_ledger_id && totalAmount > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: voucher.party_ledger_id,
      debit_amount: 0,
      credit_amount: totalAmount,
      tenant_id: voucher.tenant_id,
    });
  }
  
  return ledgerEntries;
}

/**
 * Generate ledger entries for Journal Voucher
 */
async function generateJournalEntries(tenantModels, voucher, items, transaction) {
  // Journal entries are typically manually created
  // Return empty array as they should be provided in the request
  logger.info('Journal voucher - ledger entries should be provided manually');
  return [];
}

/**
 * Generate ledger entries for Credit Note
 */
async function generateCreditNoteEntries(tenantModels, voucher, items, transaction) {
  const ledgerEntries = [];
  
  // Credit Note: Reverse of Sales Invoice
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const totalCGST = items.reduce((sum, item) => sum + parseFloat(item.cgst_amount || 0), 0);
  const totalSGST = items.reduce((sum, item) => sum + parseFloat(item.sgst_amount || 0), 0);
  const totalIGST = items.reduce((sum, item) => sum + parseFloat(item.igst_amount || 0), 0);
  const totalAmount = subtotal + totalCGST + totalSGST + totalIGST;
  
  const salesLedger = await findLedger(tenantModels, voucher.tenant_id, ['Sales', '%sales%'], transaction);
  const cgstLedger = await findLedger(tenantModels, voucher.tenant_id, ['%CGST%'], transaction);
  const sgstLedger = await findLedger(tenantModels, voucher.tenant_id, ['%SGST%'], transaction);
  const igstLedger = await findLedger(tenantModels, voucher.tenant_id, ['%IGST%'], transaction);
  
  // 1. Credit Customer Account (reverse debit)
  if (voucher.party_ledger_id) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: voucher.party_ledger_id,
      debit_amount: 0,
      credit_amount: totalAmount,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 2. Debit Sales Account (reverse credit)
  if (salesLedger && subtotal > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: salesLedger.id,
      debit_amount: subtotal,
      credit_amount: 0,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 3. Debit CGST (reverse output tax)
  if (cgstLedger && totalCGST > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: cgstLedger.id,
      debit_amount: totalCGST,
      credit_amount: 0,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 4. Debit SGST (reverse output tax)
  if (sgstLedger && totalSGST > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: sgstLedger.id,
      debit_amount: totalSGST,
      credit_amount: 0,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 5. Debit IGST
  if (igstLedger && totalIGST > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: igstLedger.id,
      debit_amount: totalIGST,
      credit_amount: 0,
      tenant_id: voucher.tenant_id,
    });
  }
  
  return ledgerEntries;
}

/**
 * Generate ledger entries for Debit Note
 */
async function generateDebitNoteEntries(tenantModels, voucher, items, transaction) {
  const ledgerEntries = [];
  
  // Debit Note: Reverse of Purchase Invoice
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const totalCGST = items.reduce((sum, item) => sum + parseFloat(item.cgst_amount || 0), 0);
  const totalSGST = items.reduce((sum, item) => sum + parseFloat(item.sgst_amount || 0), 0);
  const totalIGST = items.reduce((sum, item) => sum + parseFloat(item.igst_amount || 0), 0);
  const totalAmount = subtotal + totalCGST + totalSGST + totalIGST;
  
  const purchaseLedger = await findLedger(tenantModels, voucher.tenant_id, ['Purchase', 'Purchases', '%purchase%'], transaction);
  const cgstLedger = await findLedger(tenantModels, voucher.tenant_id, ['%CGST%'], transaction);
  const sgstLedger = await findLedger(tenantModels, voucher.tenant_id, ['%SGST%'], transaction);
  const igstLedger = await findLedger(tenantModels, voucher.tenant_id, ['%IGST%'], transaction);
  
  // 1. Debit Supplier Account (reverse credit)
  if (voucher.party_ledger_id) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: voucher.party_ledger_id,
      debit_amount: totalAmount,
      credit_amount: 0,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 2. Credit Purchase Account (reverse debit)
  if (purchaseLedger && subtotal > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: purchaseLedger.id,
      debit_amount: 0,
      credit_amount: subtotal,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 3. Credit CGST (reverse input tax)
  if (cgstLedger && totalCGST > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: cgstLedger.id,
      debit_amount: 0,
      credit_amount: totalCGST,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 4. Credit SGST (reverse input tax)
  if (sgstLedger && totalSGST > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: sgstLedger.id,
      debit_amount: 0,
      credit_amount: totalSGST,
      tenant_id: voucher.tenant_id,
    });
  }
  
  // 5. Credit IGST
  if (igstLedger && totalIGST > 0) {
    ledgerEntries.push({
      voucher_id: voucher.id,
      ledger_id: igstLedger.id,
      debit_amount: 0,
      credit_amount: totalIGST,
      tenant_id: voucher.tenant_id,
    });
  }
  
  return ledgerEntries;
}

/**
 * Generate ledger entries for Contra Voucher
 */
async function generateContraEntries(tenantModels, voucher, items, transaction) {
  // Contra entries are typically manually created (bank to cash, cash to bank)
  // Return empty array as they should be provided in the request
  logger.info('Contra voucher - ledger entries should be provided manually');
  return [];
}

/**
 * Helper function to find ledger by name patterns
 */
async function findLedger(tenantModels, tenantId, patterns, transaction) {
  const conditions = patterns.map(pattern => {
    if (pattern.includes('%')) {
      return { [tenantModels.Sequelize.Op.like]: pattern };
    }
    return pattern;
  });
  
  return await tenantModels.Ledger.findOne({
    where: { 
      ledger_name: {
        [tenantModels.Sequelize.Op.or]: conditions
      },
      tenant_id: tenantId
    },
    transaction
  });
}

/**
 * Update ledger balance based on ledger entries
 */
async function updateLedgerBalance(tenantModels, ledgerId, transaction) {
  try {
    const ledger = await tenantModels.Ledger.findByPk(ledgerId, { transaction });
    if (!ledger) {
      logger.warn(`Ledger not found: ${ledgerId}`);
      return;
    }

    // Calculate total debits and credits from ledger entries
    const entries = await tenantModels.VoucherLedgerEntry.findAll({
      where: { ledger_id: ledgerId },
      attributes: [
        [tenantModels.sequelize.fn('SUM', tenantModels.sequelize.col('debit_amount')), 'total_debit'],
        [tenantModels.sequelize.fn('SUM', tenantModels.sequelize.col('credit_amount')), 'total_credit']
      ],
      raw: true,
      transaction
    });

    const totalDebit = parseFloat(entries[0]?.total_debit || 0);
    const totalCredit = parseFloat(entries[0]?.total_credit || 0);
    const openingBalance = parseFloat(ledger.opening_balance || 0);

    // Calculate current balance based on ledger type
    let currentBalance = openingBalance;
    if (ledger.balance_type === 'debit' || ledger.opening_balance_type === 'Dr') {
      currentBalance = openingBalance + totalDebit - totalCredit;
    } else {
      currentBalance = openingBalance + totalCredit - totalDebit;
    }

    // Determine the balance type based on the sign
    let balanceType;
    if (currentBalance >= 0) {
      balanceType = (ledger.balance_type === 'debit' || ledger.opening_balance_type === 'Dr') ? 'Dr' : 'Cr';
    } else {
      balanceType = (ledger.balance_type === 'debit' || ledger.opening_balance_type === 'Dr') ? 'Cr' : 'Dr';
    }

    // Update the ledger's current balance and balance type
    await ledger.update({
      current_balance: Math.abs(currentBalance),
      balance_type: balanceType === 'Dr' ? 'debit' : 'credit'
    }, { transaction });

    logger.info(`Updated ledger balance for ${ledger.ledger_name}: ${Math.abs(currentBalance)} ${balanceType}`);
    return { balance: Math.abs(currentBalance), balanceType };
  } catch (error) {
    logger.error(`Error updating ledger balance for ${ledgerId}:`, error);
    throw error;
  }
}

module.exports = {
  generateLedgerEntriesByType,
  updateLedgerBalance,
  generateSalesInvoiceEntries,
  generatePurchaseInvoiceEntries,
  generateDeliveryChallanEntries,
  generatePaymentEntries,
  generateReceiptEntries,
  generateJournalEntries,
  generateCreditNoteEntries,
  generateDebitNoteEntries,
  generateContraEntries,
};
