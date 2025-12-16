const voucherService = require('../services/voucherService');
const voucherController = require('./voucherController');
const { Voucher, VoucherType } = require('../models');

module.exports = {
  /**
   * Create Sales Invoice
   */
  async createSalesInvoice(req, res, next) {
    try {
      const salesVoucherType = await VoucherType.findOne({
        where: {
          tenant_id: req.tenant_id,
          voucher_category: 'Sales',
        },
      });

      if (!salesVoucherType) {
        return res.status(404).json({ message: 'Sales voucher type not found. Please create one first.' });
      }

      // Calculate invoice totals and ledger entries using service
      const invoiceData = await voucherService.createSalesInvoice(
        req.tenant_id,
        {
          ...req.body,
          voucher_type_id: salesVoucherType.id,
        },
        req.user.id
      );

      // Create voucher using the calculated data
      req.body.voucher_type_id = salesVoucherType.id;
      req.body.items = invoiceData.items;
      req.body.ledger_entries = invoiceData.ledger_entries;
      req.body.subtotal = invoiceData.subtotal;
      req.body.cgst_amount = invoiceData.cgst_amount;
      req.body.sgst_amount = invoiceData.sgst_amount;
      req.body.igst_amount = invoiceData.igst_amount;
      req.body.cess_amount = invoiceData.cess_amount;
      req.body.round_off = invoiceData.round_off;
      req.body.total_amount = invoiceData.total_amount;

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
      const purchaseVoucherType = await VoucherType.findOne({
        where: {
          tenant_id: req.tenant_id,
          voucher_category: 'Purchase',
        },
      });

      if (!purchaseVoucherType) {
        return res.status(404).json({ message: 'Purchase voucher type not found. Please create one first.' });
      }

      const invoiceData = await voucherService.createPurchaseInvoice(
        req.tenant_id,
        {
          ...req.body,
          voucher_type_id: purchaseVoucherType.id,
        },
        req.user.id
      );

      req.body.voucher_type_id = purchaseVoucherType.id;
      req.body.items = invoiceData.items;
      req.body.ledger_entries = invoiceData.ledger_entries;
      req.body.subtotal = invoiceData.subtotal;
      req.body.cgst_amount = invoiceData.cgst_amount;
      req.body.sgst_amount = invoiceData.sgst_amount;
      req.body.igst_amount = invoiceData.igst_amount;
      req.body.cess_amount = invoiceData.cess_amount;
      req.body.round_off = invoiceData.round_off;
      req.body.total_amount = invoiceData.total_amount;

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
      const paymentVoucherType = await VoucherType.findOne({
        where: {
          tenant_id: req.tenant_id,
          voucher_category: 'Payment',
        },
      });

      if (!paymentVoucherType) {
        return res.status(404).json({ message: 'Payment voucher type not found' });
      }

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

      req.body.voucher_type_id = paymentVoucherType.id;
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
      const receiptVoucherType = await VoucherType.findOne({
        where: {
          tenant_id: req.tenant_id,
          voucher_category: 'Receipt',
        },
      });

      if (!receiptVoucherType) {
        return res.status(404).json({ message: 'Receipt voucher type not found' });
      }

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

      req.body.voucher_type_id = receiptVoucherType.id;
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
      const journalVoucherType = await VoucherType.findOne({
        where: {
          tenant_id: req.tenant_id,
          voucher_category: 'Journal',
        },
      });

      if (!journalVoucherType) {
        return res.status(404).json({ message: 'Journal voucher type not found' });
      }

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

      req.body.voucher_type_id = journalVoucherType.id;
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
      const contraVoucherType = await VoucherType.findOne({
        where: {
          tenant_id: req.tenant_id,
          voucher_category: 'Contra',
        },
      });

      if (!contraVoucherType) {
        return res.status(404).json({ message: 'Contra voucher type not found' });
      }

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

      req.body.voucher_type_id = contraVoucherType.id;
      req.body.ledger_entries = ledgerEntries;
      req.body.total_amount = parseFloat(amount);

      return voucherController.create(req, res, next);
    } catch (err) {
      next(err);
    }
  },
};

