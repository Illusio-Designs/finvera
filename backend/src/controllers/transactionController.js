const voucherService = require('../services/voucherService');
const voucherController = require('./voucherController');

module.exports = {
  /**
   * Create Sales Invoice
   */
  async createSalesInvoice(req, res, next) {
    try {
      // Ensure tenant_id is available
      const tenantId = req.tenant_id || req.tenant?.id || req.company?.tenant_id;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required but not found in request context',
        });
      }

      // Calculate invoice totals and ledger entries using service
      const invoiceData = await voucherService.createSalesInvoice(
        { tenantModels: req.tenantModels, masterModels: req.masterModels, company: req.company, tenant_id: tenantId },
        req.body
      );

      // Create voucher using the calculated data
      req.body.voucher_type = 'sales_invoice';
      req.body.items = invoiceData.items;
      req.body.ledger_entries = invoiceData.ledger_entries;
      req.body.subtotal = invoiceData.subtotal;
      req.body.cgst_amount = invoiceData.cgst_amount;
      req.body.sgst_amount = invoiceData.sgst_amount;
      req.body.igst_amount = invoiceData.igst_amount;
      req.body.cess_amount = invoiceData.cess_amount;
      req.body.cogs_amount = invoiceData.cogs_amount;
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
      console.log('\n🏭 === PURCHASE INVOICE TRANSACTION STARTED ===');
      console.log('📋 Request Body:', JSON.stringify(req.body, null, 2));
      
      // Ensure tenant_id is available
      const tenantId = req.tenant_id || req.tenant?.id || req.company?.tenant_id;
      if (!tenantId) {
        console.error('❌ No tenant ID found:', {
          tenant_id: req.tenant_id,
          tenant: req.tenant?.id,
          company_tenant_id: req.company?.tenant_id
        });
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required but not found in request context',
        });
      }
      
      console.log('✅ Tenant ID found:', tenantId);
      console.log('🔧 Creating purchase invoice data...');

      const invoiceData = await voucherService.createPurchaseInvoice(
        { tenantModels: req.tenantModels, masterModels: req.masterModels, company: req.company, tenant_id: tenantId },
        req.body
      );
      
      console.log('📊 Invoice data created:', {
        subtotal: invoiceData.subtotal,
        cgst_amount: invoiceData.cgst_amount,
        sgst_amount: invoiceData.sgst_amount,
        igst_amount: invoiceData.igst_amount,
        total_amount: invoiceData.total_amount,
        items_count: invoiceData.items?.length || 0,
        ledger_entries_count: invoiceData.ledger_entries?.length || 0
      });

      req.body.voucher_type = 'purchase_invoice';
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

      console.log('🔄 Calling voucher controller...');
      return voucherController.create(req, res, next);
    } catch (err) {
      console.error('❌ === PURCHASE INVOICE TRANSACTION FAILED ===');
      console.error('💥 Error details:', {
        message: err.message,
        stack: err.stack
      });
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

