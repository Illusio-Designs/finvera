const voucherService = require('../services/voucherService');
const voucherController = require('./voucherController');

module.exports = {
  /**
   * Create Sales Invoice
   */
  async createSalesInvoice(req, res, next) {
    try {
      // Calculate invoice totals and ledger entries using service
      const invoiceData = await voucherService.createSalesInvoice(
        { tenantModels: req.tenantModels, masterModels: req.masterModels, company: req.company },
        req.body
      );

      // Create voucher using the calculated data
      req.body.voucher_type = 'Sales';
      req.body.items = invoiceData.items;
      req.body.ledger_entries = invoiceData.ledger_entries;
      req.body.subtotal = invoiceData.subtotal;
      req.body.cgst_amount = invoiceData.cgst_amount;
      req.body.sgst_amount = invoiceData.sgst_amount;
      req.body.igst_amount = invoiceData.igst_amount;
      req.body.cess_amount = invoiceData.cess_amount;
      req.body.round_off = invoiceData.round_off;
      req.body.total_amount = invoiceData.total_amount;
      req.body.place_of_supply = invoiceData.place_of_supply;
      req.body.is_reverse_charge = invoiceData.is_reverse_charge;

      return voucherController.create(req, res, next);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Create Purchase Invoice
   */
  async createPurchaseInvoice(req, res, next) {
    try {
      const invoiceData = await voucherService.createPurchaseInvoice(
        { tenantModels: req.tenantModels, masterModels: req.masterModels, company: req.company },
        req.body
      );

      req.body.voucher_type = 'Purchase';
      req.body.items = invoiceData.items;
      req.body.ledger_entries = invoiceData.ledger_entries;
      req.body.subtotal = invoiceData.subtotal;
      req.body.cgst_amount = invoiceData.cgst_amount;
      req.body.sgst_amount = invoiceData.sgst_amount;
      req.body.igst_amount = invoiceData.igst_amount;
      req.body.cess_amount = invoiceData.cess_amount;
      req.body.round_off = invoiceData.round_off;
      req.body.total_amount = invoiceData.total_amount;
      req.body.place_of_supply = invoiceData.place_of_supply;
      req.body.is_reverse_charge = invoiceData.is_reverse_charge;

      return voucherController.create(req, res, next);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Create Payment Voucher
   */
  async createPayment(req, res, next) {
    try {
      const { party_ledger_id, amount, payment_mode, bank_ledger_id, narration } = req.body;

      // Create ledger entries for payment
      const ledgerEntries = [
        {
          ledger_id: party_ledger_id,
          debit_amount: parseFloat(amount),
          credit_amount: 0,
          narration: narration || 'Payment made',
        },
        {
          ledger_id: bank_ledger_id,
          debit_amount: 0,
          credit_amount: parseFloat(amount),
          narration: `Payment via ${payment_mode}`,
        },
      ];

      req.body.voucher_type = 'Payment';
      req.body.ledger_entries = ledgerEntries;
      req.body.total_amount = parseFloat(amount);
      req.body.payment_mode = payment_mode;

      return voucherController.create(req, res, next);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Create Receipt Voucher
   */
  async createReceipt(req, res, next) {
    try {
      const { party_ledger_id, amount, payment_mode, bank_ledger_id, narration } = req.body;

      const ledgerEntries = [
        {
          ledger_id: bank_ledger_id,
          debit_amount: parseFloat(amount),
          credit_amount: 0,
          narration: `Receipt via ${payment_mode}`,
        },
        {
          ledger_id: party_ledger_id,
          debit_amount: 0,
          credit_amount: parseFloat(amount),
          narration: narration || 'Receipt received',
        },
      ];

      req.body.voucher_type = 'Receipt';
      req.body.ledger_entries = ledgerEntries;
      req.body.total_amount = parseFloat(amount);
      req.body.payment_mode = payment_mode;

      return voucherController.create(req, res, next);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Create Journal Entry
   */
  async createJournal(req, res, next) {
    try {
      const { ledger_entries, narration } = req.body;

      // Validate double-entry
      const totalDebit = ledger_entries.reduce((sum, e) => sum + parseFloat(e.debit_amount || 0), 0);
      const totalCredit = ledger_entries.reduce((sum, e) => sum + parseFloat(e.credit_amount || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({
          message: 'Journal entry must balance: Debit and Credit amounts must be equal',
          debit: totalDebit,
          credit: totalCredit,
        });
      }

      req.body.voucher_type = 'Journal';
      req.body.total_amount = totalDebit;
      req.body.narration = narration;

      return voucherController.create(req, res, next);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Create Contra Entry (Bank to Bank or Cash to Bank)
   */
  async createContra(req, res, next) {
    try {
      const { from_ledger_id, to_ledger_id, amount, narration } = req.body;

      const ledgerEntries = [
        {
          ledger_id: to_ledger_id,
          debit_amount: parseFloat(amount),
          credit_amount: 0,
          narration: narration || 'Transfer received',
        },
        {
          ledger_id: from_ledger_id,
          debit_amount: 0,
          credit_amount: parseFloat(amount),
          narration: narration || 'Transfer made',
        },
      ];

      req.body.voucher_type = 'Contra';
      req.body.ledger_entries = ledgerEntries;
      req.body.total_amount = parseFloat(amount);

      return voucherController.create(req, res, next);
    } catch (err) {
      next(err);
    }
  },
};

