const { EInvoice, Voucher, VoucherItem, Ledger, Tenant, GSTIN } = require('../models');
const axios = require('axios');
const crypto = require('crypto');
const QRCode = require('qrcode');

class EInvoiceService {
  constructor() {
    // E-Invoice API endpoints (NIC IRP Portal)
    this.baseURL = process.env.E_INVOICE_API_URL || 'https://einvoice1.gst.gov.in';
    this.username = process.env.E_INVOICE_USERNAME || '';
    this.password = process.env.E_INVOICE_PASSWORD || '';
    this.gstin = process.env.E_INVOICE_GSTIN || '';
    this.appKey = process.env.E_INVOICE_APP_KEY || '';
  }

  /**
   * Generate IRN (Invoice Reference Number) for a voucher
   */
  async generateIRN(tenantId, voucherId) {
    try {
      const voucher = await Voucher.findOne({
        where: { id: voucherId, tenant_id: tenantId },
        include: [
          { model: VoucherItem },
          { model: Ledger, as: 'partyLedger' },
        ],
      });

      // Get tenant with primary GSTIN separately
      const tenant = await Tenant.findByPk(tenantId, {
        include: [{ model: GSTIN, where: { is_primary: true, is_active: true }, required: false, as: 'gstins' }],
      });

      if (!voucher) {
        throw new Error('Voucher not found');
      }

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      if (voucher.status !== 'posted') {
        throw new Error('Voucher must be posted before generating e-invoice');
      }

      // Check if e-invoice already exists
      const existing = await EInvoice.findOne({
        where: { voucher_id: voucherId, status: 'generated' },
      });

      if (existing) {
        return existing;
      }

      // Build e-invoice payload as per NIC IRP format
      const eInvoicePayload = await this.buildEInvoicePayload(voucher);

      // In production, call NIC IRP API
      // For now, we'll simulate the API call
      const irnResponse = await this.callIRPAPI('/Invoice/GenerateIRN', eInvoicePayload);

      if (irnResponse.Success) {
        const irn = irnResponse.Result.Irn;
        const ackNumber = irnResponse.Result.AckNo;
        const ackDate = irnResponse.Result.AckDt;

        // Generate QR code
        const qrCodeData = this.buildQRCodeData(irnResponse.Result);
        let qrCode = '';
        try {
          qrCode = await QRCode.toDataURL(qrCodeData);
        } catch (qrErr) {
          console.error('QR code generation error:', qrErr);
          // Continue without QR code if generation fails
        }

        // Save e-invoice record
        const eInvoice = await EInvoice.create({
          tenant_id: tenantId,
          voucher_id: voucherId,
          irn,
          ack_number: ackNumber,
          ack_date: new Date(ackDate),
          qr_code: qrCode,
          e_invoice_json: irnResponse.Result,
          status: 'generated',
        });

        // Update voucher with IRN
        await voucher.update({
          irn,
          ack_number: ackNumber,
          ack_date: new Date(ackDate),
          qr_code: qrCode,
        });

        return eInvoice;
      } else {
        throw new Error(irnResponse.ErrorMessage || 'Failed to generate IRN');
      }
    } catch (err) {
      // Save failed attempt
      await EInvoice.create({
        tenant_id: tenantId,
        voucher_id: voucherId,
        status: 'failed',
        error_message: err.message,
      });
      throw err;
    }
  }

