const { VoucherType } = require('../models');

module.exports = {
  async list(req, res, next) {
    try {
      const { is_active, voucher_category } = req.query;
      const where = { tenant_id: req.tenant_id };

      if (is_active !== undefined) where.is_active = is_active === 'true';
      if (voucher_category) where.voucher_category = voucher_category;

      const voucherTypes = await VoucherType.findAll({
        where,
        order: [['voucher_category', 'ASC'], ['voucher_name', 'ASC']],
      });

      res.json({ voucherTypes });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const voucherType = await VoucherType.create({
        ...req.body,
        tenant_id: req.tenant_id,
      });

      res.status(201).json({ voucherType });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const voucherType = await VoucherType.findOne({
        where: { id, tenant_id: req.tenant_id },
      });

      if (!voucherType) {
        return res.status(404).json({ message: 'Voucher type not found' });
      }

      res.json({ voucherType });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const voucherType = await VoucherType.findOne({
        where: { id, tenant_id: req.tenant_id },
      });

      if (!voucherType) {
        return res.status(404).json({ message: 'Voucher type not found' });
      }

      if (voucherType.is_system_voucher) {
        return res.status(403).json({ message: 'System voucher types cannot be modified' });
      }

      await voucherType.update(req.body);
      res.json({ voucherType });
    } catch (err) {
      next(err);
    }
  },
};

