const { Voucher, VoucherItem, VoucherLedgerEntry, Ledger, AccountGroup } = require('../models');
const { calculateGST, roundOff } = require('../utils/gstCalculator');

class VoucherService {
  /**
   * Create sales invoice with automatic GST and ledger entries
   */
  async createSalesInvoice(tenantId, invoiceData, userId) {
    const {
      voucher_date,
      party_ledger_id,
      items,
      place_of_supply,
      is_reverse_charge = false,
      narration,
      reference_number,
    } = invoiceData;

    // Get party ledger for GSTIN and state
    const partyLedger = await Ledger.findByPk(party_ledger_id);
    if (!partyLedger) {
      throw new Error('Party ledger not found');
    }

    // Get tenant for supplier state
    const { Tenant } = require('../models');
    const tenant = await Tenant.findByPk(tenantId);
    const supplierState = tenant.state || 'Maharashtra'; // Default

    // Calculate totals
    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalCess = 0;

    const processedItems = items.map((item) => {
      const quantity = parseFloat(item.quantity) || 1;
      const rate = parseFloat(item.rate) || 0;
      const discountPercent = parseFloat(item.discount_percent) || 0;
      const discountAmount = (quantity * rate * discountPercent) / 100;
      const taxableAmount = quantity * rate - discountAmount;

      subtotal += taxableAmount;

      // Calculate GST
      const gstRate = parseFloat(item.gst_rate) || 18;
      const gst = calculateGST(
        taxableAmount,
        gstRate,
        supplierState,
        place_of_supply || partyLedger.state || supplierState
      );

      totalCGST += gst.cgst;
      totalSGST += gst.sgst;
      totalIGST += gst.igst;
      totalCess += parseFloat(item.cess_amount) || 0;

      return {
        ...item,
        quantity,
        rate,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        taxable_amount: taxableAmount,
        gst_rate: gstRate,
        cgst_rate: gst.cgst > 0 ? gstRate / 2 : 0,
        sgst_rate: gst.sgst > 0 ? gstRate / 2 : 0,
        igst_rate: gst.igst > 0 ? gstRate : 0,
        cgst_amount: gst.cgst,
        sgst_amount: gst.sgst,
        igst_amount: gst.igst,
        cess_amount: parseFloat(item.cess_amount) || 0,
        total_amount: taxableAmount + gst.totalTax + (parseFloat(item.cess_amount) || 0),
      };
    });

    const totalTax = totalCGST + totalSGST + totalIGST + totalCess;
    const grandTotal = subtotal + totalTax;
    const roundedTotal = roundOff(grandTotal);
    const roundOffAmount = roundedTotal - grandTotal;

    // Create ledger entries (double-entry)
    const ledgerEntries = [];

    // Debit: Party (Debtor)
    ledgerEntries.push({
      ledger_id: party_ledger_id,
      ledger_name: partyLedger.ledger_name,
      debit_amount: roundedTotal,
      credit_amount: 0,
      narration: narration || `Sales invoice to ${partyLedger.ledger_name}`,
    });

    // Credit: Sales Account
    const salesGroup = await AccountGroup.findOne({
      where: { tenant_id: tenantId, group_code: 'SALES' },
    });
    if (salesGroup) {
      const salesLedger = await Ledger.findOne({
        where: { tenant_id: tenantId, account_group_id: salesGroup.id },
      });
      if (salesLedger) {
        ledgerEntries.push({
          ledger_id: salesLedger.id,
          ledger_name: salesLedger.ledger_name,
          debit_amount: 0,
          credit_amount: subtotal,
          narration: 'Sales revenue',
        });
      }
    }

    // Credit: GST Output Accounts
    if (totalCGST > 0) {
      const cgstLedger = await this.getOrCreateGSTLedger(tenantId, 'CGST_OUTPUT', 'GST Output - CGST');
      ledgerEntries.push({
        ledger_id: cgstLedger.id,
        ledger_name: cgstLedger.ledger_name,
        debit_amount: 0,
        credit_amount: totalCGST,
        narration: 'CGST Output',
      });
    }

    if (totalSGST > 0) {
      const sgstLedger = await this.getOrCreateGSTLedger(tenantId, 'SGST_OUTPUT', 'GST Output - SGST');
      ledgerEntries.push({
        ledger_id: sgstLedger.id,
        ledger_name: sgstLedger.ledger_name,
        debit_amount: 0,
        credit_amount: totalSGST,
        narration: 'SGST Output',
      });
    }

    if (totalIGST > 0) {
      const igstLedger = await this.getOrCreateGSTLedger(tenantId, 'IGST_OUTPUT', 'GST Output - IGST');
      ledgerEntries.push({
        ledger_id: igstLedger.id,
        ledger_name: igstLedger.ledger_name,
        debit_amount: 0,
        credit_amount: totalIGST,
        narration: 'IGST Output',
      });
    }

    if (roundOffAmount !== 0) {
      const roundOffLedger = await this.getOrCreateLedger(tenantId, 'ROUND_OFF', 'Round Off');
      ledgerEntries.push({
        ledger_id: roundOffLedger.id,
        ledger_name: roundOffLedger.ledger_name,
        debit_amount: roundOffAmount > 0 ? roundOffAmount : 0,
        credit_amount: roundOffAmount < 0 ? Math.abs(roundOffAmount) : 0,
        narration: 'Round off',
      });
    }

    return {
      subtotal,
      cgst_amount: totalCGST,
      sgst_amount: totalSGST,
      igst_amount: totalIGST,
      cess_amount: totalCess,
      round_off: roundOffAmount,
      total_amount: roundedTotal,
      items: processedItems,
      ledger_entries: ledgerEntries,
    };
  }