  /**
   * Build e-invoice payload as per NIC IRP format
   */
  async buildEInvoicePayload(voucher) {
    // Get tenant separately if not included
    let tenant = voucher.tenant;
    if (!tenant) {
      tenant = await Tenant.findByPk(voucher.tenant_id, {
        include: [{ model: GSTIN, where: { is_primary: true, is_active: true }, required: false }],
      });
    }

    // Get primary GSTIN
    let primaryGSTIN = null;
    if (tenant) {
      // Try to get GSTINs from tenant association
      const gstins = tenant.GSTINs || tenant.gstins || [];
      primaryGSTIN = gstins.find((g) => g.is_primary && g.is_active) || gstins[0];
    }
    
    // If not found, query directly
    if (!primaryGSTIN) {
      primaryGSTIN = await GSTIN.findOne({
        where: { tenant_id: voucher.tenant_id, is_primary: true, is_active: true },
      });
    }
    
    const supplierGSTIN = primaryGSTIN?.gstin || tenant?.gstin || this.gstin;
    const partyLedger = voucher.partyLedger;

    // Build item list
    const itemList = voucher.voucher_items?.map((item, index) => ({
      SlNo: (index + 1).toString(),
      PrdDesc: item.item_description,
      IsServc: item.hsn_sac_code?.length === 6 ? 'Y' : 'N', // SAC = Service, HSN = Goods
      HsnCd: item.hsn_sac_code,
      Qty: parseFloat(item.quantity).toFixed(3),
      Unit: item.unit || 'NOS',
      UnitPrice: parseFloat(item.rate).toFixed(2),
      TotAmt: parseFloat(item.taxable_amount).toFixed(2),
      Discount: parseFloat(item.discount_amount || 0).toFixed(2),
      PreTaxVal: parseFloat(item.taxable_amount).toFixed(2),
      AssAmt: parseFloat(item.taxable_amount).toFixed(2),
      GstRt: parseFloat(item.gst_rate).toFixed(2),
      IgstAmt: parseFloat(item.igst_amount || 0).toFixed(2),
      CgstAmt: parseFloat(item.cgst_amount || 0).toFixed(2),
      SgstAmt: parseFloat(item.sgst_amount || 0).toFixed(2),
      CesRt: parseFloat(item.cess_rate || 0).toFixed(2),
      CesAmt: parseFloat(item.cess_amount || 0).toFixed(2),
      CesNonAdvlAmt: '0.00',
      TotItemVal: parseFloat(item.total_amount).toFixed(2),
    })) || [];

    // Calculate totals
    const totalItemValue = voucher.voucher_items?.reduce(
      (sum, item) => sum + parseFloat(item.taxable_amount),
      0
    ) || 0;
    const totalTax = parseFloat(voucher.cgst_amount) + parseFloat(voucher.sgst_amount) + parseFloat(voucher.igst_amount);
    const totalCess = parseFloat(voucher.cess_amount || 0);

    const payload = {
      Version: '1.1',
      TranDtls: {
        TaxSch: 'GST',
        SupTyp: 'B2B', // B2B, B2C, EXPWP, EXPWOP, SEZWP, SEZWOP
        RegRev: 'N',
        EcmGstin: null,
        IgstOnIntra: voucher.igst_amount > 0 ? 'Y' : 'N',
      },
      DocDtls: {
        Typ: 'INV', // INV, CRN, DBN
        No: voucher.invoice_number || voucher.voucher_number,
        Dt: voucher.voucher_date.toISOString().split('T')[0],
      },
      SellerDtls: {
        Gstin: supplierGSTIN,
        LglNm: tenant.company_name,
        TrdNm: tenant.company_name,
        Addr1: tenant.address || '',
        Addr2: '',
        Loc: tenant.city || '',
        Pin: tenant.pincode || '',
        Stcd: primaryGSTIN?.state_code || tenant?.state_code || '27',
        Ph: tenant.phone || '',
        Em: tenant.email || '',
      },
      BuyerDtls: {
        Gstin: partyLedger?.gstin || '',
        LglNm: partyLedger?.ledger_name || '',
        TrdNm: partyLedger?.ledger_name || '',
        Pos: voucher.place_of_supply || primaryGSTIN?.state_code || tenant?.state_code || '27',
        Addr1: partyLedger?.billing_address || '',
        Addr2: '',
        Loc: partyLedger?.city || '',
        Pin: partyLedger?.pincode || '',
        Stcd: partyLedger?.state_code || '',
        Ph: partyLedger?.phone || '',
        Em: partyLedger?.email || '',
      },
      DispDtls: {
        Nm: partyLedger?.ledger_name || '',
        Addr1: partyLedger?.shipping_address || partyLedger?.billing_address || '',
        Addr2: '',
        Loc: partyLedger?.city || '',
        Pin: partyLedger?.pincode || '',
        Stcd: partyLedger?.state_code || '',
      },
      ShipDtls: {
        Gstin: partyLedger?.gstin || '',
        LglNm: partyLedger?.ledger_name || '',
        TrdNm: partyLedger?.ledger_name || '',
        Addr1: partyLedger?.shipping_address || partyLedger?.billing_address || '',
        Addr2: '',
        Loc: partyLedger?.city || '',
        Pin: partyLedger?.pincode || '',
        Stcd: partyLedger?.state_code || '',
      },
      ItemList: itemList,
      ValDtls: {
        AssVal: totalItemValue.toFixed(2),
        CgstVal: parseFloat(voucher.cgst_amount).toFixed(2),
        SgstVal: parseFloat(voucher.sgst_amount).toFixed(2),
        IgstVal: parseFloat(voucher.igst_amount).toFixed(2),
        CesVal: totalCess.toFixed(2),
        StCesVal: '0.00',
        Discount: parseFloat(voucher.discount_amount || 0).toFixed(2),
        OthChrg: '0.00',
        RndOffAmt: parseFloat(voucher.round_off || 0).toFixed(2),
        TotInvVal: parseFloat(voucher.total_amount).toFixed(2),
        TotInvValFc: parseFloat(voucher.total_amount).toFixed(2),
      },
      PayDtls: {
        Nm: 'Cash', // Payment mode
        AccDet: '',
        Mode: 'Cash',
        FinInsBr: '',
        PayTerm: '',
        CrTrn: '',
        DirDr: '',
        CrDay: '',
        PaidAmt: parseFloat(voucher.paid_amount || 0).toFixed(2),
        PaymtDue: (parseFloat(voucher.total_amount) - parseFloat(voucher.paid_amount || 0)).toFixed(2),
      },
      RefDtls: {
        InvRm: 'N',
        DocPerdDtls: {
          InvStDt: voucher.voucher_date.toISOString().split('T')[0],
          InvEndDt: voucher.voucher_date.toISOString().split('T')[0],
        },
        PrecDocDtls: [],
        ContrDtls: [],
      },
      AddlDocDtls: [],
      ExpDtls: null,
      EwbDtls: null,
    };

    return payload;
  }

