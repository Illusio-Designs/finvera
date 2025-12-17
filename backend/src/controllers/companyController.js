const logger = require('../utils/logger');
const TenantMaster = require('../models/TenantMaster');
const masterModels = require('../models/masterModels');
const { SubscriptionPlan } = require('../models');

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
      const [count, provisionedCount, tenant] = await Promise.all([
        Company.count({ where: { tenant_id: req.tenant_id, is_active: true } }),
        Company.count({ where: { tenant_id: req.tenant_id, is_active: true, db_provisioned: true } }),
        TenantMaster.findByPk(req.tenant_id),
      ]);

      let maxCompanies = 1;
      if (tenant?.subscription_plan) {
        const plan = await SubscriptionPlan.findOne({
          where: { plan_code: tenant.subscription_plan, is_active: true },
        });
        if (plan?.max_companies != null) maxCompanies = parseInt(plan.max_companies, 10) || 1;
      }

      return res.json({
        success: true,
        data: {
          has_company: count > 0,
          company_count: count,
          provisioned_company_count: provisionedCount,
          max_companies: maxCompanies,
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

      // Enforce plan company limit
      let maxCompanies = 1;
      if (tenant.subscription_plan) {
        const plan = await SubscriptionPlan.findOne({
          where: { plan_code: tenant.subscription_plan, is_active: true },
        });
        if (plan?.max_companies != null) maxCompanies = parseInt(plan.max_companies, 10) || 1;
      }

      const existingCount = await Company.count({ where: { tenant_id: req.tenant_id, is_active: true } });
      if (existingCount >= maxCompanies) {
        return res.status(403).json({
          success: false,
          message: `Company limit reached for your plan (max ${maxCompanies}). Please upgrade to add more companies.`,
        });
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

      const tenantProvisioningService = require('../services/tenantProvisioningService');
      const crypto = require('crypto');

      const generateSecurePassword = (length = 20) => {
        return crypto.randomBytes(length).toString('base64').slice(0, length);
      };

      const dbPassword = generateSecurePassword();
      const dbName = tenantProvisioningService.generateDatabaseName(
        `${tenant.subdomain}_${company_name}`.toLowerCase()
      );
      const dbUser = tenantProvisioningService.generateDatabaseUser(
        `${tenant.subdomain}_${company_name}`.toLowerCase()
      );

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
        db_name: dbName,
        db_host: process.env.DB_HOST || 'localhost',
        db_port: parseInt(process.env.DB_PORT) || 3306,
        db_user: dbUser,
        db_password: tenantProvisioningService.encryptPassword(dbPassword),
        db_provisioned: false,
        db_provisioned_at: null,
        is_active: true,
      });

      // Provision COMPANY database on company creation
      try {
        logger.info(`Provisioning company database: tenant=${tenant.id}, company=${company.id}`);
        await tenantProvisioningService.provisionDatabase(company, dbPassword);
        await company.reload();
      } catch (provisionError) {
        logger.error('Database provisioning failed during company creation:', provisionError);
        return res.status(503).json({
          success: false,
          message: 'Company created, but database provisioning failed. Please try again later or contact support.',
          data: { company_id: company.id },
        });
      }

      return res.status(201).json({ success: true, data: company });
    } catch (err) {
      return next(err);
    }
  },
};

