const crypto = require('crypto');

function nowIso() {
  return new Date().toISOString();
}

function fakeEWayBillNo() {
  // 12 digits-like
  const n = crypto.randomInt(100000000000, 999999999999);
  return String(n);
}

class EWayBillService {
  /**
   * Minimal E-Way Bill generator stub stored in company DB.
   * In production you would call NIC EWB APIs and store the response.
   */
  async generate(ctx, voucherId, details = {}) {
    const { tenantModels, company } = ctx;

    const voucher = await tenantModels.Voucher.findByPk(voucherId, {
      include: [
        { model: tenantModels.VoucherItem },
        { model: tenantModels.Ledger, as: 'partyLedger' },
      ],
    });
    if (!voucher) throw new Error('Voucher not found');
    if (voucher.status !== 'posted') throw new Error('Voucher must be posted before generating e-way bill');
    if (voucher.voucher_type !== 'Sales') throw new Error('E-way bill supported only for Sales vouchers');

    const existing = await tenantModels.EWayBill.findOne({ where: { voucher_id: voucherId } });
    if (existing && existing.status === 'generated') return existing;

    // Very basic rule-of-thumb: generally required when consignment value >= 50,000
    const consignmentValue = parseFloat(voucher.total_amount || 0);
    if (consignmentValue < 50000) {
      throw new Error('E-way bill not required: consignment value < 50,000');
    }

    const payload = {
      docNo: voucher.voucher_number,
      docDate: voucher.voucher_date,
      supplyType: 'OUTWARD',
      subSupplyType: 'SUPPLY',
      fromPincode: details.from_pincode || company?.pincode || null,
      toPincode: details.to_pincode || voucher.partyLedger?.pincode || null,
      transporterId: details.transporter_id || null,
      transporterName: details.transporter_name || null,
      transportMode: details.transport_mode || 'ROAD',
      vehicleNo: details.vehicle_no || null,
      distanceKm: details.distance_km || null,
      value: consignmentValue,
      items: (voucher.voucher_items || []).map((it) => ({
        name: it.item_description,
        hsn: it.hsn_sac_code,
        qty: it.quantity,
        taxable: it.taxable_amount,
      })),
    };

    const ewayBillNo = fakeEWayBillNo();
    const generatedAt = new Date();
    const validUpto = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // stub: +2 days

    if (existing) {
      await existing.update({
        eway_bill_no: ewayBillNo,
        generated_at: generatedAt,
        valid_upto: validUpto,
        status: 'generated',
        transporter_id: details.transporter_id || null,
        transporter_name: details.transporter_name || null,
        transport_mode: details.transport_mode || 'ROAD',
        vehicle_no: details.vehicle_no || null,
        distance_km: details.distance_km || null,
        from_pincode: details.from_pincode || company?.pincode || null,
        to_pincode: details.to_pincode || voucher.partyLedger?.pincode || null,
        supply_type: 'OUTWARD',
        doc_type: 'INV',
        payload,
        error_message: null,
      });
      return existing;
    }

    const created = await tenantModels.EWayBill.create({
      voucher_id: voucherId,
      eway_bill_no: ewayBillNo,
      generated_at: generatedAt,
      valid_upto: validUpto,
      status: 'generated',
      transporter_id: details.transporter_id || null,
      transporter_name: details.transporter_name || null,
      transport_mode: details.transport_mode || 'ROAD',
      vehicle_no: details.vehicle_no || null,
      distance_km: details.distance_km || null,
      from_pincode: details.from_pincode || company?.pincode || null,
      to_pincode: details.to_pincode || voucher.partyLedger?.pincode || null,
      supply_type: 'OUTWARD',
      doc_type: 'INV',
      payload,
      error_message: null,
    });

    return {
      id: created.id,
      voucher_id: voucherId,
      eway_bill_no: ewayBillNo,
      status: 'generated',
      generated_at: generatedAt,
      valid_upto: validUpto,
      created_at: nowIso(),
    };
  }

  async cancel(ctx, voucherId, reason) {
    const { tenantModels } = ctx;
    const ewb = await tenantModels.EWayBill.findOne({ where: { voucher_id: voucherId } });
    if (!ewb) throw new Error('E-way bill not found');
    await ewb.update({ status: 'cancelled', error_message: reason || null });
    return {
      id: ewb.id,
      voucher_id: voucherId,
      eway_bill_no: ewb.eway_bill_no,
      status: 'cancelled',
      cancellation_reason: reason || null,
      cancellation_date: nowIso(),
    };
  }
}

module.exports = new EWayBillService();