  /**
   * Build QR code data string
   */
  buildQRCodeData(result) {
    // QR code format as per e-invoice specification
    const qrData = [
      result.Irn,
      result.AckNo,
      result.AckDt,
      result.SignedInvoice,
    ].join('|');

    return qrData;
  }

  /**
   * Call NIC IRP API
   */
  async callIRPAPI(endpoint, payload) {
    try {
      // In production, implement actual API call with authentication
      // For now, simulate successful response
      
      // Generate mock IRN for development
      if (process.env.NODE_ENV === 'development') {
        const mockIRN = crypto.randomBytes(16).toString('hex').toUpperCase();
        return {
          Success: true,
          Result: {
            Irn: mockIRN,
            AckNo: `ACK${Date.now()}`,
            AckDt: new Date().toISOString().split('T')[0],
            SignedInvoice: 'mock_signed_invoice_data',
            EwbNo: null,
            EwbDt: null,
            EwbValidTill: null,
          },
        };
      }

      // Production API call
      const response = await axios.post(`${this.baseURL}${endpoint}`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'username': this.username,
          'password': this.password,
          'gstin': this.gstin,
          'appkey': this.appKey,
        },
        timeout: 30000,
      });

      return response.data;
    } catch (err) {
      throw new Error(`E-Invoice API Error: ${err.message}`);
    }
  }

  /**
   * Cancel e-invoice
   */
  async cancelEInvoice(tenantId, voucherId, reason) {
    try {
      const eInvoice = await EInvoice.findOne({
        where: {
          voucher_id: voucherId,
          tenant_id: tenantId,
          status: 'generated',
        },
      });

      if (!eInvoice) {
        throw new Error('E-invoice not found or already cancelled');
      }

      // Call cancellation API
      const cancelPayload = {
        Irn: eInvoice.irn,
        CnlRsn: reason || '1', // 1-9 as per GST rules
        CnlRem: 'Invoice cancelled',
      };

      const response = await this.callIRPAPI('/Invoice/CancelIRN', cancelPayload);

      if (response.Success) {
        await eInvoice.update({
          status: 'cancelled',
          cancelled_irn: eInvoice.irn,
          cancellation_reason: reason,
          cancellation_date: new Date(),
        });

        // Update voucher
        const voucher = await Voucher.findByPk(voucherId);
        if (voucher) {
          await voucher.update({
            irn: null,
            ack_number: null,
            ack_date: null,
            qr_code: null,
          });
        }

        return eInvoice;
      } else {
        throw new Error(response.ErrorMessage || 'Failed to cancel e-invoice');
      }
    } catch (err) {
      throw err;
    }
  }
}

module.exports = new EInvoiceService();