  /**
   * Create purchase invoice with automatic GST and ledger entries
   */
  async createPurchaseInvoice(tenantId, invoiceData, userId) {
    const {
      voucher_date,
      party_ledger_id,
      items,
      place_of_supply,
      is_reverse_charge = false,
      narration,
    } = invoiceData;

    const partyLedger = await Ledger.findByPk(party_ledger_id);
    if (!partyLedger) {
      throw new Error('Party ledger not found');
    }

    const { Tenant } = require('../models');
    const tenant = await Tenant.findByPk(tenantId);
    const supplierState = partyLedger.state || 'Maharashtra';
    const recipientState = tenant.state || 'Maharashtra';

    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalCess = 0;

    const processedItems = items.map((item) => {
      const quantity = parseFloat(item.quantity) || 1;
      const rate = parseFloat(item.rate) || 0;
      const discountAmount = (quantity * rate * (parseFloat(item.discount_percent) || 0)) / 100;
      const taxableAmount = quantity * rate - discountAmount;

      subtotal += taxableAmount;

      const gstRate = parseFloat(item.gst_rate) || 18;
      const gst = calculateGST(taxableAmount, gstRate, supplierState, place_of_supply || recipientState);

      totalCGST += gst.cgst;
      totalSGST += gst.sgst;
      totalIGST += gst.igst;
      totalCess += parseFloat(item.cess_amount) || 0;

      return {
        ...item,
        quantity,
        rate,
        taxable_amount: taxableAmount,
        gst_rate: gstRate,
        cgst_amount: gst.cgst,
        sgst_amount: gst.sgst,
        igst_amount: gst.igst,
        total_amount: taxableAmount + gst.totalTax,
      };
    });

    const totalTax = totalCGST + totalSGST + totalIGST + totalCess;
    const grandTotal = subtotal + totalTax;
    const roundedTotal = roundOff(grandTotal);
    const roundOffAmount = roundedTotal - grandTotal;

    const ledgerEntries = [];

    // Debit: Purchase Account
    const purchaseGroup = await AccountGroup.findOne({
      where: { tenant_id: tenantId, group_code: 'PURCHASE' },
    });
    if (purchaseGroup) {
      const purchaseLedger = await Ledger.findOne({
        where: { tenant_id: tenantId, account_group_id: purchaseGroup.id },
      });
      if (purchaseLedger) {
        ledgerEntries.push({
          ledger_id: purchaseLedger.id,
          ledger_name: purchaseLedger.ledger_name,
          debit_amount: subtotal,
          credit_amount: 0,
          narration: 'Purchase expense',
        });
      }
    }

    // Debit: GST Input Accounts
    if (totalCGST > 0) {
      const cgstLedger = await this.getOrCreateGSTLedger(tenantId, 'CGST_INPUT', 'GST Input - CGST');
      ledgerEntries.push({
        ledger_id: cgstLedger.id,
        ledger_name: cgstLedger.ledger_name,
        debit_amount: totalCGST,
        credit_amount: 0,
        narration: 'CGST Input',
      });
    }

    if (totalSGST > 0) {
      const sgstLedger = await this.getOrCreateGSTLedger(tenantId, 'SGST_INPUT', 'GST Input - SGST');
      ledgerEntries.push({
        ledger_id: sgstLedger.id,
        ledger_name: sgstLedger.ledger_name,
        debit_amount: totalSGST,
        credit_amount: 0,
        narration: 'SGST Input',
      });
    }

    if (totalIGST > 0) {
      const igstLedger = await this.getOrCreateGSTLedger(tenantId, 'IGST_INPUT', 'GST Input - IGST');
      ledgerEntries.push({
        ledger_id: igstLedger.id,
        ledger_name: igstLedger.ledger_name,
        debit_amount: totalIGST,
        credit_amount: 0,
        narration: 'IGST Input',
      });
    }

    // Credit: Party (Creditor)
    ledgerEntries.push({
      ledger_id: party_ledger_id,
      ledger_name: partyLedger.ledger_name,
      debit_amount: 0,
      credit_amount: roundedTotal,
      narration: narration || `Purchase invoice from ${partyLedger.ledger_name}`,
    });

    if (roundOffAmount !== 0) {
      const roundOffLedger = await this.getOrCreateLedger(tenantId, 'ROUND_OFF', 'Round Off');
      ledgerEntries.push({
        ledger_id: roundOffLedger.id,
        ledger_name: roundOffLedger.ledger_name,
        debit_amount: roundOffAmount < 0 ? Math.abs(roundOffAmount) : 0,
        credit_amount: roundOffAmount > 0 ? roundOffAmount : 0,
        narration: 'Round off',
      });
    }

    return {
      subtotal,
      cgst_amount: totalCGST,
      sgst_amount: totalSGST,
      igst_amount: totalIGST,
      cess_amount: totalCess,
      round_off: roundOffAmount,
      total_amount: roundedTotal,
      items: processedItems,
      ledger_entries: ledgerEntries,
    };
  }

