
const masterModels = require('../models/masterModels');
const TenantMaster = require('../models/TenantMaster');
const { SubscriptionPlan } = require('../models');

module.exports = {
  async create(req, res, next) {
    try {
      const { 
        company_id, 
        branch_name, 
        branch_code,
        gstin, 
        address,
        city,
        state,
        pincode,
        phone,
        email
      } = req.body;

      const company = await masterModels.Company.findOne({ where: { id: company_id, tenant_id: req.tenant_id } });
      if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found' });
      }

      const tenant = await TenantMaster.findByPk(req.tenant_id);
      const plan = await SubscriptionPlan.findOne({ where: { plan_code: tenant.subscription_plan } });

      if (plan && plan.plan_type === 'multi-branch') {
        const branchCount = await masterModels.Branch.count({ where: { company_id } });
        if (branchCount >= plan.max_branches) {
          return res.status(403).json({ success: false, message: 'Branch limit reached for your plan' });
        }
      }

      // Check for unique branch_code if provided
      if (branch_code) {
        const existingBranch = await masterModels.Branch.findOne({ 
          where: { branch_code, company_id } 
        });
        if (existingBranch) {
          return res.status(400).json({ 
            success: false, 
            message: 'Branch code already exists for this company' 
          });
        }
      }

      const branch = await masterModels.Branch.create({ 
        company_id, 
        branch_name, 
        branch_code,
        gstin, 
        address,
        city,
        state,
        pincode,
        phone,
        email
      });
      
      return res.status(201).json({ success: true, data: branch });
    } catch (err) {
      return next(err);
    }
  },

  async list(req, res, next) {
    try {
      const { company_id } = req.params;
      const branches = await masterModels.Branch.findAll({ where: { company_id, is_active: true } });
      return res.json({ success: true, data: branches });
    } catch (err) {
      return next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const branch = await masterModels.Branch.findOne({ where: { id, is_active: true } });
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
      const { 
        branch_name, 
        branch_code,
        gstin, 
        address,
        city,
        state,
        pincode,
        phone,
        email
      } = req.body;

      const branch = await masterModels.Branch.findOne({ where: { id, is_active: true } });
      if (!branch) {
        return res.status(404).json({ success: false, message: 'Branch not found' });
      }

      // Check for unique branch_code if provided and different from current
      if (branch_code && branch_code !== branch.branch_code) {
        const existingBranch = await masterModels.Branch.findOne({ 
          where: { 
            branch_code, 
            company_id: branch.company_id,
            id: { [require('sequelize').Op.ne]: id }
          } 
        });
        if (existingBranch) {
          return res.status(400).json({ 
            success: false, 
            message: 'Branch code already exists for this company' 
          });
        }
      }

      await branch.update({ 
        branch_name, 
        branch_code,
        gstin, 
        address,
        city,
        state,
        pincode,
        phone,
        email
      });
      
      return res.json({ success: true, data: branch });
    } catch (err) {
      return next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      const branch = await masterModels.Branch.findOne({ where: { id, is_active: true } });
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
