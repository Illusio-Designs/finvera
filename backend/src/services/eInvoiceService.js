const crypto = require('crypto');

function nowIso() {
  return new Date().toISOString();
}

function fakeIrn() {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

class EInvoiceService {
  /**
   * Minimal, company-DB backed e-invoice stub.
   * Keeps the API shape stable and avoids importing main DB models.
   */
  async generateIRN(ctx, voucherId) {
    const { tenantModels } = ctx;

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
    const { tenantModels } = ctx;

    const eInvoice = await tenantModels.EInvoice.findOne({ where: { voucher_id: voucherId } });
    if (!eInvoice) throw new Error('E-invoice not found');

    await eInvoice.update({ status: 'cancelled', error_message: reason || null });

    return {
      id: eInvoice.id,
      voucher_id: voucherId,
      irn: eInvoice.irn,
      status: eInvoice.status,
      cancellation_reason: reason || null,
      cancellation_date: nowIso(),
    };
  }
}

module.exports = new EInvoiceService();
