const { Op } = require('sequelize');
const masterModels = require('../models/masterModels');

module.exports = {
  async search(req, res, next) {
    try {
      const { q = '', type, limit = 20 } = req.query;
      const query = String(q || '').trim();

      if (query.length < 2) {
        return res.json({ success: true, data: [] });
      }

      const where = { is_active: true };
      if (type) where.item_type = String(type).toUpperCase();

      where[Op.or] = [
        { code: { [Op.like]: `%${query}%` } },
        { technical_description: { [Op.like]: `%${query}%` } },
        { trade_description: { [Op.like]: `%${query}%` } },
      ];

      const rows = await masterModels.HSNSAC.findAll({
        where,
        limit: Math.min(parseInt(limit, 10) || 20, 100),
        order: [['code', 'ASC']],
        attributes: [
          'code',
          'item_type',
          'technical_description',
          'trade_description',
          'gst_rate',
          'cess_rate',
          'uqc_code',
          'effective_from',
        ],
      });

      return res.json({ success: true, data: rows });
    } catch (err) {
      return next(err);
    }
  },

  async getByCode(req, res, next) {
    try {
      const { code } = req.params;
      const row = await masterModels.HSNSAC.findByPk(code);
      if (!row || !row.is_active) {
        return res.status(404).json({ success: false, message: 'HSN/SAC code not found' });
      }
      return res.json({ success: true, data: row });
    } catch (err) {
      return next(err);
    }
  },
};

