const eInvoiceService = require('../services/eInvoiceService');

module.exports = {
  async generateIRN(req, res, next) {
    try {
      const { voucher_id } = req.body;
      if (!voucher_id) return res.status(400).json({ message: 'voucher_id is required' });

      const eInvoice = await eInvoiceService.generateIRN(
        { tenantModels: req.tenantModels, masterModels: req.masterModels, company: req.company },
        voucher_id
      );

      res.status(201).json({
        success: true,
        eInvoice,
      });
    } catch (err) {
      next(err);
    }
  },

  async cancelIRN(req, res, next) {
    try {
      const { voucher_id } = req.params;
      const { reason } = req.body;

      const eInvoice = await eInvoiceService.cancelEInvoice(
        { tenantModels: req.tenantModels, masterModels: req.masterModels, company: req.company },
        voucher_id,
        reason
      );

      res.json({ success: true, message: 'E-invoice cancelled successfully', eInvoice });
    } catch (err) {
      next(err);
    }
  },

  async getEInvoice(req, res, next) {
    try {
      const { voucher_id } = req.params;
      const eInvoice = await req.tenantModels.EInvoice.findOne({
        where: { voucher_id },
      });

      if (!eInvoice) return res.status(404).json({ message: 'E-invoice not found' });
      res.json({ eInvoice });
    } catch (err) {
      next(err);
    }
  },

  async listEInvoices(req, res, next) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      const where = {};
      if (status) where.status = status;

      const eInvoices = await req.tenantModels.EInvoice.findAndCountAll({
        where,
        limit: parseInt(limit, 10),
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.json({
        eInvoices: eInvoices.rows,
        pagination: {
          total: eInvoices.count,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(eInvoices.count / parseInt(limit, 10)),
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