  async getOrCreateGSTLedger(tenantId, code, name) {
    let ledger = await Ledger.findOne({
      where: { tenant_id: tenantId, ledger_code: code },
    });

    if (!ledger) {
      const { AccountGroup } = require('../models');
      const gstGroup = await AccountGroup.findOne({
        where: { tenant_id: tenantId, group_code: 'GST' },
      });

      if (gstGroup) {
        ledger = await Ledger.create({
          tenant_id: tenantId,
          account_group_id: gstGroup.id,
          ledger_code: code,
          ledger_name: name,
          ledger_type: 'General',
        });
      }
    }

    return ledger;
  }

  async getOrCreateLedger(tenantId, code, name) {
    let ledger = await Ledger.findOne({
      where: { tenant_id: tenantId, ledger_code: code },
    });

    if (!ledger) {
      const { AccountGroup } = require('../models');
      const expenseGroup = await AccountGroup.findOne({
        where: { tenant_id: tenantId, primary_group: 'Expense' },
      });

      if (expenseGroup) {
        ledger = await Ledger.create({
          tenant_id: tenantId,
          account_group_id: expenseGroup.id,
          ledger_code: code,
          ledger_name: name,
          ledger_type: 'General',
        });
      }
    }

    return ledger;
  }
}

module.exports = new VoucherService();

