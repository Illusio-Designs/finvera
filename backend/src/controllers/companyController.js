
const logger = require('../utils/logger');
const TenantMaster = require('../models/TenantMaster');
const masterModels = require('../models/masterModels');
const { SubscriptionPlan, Branch } = require('../models');

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
      let maxBranches = 0;
      let planType = 'multi-company';

      if (tenant?.subscription_plan) {
        const plan = await SubscriptionPlan.findOne({
          where: { plan_code: tenant.subscription_plan, is_active: true },
        });
        if (plan) {
          maxCompanies = parseInt(plan.max_companies, 10) || 1;
          maxBranches = parseInt(plan.max_branches, 10) || 0;
          planType = plan.plan_type || 'multi-company';
        }
      }

      return res.json({
        success: true,
        data: {
          has_company: count > 0,
          company_count: count,
          provisioned_company_count: provisionedCount,
          max_companies: maxCompanies,
          max_branches: maxBranches,
          plan_type: planType,
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

      let maxCompanies = 1;
      let maxBranches = 0;
      let planType = 'multi-company';
      const plan = tenant.subscription_plan ? await SubscriptionPlan.findOne({
        where: { plan_code: tenant.subscription_plan, is_active: true },
      }) : null;

      if (plan) {
        maxCompanies = parseInt(plan.max_companies, 10) || 1;
        maxBranches = parseInt(plan.max_branches, 10) || 0;
        planType = plan.plan_type || 'multi-company';
      }

      const existingCount = await Company.count({ where: { tenant_id: req.tenant_id, is_active: true } });
      if (planType === 'multi-company' && existingCount >= maxCompanies) {
        return res.status(403).json({
          success: false,
          message: `Company limit reached for your plan (max ${maxCompanies}). Please upgrade to add more companies.`,
        });
      }

      const {
        branches, // Expect an array of branch objects
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

      if (planType === 'multi-branch' && (!branches || branches.length === 0)) {
          return res.status(400).json({
              success: false,
              message: 'At least one branch is required for a multi-branch plan.',
          });
      }

      if (planType === 'multi-branch' && branches.length > maxBranches) {
        return res.status(403).json({
            success: false,
            message: `Branch limit reached for your plan (max ${maxBranches}).`,
        });
      }

      const tenantProvisioningService = require('../services/tenantProvisioningService');
      const crypto = require('crypto');

      const generateSecurePassword = (length = 20) => {
        return crypto.randomBytes(length).toString('base64').slice(0, length);
      };

      const dbPassword = generateSecurePassword();
      const sanitizedCompanyName = company_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const dbNamePrefix = sanitizedCompanyName.substring(0, 30);
      const dbName = tenantProvisioningService.generateDatabaseName(dbNamePrefix);
      const dbUser = tenantProvisioningService.generateDatabaseUser(dbNamePrefix);

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

      // Create branches if provided
      if (planType === 'multi-branch' && branches && branches.length > 0) {
        const branchData = branches.map(branch => ({
            ...branch,
            company_id: company.id,
        }));
        await Branch.bulkCreate(branchData);
      }

      try {
        logger.info(`Provisioning company database: tenant=${tenant.id}, company=${company.id}`);
        await tenantProvisioningService.provisionDatabase(company, dbPassword);
        await company.reload();
      } catch (provisionError) {
        logger.error('Database provisioning failed during company creation:', provisionError);
        await company.destroy();
        return res.status(500).json({
          success: false,
          message: 'Failed to create company: Database provisioning failed. Please try again.',
          error: provisionError.message,
        });
      }

      return res.status(201).json({ success: true, data: company });
    } catch (err) {
      return next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const Company = masterModels.Company;
      const company = await Company.findOne({
        where: { id: req.params.id, tenant_id: req.tenant_id, is_active: true },
        include: ['branches'],
      });
      if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found' });
      }
      return res.json({ success: true, data: company });
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const Company = masterModels.Company;
      const company = await Company.findOne({
        where: { id: req.params.id, tenant_id: req.tenant_id, is_active: true },
      });
      
      if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found' });
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
        currency,
        books_beginning_date,
        bank_details,
        compliance,
      } = req.body || {};

      await company.update({
        company_name: company_name || company.company_name,
        company_type: company_type || company.company_type,
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
        currency,
        books_beginning_date,
        bank_details,
        compliance,
      });

      return res.json({ success: true, data: company });
    } catch (err) {
      return next(err);
    }
  },

  async uploadLogo(req, res, next) {
    try {
      const Company = masterModels.Company;
      const company = await Company.findOne({
        where: { id: req.params.id, tenant_id: req.tenant_id, is_active: true },
      });
      
      if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const logoUrl = `/uploads/company-logos/${req.file.filename}`;
      await company.update({ logo_url: logoUrl });

      return res.json({ success: true, data: { logo_url: logoUrl } });
    } catch (err) {
      return next(err);
    }
  },

  async uploadSignature(req, res, next) {
    try {
      const Company = masterModels.Company;
      const company = await Company.findOne({
        where: { id: req.params.id, tenant_id: req.tenant_id, is_active: true },
      });
      
      if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const signatureUrl = `/uploads/company-signatures/${req.file.filename}`;
      
      // Store signature URL in compliance JSON field
      const compliance = company.compliance || {};
      compliance.signature_url = signatureUrl;
      await company.update({ compliance });

      return res.json({ success: true, data: { signature_url: signatureUrl } });
    } catch (err) {
      return next(err);
    }
  },

  async uploadDSCCertificate(req, res, next) {
    try {
      const Company = masterModels.Company;
      const company = await Company.findOne({
        where: { id: req.params.id, tenant_id: req.tenant_id, is_active: true },
      });
      
      if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const certificateUrl = `/uploads/dsc-certificates/${req.file.filename}`;
      
      // Store certificate URL in compliance JSON field
      const compliance = company.compliance || {};
      compliance.dsc_certificate_url = certificateUrl;
      await company.update({ compliance });

      return res.json({ success: true, data: { dsc_certificate_url: certificateUrl } });
    } catch (err) {
      return next(err);
    }
  },

  async updateDSCConfig(req, res, next) {
    try {
      const Company = masterModels.Company;
      const company = await Company.findOne({
        where: { id: req.params.id, tenant_id: req.tenant_id, is_active: true },
      });
      
      if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found' });
      }

      const { dsc_enabled, dsc_password, dsc_alias } = req.body || {};

      // Store DSC config in compliance JSON field
      const compliance = company.compliance || {};
      if (dsc_enabled !== undefined) compliance.dsc_enabled = dsc_enabled;
      if (dsc_password !== undefined) compliance.dsc_password = dsc_password;
      if (dsc_alias !== undefined) compliance.dsc_alias = dsc_alias;
      
      await company.update({ compliance });

      return res.json({ success: true, data: { compliance } });
    } catch (err) {
      return next(err);
    }
  },

};
