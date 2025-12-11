const { Tenant } = require('../models');

module.exports = {
  async getProfile(req, res, next) {
    try {
      const tenant = await Tenant.findByPk(req.tenantId);
      if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
      return res.json(tenant);
    } catch (err) {
      return next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const tenant = await Tenant.findByPk(req.tenantId);
      if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
      await tenant.update(req.body);
      return res.json(tenant);
    } catch (err) {
      return next(err);
    }
  },
};


