const { Op } = require('sequelize');

function toNum(v, fallback = 0) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function fyFromPeriod(period) {
  // period: MM-YYYY
  const [mmStr, yyyyStr] = String(period || '').split('-');
  const mm = parseInt(mmStr, 10);
  const yyyy = parseInt(yyyyStr, 10);
  if (!mm || !yyyy) return null;
  if (mm >= 4) return `${yyyy}-${yyyy + 1}`;
  return `${yyyy - 1}-${yyyy}`;
}

module.exports = {
  async listGSTINs(req, res, next) {
    try {
      const gstins = await req.tenantModels.GSTIN.findAll({
        where: {},
        order: [['is_primary', 'DESC'], ['created_at', 'ASC']],
      });
      res.json({ gstins });
    } catch (err) {
      next(err);
    }
  },

  async createGSTIN(req, res, next) {
    try {
      if (req.body.is_primary) {
        await req.tenantModels.GSTIN.update({ is_primary: false }, { where: {} });
      }

      const gstin = await req.tenantModels.GSTIN.create({ ...req.body });
      res.status(201).json({ gstin });
    } catch (err) {
      next(err);
    }
  },

  async updateGSTIN(req, res, next) {
    try {
      const { id } = req.params;
      const gstin = await req.tenantModels.GSTIN.findByPk(id);
      if (!gstin) return res.status(404).json({ message: 'GSTIN not found' });

      if (req.body.is_primary) {
        await req.tenantModels.GSTIN.update({ is_primary: false }, { where: { id: { [Op.ne]: id } } });
      }

      await gstin.update(req.body);
      res.json({ gstin });
    } catch (err) {
      next(err);
    }
  },

  async getGSTRates(req, res, next) {
    try {
      const GSTRate = req.masterModels?.GSTRate;
      if (!GSTRate) return res.status(500).json({ message: 'GSTRate model not available' });

      const { hsn_sac_code, item_type } = req.query;
      const where = {
        [Op.or]: [{ tenant_id: req.tenant_id }, { tenant_id: null }],
        is_active: true,
      };

      if (hsn_sac_code) where.hsn_sac_code = hsn_sac_code;
      if (item_type) where.item_type = item_type;

      const rates = await GSTRate.findAll({
        where,
        order: [['tenant_id', 'ASC'], ['hsn_sac_code', 'ASC']],
      });

      res.json({ rates });
    } catch (err) {
      next(err);
    }
  },

  async createGSTRate(req, res, next) {
    try {
      const GSTRate = req.masterModels?.GSTRate;
      if (!GSTRate) return res.status(500).json({ message: 'GSTRate model not available' });

      const rate = await GSTRate.create({ ...req.body, tenant_id: req.tenant_id });
      res.status(201).json({ rate });
    } catch (err) {
      next(err);
    }
  },

  async listReturns(req, res, next) {
    try {
      const { return_type, return_period } = req.query;
      const where = {};
      if (return_type) where.return_type = return_type;
      if (return_period) where.return_period = return_period;

      const returns = await req.tenantModels.GSTRReturn.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      res.json({ returns });
    } catch (err) {
      next(err);
    }
  },

  async generateGSTR1(req, res, next) {
    try {
      const { gstin, period } = req.body; // MM-YYYY
      const [month, year] = String(period).split('-').map((s) => parseInt(s, 10));
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const salesVouchers = await req.tenantModels.Voucher.findAll({
        where: {
          voucher_date: { [Op.between]: [startDate, endDate] },
          status: 'posted',
          voucher_type: 'Sales',
        },
        include: [
          { model: req.tenantModels.VoucherItem },
          { model: req.tenantModels.Ledger, as: 'partyLedger' },
        ],
      });

      const gstr1Data = {
        gstin,
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

        (voucher.voucher_items || []).forEach((item) => {
          const taxableValue = toNum(item.taxable_amount, 0);
          const cgst = toNum(item.cgst_amount, 0);
          const sgst = toNum(item.sgst_amount, 0);
          const igst = toNum(item.igst_amount, 0);
          const tax = cgst + sgst + igst;

          totalTaxableValue += taxableValue;
          totalTax += tax;

          if (voucher.partyLedger?.gstin) {
            gstr1Data.b2b.push({
              ctin: voucher.partyLedger.gstin,
              inv: [
                {
                  inum: voucher.voucher_number,
                  idt: String(voucher.voucher_date),
                  val: toNum(voucher.total_amount, 0),
                  pos: voucher.place_of_supply,
                  rchrg: voucher.is_reverse_charge ? 'Y' : 'N',
                  inv_typ: 'R',
                  itms: [
                    {
                      num: 1,
                      hsn_sc: item.hsn_sac_code,
                      qty: toNum(item.quantity, 0),
                      rt: toNum(item.gst_rate, 0),
                      txval: taxableValue,
                      iamt: igst,
                      camt: cgst,
                      samt: sgst,
                      csamt: toNum(item.cess_amount, 0),
                    },
                  ],
                },
              ],
            });
          } else if (isInterstate && taxableValue >= 250000) {
            gstr1Data.b2cl.push({
              pos: voucher.place_of_supply,
              typ: 'OE',
              etin: '',
              rt: toNum(item.gst_rate, 0),
              ad_amt: taxableValue,
              iamt: igst,
              csamt: toNum(item.cess_amount, 0),
            });
          } else {
            gstr1Data.b2cs.push({
              typ: 'OE',
              pos: voucher.place_of_supply,
              rt: toNum(item.gst_rate, 0),
              ad_amt: taxableValue,
              iamt: igst,
              camt: cgst,
              samt: sgst,
              csamt: toNum(item.cess_amount, 0),
            });
          }

          const code = item.hsn_sac_code || 'NA';
          if (!gstr1Data.hsn[code]) {
            gstr1Data.hsn[code] = {
              num: code,
              qty: 0,
              rt: toNum(item.gst_rate, 0),
              txval: 0,
              iamt: 0,
              camt: 0,
              samt: 0,
              csamt: 0,
            };
          }

          gstr1Data.hsn[code].qty += toNum(item.quantity, 0);
          gstr1Data.hsn[code].txval += taxableValue;
          gstr1Data.hsn[code].iamt += igst;
          gstr1Data.hsn[code].camt += cgst;
          gstr1Data.hsn[code].samt += sgst;
          gstr1Data.hsn[code].csamt += toNum(item.cess_amount, 0);
        });
      });

      gstr1Data.hsn = Object.values(gstr1Data.hsn);

      const gstinRow = gstin ? await req.tenantModels.GSTIN.findOne({ where: { gstin } }) : null;
      const gstrReturn = await req.tenantModels.GSTRReturn.create({
        gstin_id: gstinRow?.id || null,
        return_type: 'GSTR1',
        return_period: period,
        financial_year: fyFromPeriod(period),
        status: 'draft',
        return_data: {
          ...gstr1Data,
          summary: {
            totalTaxableValue: parseFloat(totalTaxableValue.toFixed(2)),
            totalTax: parseFloat(totalTax.toFixed(2)),
          },
        },
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
      const [month, year] = String(period).split('-').map((s) => parseInt(s, 10));
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const gstinRow = gstin ? await req.tenantModels.GSTIN.findOne({ where: { gstin } }) : null;
      const gstr1 = await req.tenantModels.GSTRReturn.findOne({
        where: { gstin_id: gstinRow?.id || null, return_type: 'GSTR1', return_period: period },
      });

      const purchaseVouchers = await req.tenantModels.Voucher.findAll({
        where: {
          voucher_date: { [Op.between]: [startDate, endDate] },
          status: 'posted',
          voucher_type: 'Purchase',
        },
        include: [{ model: req.tenantModels.VoucherItem }],
      });

      let totalInputCGST = 0;
      let totalInputSGST = 0;
      let totalInputIGST = 0;
      let totalInputCess = 0;

      purchaseVouchers.forEach((voucher) => {
        (voucher.voucher_items || []).forEach((item) => {
          totalInputCGST += toNum(item.cgst_amount, 0);
          totalInputSGST += toNum(item.sgst_amount, 0);
          totalInputIGST += toNum(item.igst_amount, 0);
          totalInputCess += toNum(item.cess_amount, 0);
        });
      });

      const gstr1Data = gstr1?.return_data || {};
      const totalOutputCGST = (gstr1Data.hsn || []).reduce((sum, h) => sum + toNum(h.camt, 0), 0);
      const totalOutputSGST = (gstr1Data.hsn || []).reduce((sum, h) => sum + toNum(h.samt, 0), 0);
      const totalOutputIGST = (gstr1Data.hsn || []).reduce((sum, h) => sum + toNum(h.iamt, 0), 0);
      const totalOutputCess = (gstr1Data.hsn || []).reduce((sum, h) => sum + toNum(h.csamt, 0), 0);

      const gstr3bData = {
        gstin,
        ret_period: period,
        sup_details: {
          osup_det: {
            txval: gstr1Data?.summary?.totalTaxableValue || 0,
            iamt: totalOutputIGST,
            camt: totalOutputCGST,
            samt: totalOutputSGST,
            csamt: totalOutputCess,
          },
        },
        itc_elg: {
          itc_avl: [
            {
              ty: 'ALL',
              iamt: totalInputIGST,
              camt: totalInputCGST,
              samt: totalInputSGST,
              csamt: totalInputCess,
            },
          ],
        },
      };

      const netCGST = Math.max(0, totalOutputCGST - totalInputCGST);
      const netSGST = Math.max(0, totalOutputSGST - totalInputSGST);
      const netIGST = Math.max(0, totalOutputIGST - totalInputIGST);
      const netCess = Math.max(0, totalOutputCess - totalInputCess);

      const gstrReturn = await req.tenantModels.GSTRReturn.create({
        gstin_id: gstinRow?.id || null,
        return_type: 'GSTR3B',
        return_period: period,
        financial_year: fyFromPeriod(period),
        status: 'draft',
        return_data: {
          ...gstr3bData,
          summary: {
            totalOutput: { cgst: totalOutputCGST, sgst: totalOutputSGST, igst: totalOutputIGST, cess: totalOutputCess },
            totalInput: { cgst: totalInputCGST, sgst: totalInputSGST, igst: totalInputIGST, cess: totalInputCess },
            netPayable: { cgst: netCGST, sgst: netSGST, igst: netIGST, cess: netCess },
            totalTaxPayable: parseFloat((netCGST + netSGST + netIGST + netCess).toFixed(2)),
          },
        },
      });

      res.json({
        return: gstrReturn,
        data: gstr3bData,
        summary: gstrReturn.return_data?.summary,
      });
    } catch (err) {
      next(err);
    }
  },
};
