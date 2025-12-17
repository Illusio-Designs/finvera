const logger = require('../utils/logger');
const TenantMaster = require('../models/TenantMaster');
const masterModels = require('../models/masterModels');

module.exports = {
  async list(req, res, next) {
    try {
      const Company = masterModels.Company;
      const companies = await Company.findAll({
        where: { tenant_id: req.tenant_id, is_active: true },
        order: [['createdAt', 'DESC']],
      });
      return res.json({ success: true, data: companies });
    } catch (err) {
      return next(err);
    }
  },

  async status(req, res, next) {
    try {
      const Company = masterModels.Company;
      const count = await Company.count({ where: { tenant_id: req.tenant_id, is_active: true } });
      const tenant = await TenantMaster.findByPk(req.tenant_id);
      return res.json({
        success: true,
        data: {
          has_company: count > 0,
          company_count: count,
          db_provisioned: !!tenant?.db_provisioned,
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const Company = masterModels.Company;

      const tenant = await TenantMaster.findByPk(req.tenant_id);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }
      if (tenant.is_suspended) {
        return res.status(403).json({ success: false, message: 'Tenant account is suspended' });
      }

      const {
        company_name,
        company_type,
        registration_number,
        incorporation_date,
        pan,
        tan,
        gstin,
        registered_address,
        state,
        pincode,
        contact_number,
        email,
        principals,
        financial_year_start,
        financial_year_end,
        authorized_capital,
        accounting_method,
        currency,
        books_beginning_date,
        bank_details,
        compliance,
      } = req.body || {};

      if (!company_name || !company_type) {
        return res.status(400).json({
          success: false,
          message: 'company_name and company_type are required',
        });
      }

      // Create company record first (so we always track creation attempt)
      const company = await Company.create({
        tenant_id: req.tenant_id,
        created_by_user_id: req.user_id,
        company_name,
        company_type,
        registration_number: registration_number || null,
        incorporation_date: incorporation_date || null,
        pan: pan || null,
        tan: tan || null,
        gstin: gstin || null,
        registered_address: registered_address || null,
        state: state || null,
        pincode: pincode || null,
        contact_number: contact_number || null,
        email: email || null,
        principals: principals || null,
        financial_year_start: financial_year_start || null,
        financial_year_end: financial_year_end || null,
        authorized_capital: authorized_capital || null,
        accounting_method: accounting_method || null,
        currency: currency || 'INR',
        books_beginning_date: books_beginning_date || null,
        bank_details: bank_details || null,
        compliance: compliance || null,
        db_provisioned: !!tenant.db_provisioned,
        db_provisioned_at: tenant.db_provisioned_at || null,
        is_active: true,
      });

      // Provision tenant database ONLY on company creation (first company)
      if (!tenant.db_provisioned) {
        try {
          logger.info(`Provisioning tenant database on company creation: tenant=${tenant.id}, company=${company.id}`);
          const tenantProvisioningService = require('../services/tenantProvisioningService');
          const plainPassword = tenantProvisioningService.decryptPassword(tenant.db_password);
          await tenantProvisioningService.provisionDatabase(tenant, plainPassword);
          await tenant.reload();

          await company.update({
            db_provisioned: true,
            db_provisioned_at: tenant.db_provisioned_at || new Date(),
          });
        } catch (provisionError) {
          logger.error('Database provisioning failed during company creation:', provisionError);
          return res.status(503).json({
            success: false,
            message: 'Company created, but database provisioning failed. Please try again later or contact support.',
            data: { company_id: company.id },
          });
        }
      }

      return res.status(201).json({ success: true, data: company });
    } catch (err) {
      return next(err);
    }
  },
};

