const eInvoiceService = require('../services/eInvoiceService');
const { EInvoice, Voucher } = require('../models');

module.exports = {
  async generateIRN(req, res, next) {
    try {
      const { voucher_id } = req.body;

      if (!voucher_id) {
        return res.status(400).json({ message: 'voucher_id is required' });
      }

      const eInvoice = await eInvoiceService.generateIRN(req.tenant_id, voucher_id);

      res.status(201).json({
        success: true,
        eInvoice: {
          id: eInvoice.id,
          irn: eInvoice.irn,
          ack_number: eInvoice.ack_number,
          ack_date: eInvoice.ack_date,
          qr_code: eInvoice.qr_code,
          status: eInvoice.status,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async cancelIRN(req, res, next) {
    try {
      const { voucher_id } = req.params;
      const { reason } = req.body;

      const eInvoice = await eInvoiceService.cancelEInvoice(req.tenant_id, voucher_id, reason);

      res.json({
        success: true,
        message: 'E-invoice cancelled successfully',
        eInvoice: {
          id: eInvoice.id,
          irn: eInvoice.irn,
          status: eInvoice.status,
          cancellation_date: eInvoice.cancellation_date,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getEInvoice(req, res, next) {
    try {
      const { voucher_id } = req.params;

      const eInvoice = await EInvoice.findOne({
        where: {
          voucher_id,
          tenant_id: req.tenant_id,
        },
        include: [{ model: Voucher, attributes: ['voucher_number', 'voucher_date', 'total_amount'] }],
      });

      if (!eInvoice) {
        return res.status(404).json({ message: 'E-invoice not found' });
      }

      res.json({ eInvoice });
    } catch (err) {
      next(err);
    }
  },

  async listEInvoices(req, res, next) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      const where = { tenant_id: req.tenant_id };
      if (status) where.status = status;

      const eInvoices = await EInvoice.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [{ model: Voucher, attributes: ['voucher_number', 'voucher_date'] }],
        order: [['created_at', 'DESC']],
      });

      res.json({
        eInvoices: eInvoices.rows,
        pagination: {
          total: eInvoices.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(eInvoices.count / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

