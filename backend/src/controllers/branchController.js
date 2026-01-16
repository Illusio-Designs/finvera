
const { Branch } = require('../models/masterModels');
const { Company } = require('../models/masterModels');
const { SubscriptionPlan } = require('../models');
const TenantMaster = require('../models/TenantMaster');

module.exports = {
  async create(req, res, next) {
    try {
      const { company_id, branch_name, gstin, address } = req.body;

      const company = await Company.findOne({ where: { id: company_id, tenant_id: req.tenant_id } });
      if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found' });
      }

      const tenant = await TenantMaster.findByPk(req.tenant_id);
      const plan = await SubscriptionPlan.findOne({ where: { plan_code: tenant.subscription_plan } });

      if (plan.plan_type === 'multi-branch') {
        const branchCount = await Branch.count({ where: { company_id } });
        if (branchCount >= plan.max_branches) {
          return res.status(403).json({ success: false, message: 'Branch limit reached for your plan' });
        }
      }

      const branch = await Branch.create({ company_id, branch_name, gstin, address });
      return res.status(201).json({ success: true, data: branch });
    } catch (err) {
      return next(err);
    }
  },

  async list(req, res, next) {
    try {
      const { company_id } = req.params;
      const branches = await Branch.findAll({ where: { company_id, is_active: true } });
      return res.json({ success: true, data: branches });
    } catch (err) {
      return next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const branch = await Branch.findOne({ where: { id, is_active: true } });
      if (!branch) {
        return res.status(404).json({ success: false, message: 'Branch not found' });
      }
      return res.json({ success: true, data: branch });
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { branch_name, gstin, address } = req.body;

      const branch = await Branch.findOne({ where: { id, is_active: true } });
      if (!branch) {
        return res.status(404).json({ success: false, message: 'Branch not found' });
      }

      await branch.update({ branch_name, gstin, address });
      return res.json({ success: true, data: branch });
    } catch (err) {
      return next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      const branch = await Branch.findOne({ where: { id, is_active: true } });
      if (!branch) {
        return res.status(404).json({ success: false, message: 'Branch not found' });
      }

      await branch.update({ is_active: false });
      return res.json({ success: true, message: 'Branch deleted successfully' });
    } catch (err) {
      return next(err);
    }
  },
};
