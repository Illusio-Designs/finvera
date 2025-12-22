const { Op } = require('sequelize');
const tdsService = require('../services/tdsService');

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

      if (!voucher_id) {
        return res.status(400).json({ message: 'voucher_id is required' });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await tdsService.calculateTDS(ctx, voucher_id, tds_section, tds_rate);

      res.status(201).json({
        success: true,
        tdsDetail: result.tdsDetail,
        summary: result.summary,
        apiResponse: result.apiResponse,
      });
    } catch (err) {
      next(err);
    }
  },

  async generateReturn(req, res, next) {
    try {
      const { quarter, financial_year } = req.body;

      if (!quarter || !financial_year) {
        return res.status(400).json({ message: 'quarter and financial_year are required' });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await tdsService.prepareAndFileReturn(ctx, quarter, financial_year);

      res.json({
        success: true,
        preparedReturn: result.preparedReturn,
        filedReturn: result.filedReturn,
        returnId: result.returnId,
        acknowledgmentNumber: result.acknowledgmentNumber,
        summary: result.summary,
      });
    } catch (err) {
      next(err);
    }
  },

  async generateCertificate(req, res, next) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'TDS detail id is required' });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await tdsService.generateForm16A(ctx, id);

      res.json({
        success: true,
        certificate: result.certificate,
        tdsDetail: result.tdsDetail,
        ledger: result.ledger,
        voucher: result.voucher,
      });
    } catch (err) {
      next(err);
    }
  },

  async getReturnStatus(req, res, next) {
    try {
      const { return_id } = req.params;
      const { form_type = '24Q' } = req.query;

      if (!return_id) {
        return res.status(400).json({ message: 'return_id is required' });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const status = await tdsService.getReturnStatus(ctx, return_id, form_type);

      res.json({
        success: true,
        status,
      });
    } catch (err) {
      next(err);
    }
  },
};

