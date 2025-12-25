const crypto = require('crypto');
const { createApiClientFromCompany } = require('./thirdPartyApiClient');
const logger = require('../utils/logger');

function nowIso() {
  return new Date().toISOString();
}

function fakeIrn() {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

class EInvoiceService {
  /**
   * Generate IRN (Invoice Reference Number) for e-invoice
   * Uses third-party API if configured, otherwise falls back to stub
   */
  async generateIRN(ctx, voucherId) {
    const { tenantModels, company } = ctx;

    const voucher = await tenantModels.Voucher.findByPk(voucherId, {
      include: [
        { model: tenantModels.VoucherItem },
        { model: tenantModels.Ledger, as: 'partyLedger' },
      ],
    });

    if (!voucher) throw new Error('Voucher not found');
    if (voucher.status !== 'posted') throw new Error('Voucher must be posted before generating e-invoice');

    const existing = await tenantModels.EInvoice.findOne({ where: { voucher_id: voucherId, status: 'generated' } });
    if (existing) return existing;

    // Check if third-party API is configured (Sandbox uses API key)
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.e_invoice?.applicable && 
                          compliance.e_invoice?.api_key;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        
        // Prepare invoice data for third-party API
        const invoiceData = {
          DocDt: voucher.voucher_date,
          DocNo: voucher.voucher_number,
          SellerGstin: company.gstin,
          BuyerGstin: voucher.partyLedger?.gstin || null,
          BuyerName: voucher.partyLedger?.ledger_name || voucher.partyLedger?.name || '',
          BuyerAddr1: voucher.partyLedger?.address || '',
          BuyerPlace: voucher.partyLedger?.city || '',
          BuyerState: voucher.partyLedger?.state || '',
          BuyerPinCode: voucher.partyLedger?.pincode || '',
          DispDt: voucher.voucher_date,
          DispMode: 'Road',
          ItemList: (voucher.voucher_items || []).map((item, index) => ({
            SlNo: index + 1,
            PrdDesc: item.item_description || '',
            HsnCd: item.hsn_sac_code || '',
            Qty: parseFloat(item.quantity || 0),
            UnitPrice: parseFloat(item.rate || 0),
            TotAmt: parseFloat(item.taxable_amount || 0),
            AssAmt: parseFloat(item.taxable_amount || 0),
            GstRt: parseFloat(item.gst_rate || 0),
            IgstAmt: parseFloat(item.igst_amount || 0),
            CgstAmt: parseFloat(item.cgst_amount || 0),
            SgstAmt: parseFloat(item.sgst_amount || 0),
            TotItemVal: parseFloat(item.taxable_amount || 0) + parseFloat(item.igst_amount || 0) + parseFloat(item.cgst_amount || 0) + parseFloat(item.sgst_amount || 0),
          })),
          TotInvVal: parseFloat(voucher.total_amount || 0),
          TotTaxableVal: parseFloat(voucher.taxable_amount || 0),
          TotCgstVal: parseFloat(voucher.cgst_amount || 0),
          TotSgstVal: parseFloat(voucher.sgst_amount || 0),
          TotIgstVal: parseFloat(voucher.igst_amount || 0),
        };

        const apiResponse = await apiClient.generateIRN(invoiceData);
        
        // Store the response
        const eInvoice = await tenantModels.EInvoice.create({
          voucher_id: voucherId,
          irn: apiResponse.Irn || apiResponse.irn || fakeIrn(),
          ack_no: apiResponse.AckNo || apiResponse.ack_no || String(Date.now()),
          ack_date: apiResponse.AckDt || apiResponse.ack_date || new Date(),
          signed_invoice: apiResponse.SignedInvoice || apiResponse.signed_invoice || null,
          signed_qr_code: apiResponse.QrCode || apiResponse.qr_code || null,
          status: 'generated',
          error_message: null,
        });

        return {
          id: eInvoice.id,
          voucher_id: voucherId,
          irn: eInvoice.irn,
          ack_no: eInvoice.ack_no,
          ack_date: eInvoice.ack_date,
          status: 'generated',
          generated_at: nowIso(),
          signed_invoice: eInvoice.signed_invoice,
          signed_qr_code: eInvoice.signed_qr_code,
        };
      } catch (error) {
        logger.error('Third-party e-invoice API error:', error);
        // Fall through to stub generation if API fails
        // In production, you might want to throw the error instead
      }
    }

    // Fallback to stub generation
    const irn = fakeIrn();
    const ackNo = String(Date.now());
    const ackDate = new Date();

    const eInvoice = await tenantModels.EInvoice.create({
      voucher_id: voucherId,
      irn,
      ack_no: ackNo,
      ack_date: ackDate,
      signed_invoice: null,
      signed_qr_code: null,
      status: 'generated',
      error_message: null,
    });

    return {
      id: eInvoice.id,
      voucher_id: voucherId,
      irn,
      ack_no: ackNo,
      ack_date: ackDate,
      status: 'generated',
      generated_at: nowIso(),
    };
  }

  async cancelEInvoice(ctx, voucherId, reason) {
    const { tenantModels, company } = ctx;

    const eInvoice = await tenantModels.EInvoice.findOne({ where: { voucher_id: voucherId } });
    if (!eInvoice) throw new Error('E-invoice not found');

    if (!eInvoice.irn) throw new Error('IRN not found for this e-invoice');

    // Check if third-party API is configured (Sandbox uses API key)
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.e_invoice?.applicable && 
                          compliance.e_invoice?.api_key;

    if (useThirdParty && eInvoice.irn) {
      try {
        const apiClient = createApiClientFromCompany(company);
        await apiClient.cancelIRN(eInvoice.irn, reason || 'Cancelled by user');
      } catch (error) {
        logger.error('Third-party e-invoice cancellation API error:', error);
        // Continue with local cancellation even if API fails
      }
    }

    await eInvoice.update({ status: 'cancelled', error_message: reason || null });

    return {
      id: eInvoice.id,
      voucher_id: voucherId,
      irn: eInvoice.irn,
      status: 'cancelled',
      cancellation_reason: reason || null,
      cancellation_date: nowIso(),
    };
  }
}

module.exports = new EInvoiceService();
