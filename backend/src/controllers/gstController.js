const { GSTIN, GSTRate, GSTRReturn, Voucher, VoucherItem, VoucherType, Ledger } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  async listGSTINs(req, res, next) {
    try {
      const gstins = await GSTIN.findAll({
        where: { tenant_id: req.tenant_id },
        order: [['is_primary', 'DESC'], ['created_at', 'ASC']],
      });

      res.json({ gstins });
    } catch (err) {
      next(err);
    }
  },

  async createGSTIN(req, res, next) {
    try {
      // If this is set as primary, unset others
      if (req.body.is_primary) {
        await GSTIN.update(
          { is_primary: false },
          { where: { tenant_id: req.tenant_id } }
        );
      }

      const gstin = await GSTIN.create({
        ...req.body,
        tenant_id: req.tenant_id,
      });

      res.status(201).json({ gstin });
    } catch (err) {
      next(err);
    }
  },

  async updateGSTIN(req, res, next) {
    try {
      const { id } = req.params;
      const gstin = await GSTIN.findOne({
        where: { id, tenant_id: req.tenant_id },
      });

      if (!gstin) {
        return res.status(404).json({ message: 'GSTIN not found' });
      }

      // If setting as primary, unset others
      if (req.body.is_primary) {
        await GSTIN.update(
          { is_primary: false },
          { where: { tenant_id: req.tenant_id, id: { [Op.ne]: id } } }
        );
      }

      await gstin.update(req.body);
      res.json({ gstin });
    } catch (err) {
      next(err);
    }
  },

  async getGSTRates(req, res, next) {
    try {
      const { hsn_sac_code, item_type } = req.query;
      const where = {
        [Op.or]: [{ tenant_id: req.tenant_id }, { tenant_id: null }], // Master + tenant-specific
        is_active: true,
      };

      if (hsn_sac_code) where.hsn_sac_code = hsn_sac_code;
      if (item_type) where.item_type = item_type;

      const rates = await GSTRate.findAll({
        where,
        order: [['tenant_id', 'ASC'], ['hsn_sac_code', 'ASC']], // Tenant-specific first
      });

      res.json({ rates });
    } catch (err) {
      next(err);
    }
  },

  async createGSTRate(req, res, next) {
    try {
      const rate = await GSTRate.create({
        ...req.body,
        tenant_id: req.tenant_id,
      });

      res.status(201).json({ rate });
    } catch (err) {
      next(err);
    }
  },

  async generateGSTR1(req, res, next) {
    try {
      const { gstin, period } = req.body; // period format: MM-YYYY

      const [month, year] = period.split('-');
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Get all sales invoices for the period
      const salesVouchers = await Voucher.findAll({
        where: {
          tenant_id: req.tenant_id,
          voucher_date: { [Op.between]: [startDate, endDate] },
          status: 'posted',
        },
        include: [
          {
            model: VoucherType,
            where: { voucher_category: 'Sales' },
          },
          { model: VoucherItem },
          { model: Ledger, as: 'partyLedger' },
        ],
      });

      // Build GSTR-1 JSON structure
      const gstr1Data = {
        gstin: gstin,
        ret_period: period,
        b2b: [],
        b2cl: [],
        b2cs: [],
        exp: [],
        nil: [],
        hsn: {},
      };

      let totalTaxableValue = 0;
      let totalTax = 0;

      salesVouchers.forEach((voucher) => {
        const partyState = voucher.partyLedger?.state || '';
        const isInterstate = partyState !== voucher.place_of_supply;

        voucher.voucher_items?.forEach((item) => {
          const taxableValue = parseFloat(item.taxable_amount);
          const cgst = parseFloat(item.cgst_amount);
          const sgst = parseFloat(item.sgst_amount);
          const igst = parseFloat(item.igst_amount);
          const tax = cgst + sgst + igst;

          totalTaxableValue += taxableValue;
          totalTax += tax;

          // B2B (Business to Business)
          if (voucher.partyLedger?.gstin) {
            gstr1Data.b2b.push({
              ctin: voucher.partyLedger.gstin,
              inv: [
                {
                  inum: voucher.invoice_number || voucher.voucher_number,
                  idt: voucher.voucher_date.toISOString().split('T')[0],
                  val: parseFloat(voucher.total_amount),
                  pos: voucher.place_of_supply,
                  rchrg: voucher.is_reverse_charge ? 'Y' : 'N',
                  inv_typ: 'R', // Regular
                  itms: [
                    {
                      num: 1,
                      hsn_sc: item.hsn_sac_code,
                      qty: parseFloat(item.quantity),
                      rt: parseFloat(item.gst_rate),
                      txval: taxableValue,
                      iamt: igst,
                      camt: cgst,
                      samt: sgst,
                      csamt: parseFloat(item.cess_amount) || 0,
                    },
                  ],
                },
              ],
            });
          } else if (isInterstate && taxableValue >= 250000) {
            // B2CL (Business to Consumer Large - Interstate)
            gstr1Data.b2cl.push({
              pos: voucher.place_of_supply,
              typ: 'OE', // Outward Exempted
              etin: '',
              rt: parseFloat(item.gst_rate),
              ad_amt: taxableValue,
              iamt: igst,
              csamt: parseFloat(item.cess_amount) || 0,
            });
          } else {
            // B2CS (Business to Consumer Small)
            gstr1Data.b2cs.push({
              typ: 'OE',
              pos: voucher.place_of_supply,
              rt: parseFloat(item.gst_rate),
              ad_amt: taxableValue,
              iamt: igst,
              camt: cgst,
              samt: sgst,
              csamt: parseFloat(item.cess_amount) || 0,
            });
          }

          // HSN Summary
          if (!gstr1Data.hsn[item.hsn_sac_code]) {
            gstr1Data.hsn[item.hsn_sac_code] = {
              num: item.hsn_sac_code,
              qty: 0,
              rt: parseFloat(item.gst_rate),
              txval: 0,
              iamt: 0,
              camt: 0,
              samt: 0,
              csamt: 0,
            };
          }

          gstr1Data.hsn[item.hsn_sac_code].qty += parseFloat(item.quantity);
          gstr1Data.hsn[item.hsn_sac_code].txval += taxableValue;
          gstr1Data.hsn[item.hsn_sac_code].iamt += igst;
          gstr1Data.hsn[item.hsn_sac_code].camt += cgst;
          gstr1Data.hsn[item.hsn_sac_code].samt += sgst;
          gstr1Data.hsn[item.hsn_sac_code].csamt += parseFloat(item.cess_amount) || 0;
        });
      });

      // Convert HSN object to array
      gstr1Data.hsn = Object.values(gstr1Data.hsn);

      // Save return record
      const gstrReturn = await GSTRReturn.create({
        tenant_id: req.tenant_id,
        gstin,
        return_type: 'GSTR1',
        return_period: period,
        filing_status: 'draft',
        total_taxable_value: totalTaxableValue,
        total_tax: totalTax,
        json_data: gstr1Data,
      });

      res.json({
        return: gstrReturn,
        data: gstr1Data,
        summary: {
          totalTaxableValue: parseFloat(totalTaxableValue.toFixed(2)),
          totalTax: parseFloat(totalTax.toFixed(2)),
          b2bCount: gstr1Data.b2b.length,
          b2clCount: gstr1Data.b2cl.length,
          b2csCount: gstr1Data.b2cs.length,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async generateGSTR3B(req, res, next) {
    try {
      const { gstin, period } = req.body;

      const [month, year] = period.split('-');
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Get GSTR-1 data for summary
      const gstr1 = await GSTRReturn.findOne({
        where: {
          tenant_id: req.tenant_id,
          gstin,
          return_type: 'GSTR1',
          return_period: period,
        },
      });

      // Get purchase invoices for input tax credit
      const purchaseVouchers = await Voucher.findAll({
        where: {
          tenant_id: req.tenant_id,
          voucher_date: { [Op.between]: [startDate, endDate] },
          status: 'posted',
        },
        include: [
          {
            model: VoucherType,
            where: { voucher_category: 'Purchase' },
          },
          { model: VoucherItem },
        ],
      });

      let totalInputCGST = 0;
      let totalInputSGST = 0;
      let totalInputIGST = 0;
      let totalInputCess = 0;

      purchaseVouchers.forEach((voucher) => {
        voucher.voucher_items?.forEach((item) => {
          totalInputCGST += parseFloat(item.cgst_amount);
          totalInputSGST += parseFloat(item.sgst_amount);
          totalInputIGST += parseFloat(item.igst_amount);
          totalInputCess += parseFloat(item.cess_amount);
        });
      });

      const gstr1Data = gstr1?.json_data || {};
      const totalOutputCGST = gstr1Data.hsn?.reduce((sum, h) => sum + (h.camt || 0), 0) || 0;
      const totalOutputSGST = gstr1Data.hsn?.reduce((sum, h) => sum + (h.samt || 0), 0) || 0;
      const totalOutputIGST = gstr1Data.hsn?.reduce((sum, h) => sum + (h.iamt || 0), 0) || 0;
      const totalOutputCess = gstr1Data.hsn?.reduce((sum, h) => sum + (h.csamt || 0), 0) || 0;

      const gstr3bData = {
        gstin: gstin,
        ret_period: period,
        sup_details: {
          osup_det: {
            txval: gstr1?.total_taxable_value || 0,
            iamt: totalOutputIGST,
            camt: totalOutputCGST,
            samt: totalOutputSGST,
            csamt: totalOutputCess,
          },
        },
        inter_sup: {
          unreg_details: [],
          comp_details: [],
          uin_details: [],
        },
        itc_elg: {
          itc_avl: [
            {
              ty: 'IMPG',
              iamt: totalInputIGST,
              camt: totalInputCGST,
              samt: totalInputSGST,
              csamt: totalInputCess,
            },
            {
              ty: 'ISRC',
              iamt: 0,
              camt: 0,
              samt: 0,
              csamt: 0,
            },
            {
              ty: 'ISD',
              iamt: 0,
              camt: 0,
              samt: 0,
              csamt: 0,
            },
          ],
        },
        inward_sup: {
          isup_details: [],
        },
      };

      const netCGST = Math.max(0, totalOutputCGST - totalInputCGST);
      const netSGST = Math.max(0, totalOutputSGST - totalInputSGST);
      const netIGST = Math.max(0, totalOutputIGST - totalInputIGST);
      const netCess = Math.max(0, totalOutputCess - totalInputCess);

      const gstrReturn = await GSTRReturn.create({
        tenant_id: req.tenant_id,
        gstin,
        return_type: 'GSTR3B',
        return_period: period,
        filing_status: 'draft',
        total_taxable_value: gstr1?.total_taxable_value || 0,
        total_tax: netCGST + netSGST + netIGST + netCess,
        json_data: gstr3bData,
      });

      res.json({
        return: gstrReturn,
        data: gstr3bData,
        summary: {
          outputTax: {
            cgst: parseFloat(totalOutputCGST.toFixed(2)),
            sgst: parseFloat(totalOutputSGST.toFixed(2)),
            igst: parseFloat(totalOutputIGST.toFixed(2)),
            cess: parseFloat(totalOutputCess.toFixed(2)),
          },
          inputTaxCredit: {
            cgst: parseFloat(totalInputCGST.toFixed(2)),
            sgst: parseFloat(totalInputSGST.toFixed(2)),
            igst: parseFloat(totalInputIGST.toFixed(2)),
            cess: parseFloat(totalInputCess.toFixed(2)),
          },
          netPayable: {
            cgst: parseFloat(netCGST.toFixed(2)),
            sgst: parseFloat(netSGST.toFixed(2)),
            igst: parseFloat(netIGST.toFixed(2)),
            cess: parseFloat(netCess.toFixed(2)),
            total: parseFloat((netCGST + netSGST + netIGST + netCess).toFixed(2)),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async listReturns(req, res, next) {
    try {
      const { return_type, period } = req.query;
      const where = { tenant_id: req.tenant_id };

      if (return_type) where.return_type = return_type;
      if (period) where.return_period = period;

      const returns = await GSTRReturn.findAll({
        where,
        order: [['return_period', 'DESC'], ['created_at', 'DESC']],
      });

      res.json({ returns });
    } catch (err) {
      next(err);
    }
  },
};

