module.exports = {
  async list(req, res, next) {
    try {
      const { is_active, voucher_category } = req.query;
      const VoucherType = req.masterModels?.VoucherType;
      if (!VoucherType) return res.status(500).json({ message: 'VoucherType model not available' });

      const where = {}; // shared master data

      if (is_active !== undefined) where.is_active = is_active === 'true';
      if (voucher_category) where.type_category = String(voucher_category).toLowerCase();

      const voucherTypes = await VoucherType.findAll({
        where,
        order: [['type_category', 'ASC'], ['name', 'ASC']],
      });

      res.json({ voucherTypes });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      return res.status(403).json({ message: 'Voucher types are read-only (managed by system)' });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const VoucherType = req.masterModels?.VoucherType;
      if (!VoucherType) return res.status(500).json({ message: 'VoucherType model not available' });
      const voucherType = await VoucherType.findOne({
        where: { id },
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
      return res.status(403).json({ message: 'Voucher types are read-only (managed by system)' });
    } catch (err) {
      next(err);
    }
  },
};

