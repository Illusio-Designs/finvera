const { Op } = require('sequelize');

module.exports = {
  async list(req, res, next) {
    try {
      const { quarter, financial_year, ledger_id } = req.query;
      const where = {};

      if (quarter) where.quarter = quarter;
      if (financial_year) where.financial_year = financial_year;
      if (ledger_id) where.ledger_id = ledger_id;

      const tdsDetails = await req.tenantModels.TDSDetail.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      res.json({ tdsDetails });
    } catch (err) {
      next(err);
    }
  },

  async calculateTDS(req, res, next) {
    try {
      const { voucher_id, tds_section, tds_rate } = req.body;

      const voucher = await req.tenantModels.Voucher.findByPk(voucher_id, {
        include: [{ model: req.tenantModels.Ledger, as: 'partyLedger' }],
      });

      if (!voucher) {
        return res.status(404).json({ message: 'Voucher not found' });
      }

      const partyLedger = voucher.partyLedger;
      if (!partyLedger) return res.status(400).json({ message: 'Party ledger not found for voucher' });

      const grossAmount = parseFloat(voucher.total_amount);
      const rate = parseFloat(tds_rate) || parseFloat(partyLedger.tds_rate) || 10;
      const tdsAmount = (grossAmount * rate) / 100;
      const netAmount = grossAmount - tdsAmount;

      // Determine quarter and financial year
      const paymentDate = voucher.voucher_date || new Date();
      const quarter = getQuarter(paymentDate);
      const financialYear = getFinancialYear(paymentDate);

      // Create TDS detail
      const tdsDetail = await req.tenantModels.TDSDetail.create({
        voucher_id,
        ledger_id: voucher.party_ledger_id,
        section: tds_section || partyLedger.tds_section || '194C',
        tds_rate: rate,
        taxable_amount: grossAmount,
        tds_amount: parseFloat(tdsAmount.toFixed(2)),
        quarter,
        financial_year: financialYear,
      });

      res.status(201).json({ tdsDetail, summary: { grossAmount, tdsAmount: parseFloat(tdsAmount.toFixed(2)), netAmount: parseFloat(netAmount.toFixed(2)) } });
    } catch (err) {
      next(err);
    }
  },

  async generateReturn(req, res, next) {
    try {
      const { quarter, financial_year } = req.body;

      const where = {
        quarter,
        financial_year,
      };

      const tdsDetails = await req.tenantModels.TDSDetail.findAll({
        where,
      });

      // Group by TDS section
      const returnData = {
        tan: req.company?.tan || '', // TAN of deductor
        financial_year,
        quarter,
        sections: {},
      };

      tdsDetails.forEach((tds) => {
        const section = tds.section;
        if (!returnData.sections[section]) {
          returnData.sections[section] = {
            section,
            rate: tds.tds_rate,
            deductees: [],
            total_tds: 0,
          };
        }

        returnData.sections[section].deductees.push({
          ledger_id: tds.ledger_id,
          gross_amount: tds.taxable_amount,
          tds_amount: tds.tds_amount,
        });

        returnData.sections[section].total_tds += parseFloat(tds.tds_amount);
      });

      // Convert sections object to array
      returnData.sections = Object.values(returnData.sections);

      res.json({
        returnData,
        summary: {
          totalSections: returnData.sections.length,
          totalTDS: returnData.sections.reduce((sum, s) => sum + s.total_tds, 0),
          totalDeductees: tdsDetails.length,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async generateCertificate(req, res, next) {
    try {
      const { id } = req.params;

      const tdsDetail = await req.tenantModels.TDSDetail.findByPk(id);

      if (!tdsDetail) {
        return res.status(404).json({ message: 'TDS detail not found' });
      }

      const ledger = await req.tenantModels.Ledger.findByPk(tdsDetail.ledger_id);
      const voucher = await req.tenantModels.Voucher.findByPk(tdsDetail.voucher_id);

      // Generate certificate number if not exists
      if (!tdsDetail.certificate_number) {
        const certNumber = `TDS/${tdsDetail.financial_year}/${tdsDetail.quarter}/${tdsDetail.id.substring(0, 8).toUpperCase()}`;
        await tdsDetail.update({ certificate_number: certNumber, certificate_issued: true });
        tdsDetail.certificate_number = certNumber;
        tdsDetail.certificate_issued = true;
      }

      // Form 16A structure
      const certificate = {
        certificate_type: 'Form 16A',
        certificate_number: tdsDetail.certificate_number,
        financial_year: tdsDetail.financial_year,
        quarter: tdsDetail.quarter,
        deductor: {
          name: req.company?.company_name || req.company?.name || '',
          pan: req.company?.pan || '',
          tan: req.company?.tan || '',
          address: req.company?.registered_address || req.company?.address || '',
        },
        deductee: {
          name: ledger?.ledger_name,
          pan: ledger?.pan,
          address: `${ledger?.address || ''}, ${ledger?.city || ''}, ${ledger?.state || ''} - ${ledger?.pincode || ''}`,
        },
        tds_details: {
          section: tdsDetail.section,
          rate: tdsDetail.tds_rate,
          gross_amount: tdsDetail.taxable_amount,
          tds_amount: tdsDetail.tds_amount,
          voucher_number: voucher?.voucher_number,
          voucher_date: voucher?.voucher_date,
        },
        issued_date: new Date().toISOString(),
      };

      res.json({ certificate, tdsDetail, ledger, voucher });
    } catch (err) {
      next(err);
    }
  },
};

function getQuarter(date) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  let quarter;

  if (month >= 4 && month <= 6) quarter = 'Q1';
  else if (month >= 7 && month <= 9) quarter = 'Q2';
  else if (month >= 10 && month <= 12) quarter = 'Q3';
  else quarter = 'Q4';

  return `${quarter}-${year}`;
}

function getFinancialYear(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

