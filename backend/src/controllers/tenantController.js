const TenantMaster = require('../models/TenantMaster');

module.exports = {
  async getProfile(req, res, next) {
    try {
      const tenant = await TenantMaster.findByPk(req.tenant_id);
      if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
      return res.json({ success: true, data: { tenant } });
    } catch (err) {
      return next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const tenant = await TenantMaster.findByPk(req.tenant_id);
      if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
      await tenant.update(req.body);
      return res.json({ success: true, data: tenant });
    } catch (err) {
      return next(err);
    }
  },
};


