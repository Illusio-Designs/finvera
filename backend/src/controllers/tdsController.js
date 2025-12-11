const { TDSDetail, Voucher, Ledger, VoucherLedgerEntry, Tenant } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

module.exports = {
  async list(req, res, next) {
    try {
      const { quarter, financial_year, ledger_id } = req.query;
      const where = { tenant_id: req.tenant_id };

      if (quarter) where.quarter = quarter;
      if (financial_year) where.financial_year = financial_year;
      if (ledger_id) where.ledger_id = ledger_id;

      const tdsDetails = await TDSDetail.findAll({
        where,
        include: [
          { model: Voucher, attributes: ['voucher_number', 'voucher_date'] },
          { model: Ledger, attributes: ['ledger_name', 'pan'] },
        ],
        order: [['payment_date', 'DESC']],
      });

      res.json({ tdsDetails });
    } catch (err) {
      next(err);
    }
  },

  async calculateTDS(req, res, next) {
    try {
      const { voucher_id, tds_section, tds_rate } = req.body;

      const voucher = await Voucher.findOne({
        where: { id: voucher_id, tenant_id: req.tenant_id },
        include: [{ model: Ledger, as: 'partyLedger' }],
      });

      if (!voucher) {
        return res.status(404).json({ message: 'Voucher not found' });
      }

      const partyLedger = voucher.partyLedger;
      if (!partyLedger || !partyLedger.tds_applicable) {
        return res.status(400).json({ message: 'TDS is not applicable for this ledger' });
      }

      const grossAmount = parseFloat(voucher.total_amount);
      const rate = parseFloat(tds_rate) || parseFloat(partyLedger.tds_rate) || 10;
      const tdsAmount = (grossAmount * rate) / 100;
      const netAmount = grossAmount - tdsAmount;

      // Determine quarter and financial year
      const paymentDate = voucher.voucher_date || new Date();
      const quarter = getQuarter(paymentDate);
      const financialYear = getFinancialYear(paymentDate);

      // Create TDS detail
      const tdsDetail = await TDSDetail.create({
        tenant_id: req.tenant_id,
        voucher_id,
        ledger_id: voucher.party_ledger_id,
        tds_section: tds_section || partyLedger.tds_section || '194C',
        tds_rate: rate,
        gross_amount: grossAmount,
        tds_amount: parseFloat(tdsAmount.toFixed(2)),
        net_amount: parseFloat(netAmount.toFixed(2)),
        payment_date: paymentDate,
        quarter,
        financial_year: financialYear,
        pan_of_deductee: partyLedger.pan,
      });

      // Update voucher with TDS amount
      await voucher.update({
        tds_amount: parseFloat(tdsAmount.toFixed(2)),
        total_amount: parseFloat(netAmount.toFixed(2)),
      });

      res.status(201).json({ tdsDetail });
    } catch (err) {
      next(err);
    }
  },

  async generateReturn(req, res, next) {
    try {
      const { quarter, financial_year } = req.body;

      const where = {
        tenant_id: req.tenant_id,
        quarter,
        financial_year,
      };

      const tdsDetails = await TDSDetail.findAll({
        where,
        include: [
          { model: Ledger, attributes: ['ledger_name', 'pan', 'gstin'] },
          { model: Voucher, attributes: ['voucher_number', 'voucher_date'] },
        ],
      });

      // Group by TDS section
      const returnData = {
        tan: req.tenant?.tan || '', // TAN of deductor
        financial_year,
        quarter,
        sections: {},
      };

      tdsDetails.forEach((tds) => {
        const section = tds.tds_section;
        if (!returnData.sections[section]) {
          returnData.sections[section] = {
            section,
            rate: tds.tds_rate,
            deductees: [],
            total_tds: 0,
          };
        }

        returnData.sections[section].deductees.push({
          pan: tds.pan_of_deductee,
          name: tds.ledger?.ledger_name,
          gross_amount: tds.gross_amount,
          tds_amount: tds.tds_amount,
          payment_date: tds.payment_date,
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

      const tdsDetail = await TDSDetail.findOne({
        where: { id, tenant_id: req.tenant_id },
        include: [
          { model: Ledger, attributes: ['ledger_name', 'pan', 'address', 'city', 'state', 'pincode'] },
          { model: Voucher, attributes: ['voucher_number', 'voucher_date'] },
          { model: Tenant, attributes: ['company_name', 'pan', 'address'] },
        ],
      });

      if (!tdsDetail) {
        return res.status(404).json({ message: 'TDS detail not found' });
      }

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
          name: tdsDetail.tenant?.company_name,
          pan: tdsDetail.tenant?.pan,
          tan: req.tenant?.tan || '',
          address: tdsDetail.tenant?.address,
        },
        deductee: {
          name: tdsDetail.ledger?.ledger_name,
          pan: tdsDetail.pan_of_deductee,
          address: `${tdsDetail.ledger?.address || ''}, ${tdsDetail.ledger?.city || ''}, ${tdsDetail.ledger?.state || ''} - ${tdsDetail.ledger?.pincode || ''}`,
        },
        tds_details: {
          section: tdsDetail.tds_section,
          rate: tdsDetail.tds_rate,
          gross_amount: tdsDetail.gross_amount,
          tds_amount: tdsDetail.tds_amount,
          payment_date: tdsDetail.payment_date,
          voucher_number: tdsDetail.voucher?.voucher_number,
          voucher_date: tdsDetail.voucher?.voucher_date,
        },
        issued_date: new Date().toISOString(),
      };

      res.json({ certificate, tdsDetail });
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

