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

      // Generate database credentials before creating company
      const dbPassword = generateSecurePassword();
      // Fix: Use company name only (not subdomain) to avoid duplication
      // Sanitize company name and limit length to prevent MySQL errors
      const sanitizedCompanyName = company_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      // Limit to 30 chars to leave room for prefix and timestamp (MySQL limit is 64)
      const dbNamePrefix = sanitizedCompanyName.substring(0, 30);
      const dbName = tenantProvisioningService.generateDatabaseName(dbNamePrefix);
      const dbUser = tenantProvisioningService.generateDatabaseUser(dbNamePrefix);

      // Create company record with database info (but not provisioned yet)
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

      // Provision COMPANY database on company creation
      try {
        logger.info(`Provisioning company database: tenant=${tenant.id}, company=${company.id}`);
        await tenantProvisioningService.provisionDatabase(company, dbPassword);
        await company.reload();
      } catch (provisionError) {
        logger.error('Database provisioning failed during company creation:', provisionError);
        // Delete the company record if database provisioning fails
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

      // Only update fields that are provided
      const updateData = {};
      if (company_name !== undefined) updateData.company_name = company_name;
      if (company_type !== undefined) updateData.company_type = company_type;
      if (registration_number !== undefined) updateData.registration_number = registration_number || null;
      if (incorporation_date !== undefined) updateData.incorporation_date = incorporation_date || null;
      if (pan !== undefined) updateData.pan = pan || null;
      if (tan !== undefined) updateData.tan = tan || null;
      if (gstin !== undefined) updateData.gstin = gstin || null;
      if (registered_address !== undefined) updateData.registered_address = registered_address || null;
      if (state !== undefined) updateData.state = state || null;
      if (pincode !== undefined) updateData.pincode = pincode || null;
      if (contact_number !== undefined) updateData.contact_number = contact_number || null;
      if (email !== undefined) updateData.email = email || null;
      if (principals !== undefined) updateData.principals = principals || null;
      if (financial_year_start !== undefined) updateData.financial_year_start = financial_year_start || null;
      if (financial_year_end !== undefined) updateData.financial_year_end = financial_year_end || null;
      if (currency !== undefined) updateData.currency = currency || 'INR';
      if (books_beginning_date !== undefined) updateData.books_beginning_date = books_beginning_date || null;
      if (bank_details !== undefined) updateData.bank_details = bank_details || null;
      if (compliance !== undefined) {
        // Merge with existing compliance data to preserve values not being updated
        const existingCompliance = company.compliance || {};
        const mergedCompliance = { ...existingCompliance };
        
        // Merge e_invoice
        if (compliance.e_invoice) {
          mergedCompliance.e_invoice = {
            ...existingCompliance.e_invoice,
            ...compliance.e_invoice,
            // Only update password/secret if provided in the update (property exists)
            password: compliance.e_invoice.hasOwnProperty('password') 
              ? (compliance.e_invoice.password || null)
              : (existingCompliance.e_invoice?.password || null),
            client_secret: compliance.e_invoice.hasOwnProperty('client_secret')
              ? (compliance.e_invoice.client_secret || null)
              : (existingCompliance.e_invoice?.client_secret || null),
          };
        }
        
        // Merge e_way_bill
        if (compliance.e_way_bill) {
          mergedCompliance.e_way_bill = {
            ...existingCompliance.e_way_bill,
            ...compliance.e_way_bill,
            // Only update password/secret if provided in the update (property exists)
            password: compliance.e_way_bill.hasOwnProperty('password')
              ? (compliance.e_way_bill.password || null)
              : (existingCompliance.e_way_bill?.password || null),
            client_secret: compliance.e_way_bill.hasOwnProperty('client_secret')
              ? (compliance.e_way_bill.client_secret || null)
              : (existingCompliance.e_way_bill?.client_secret || null),
          };
        }
        
        // Merge invoice_numbering
        if (compliance.invoice_numbering) {
          mergedCompliance.invoice_numbering = {
            ...existingCompliance.invoice_numbering,
            ...compliance.invoice_numbering,
          };
        }
        
        updateData.compliance = mergedCompliance;
      }

      await company.update(updateData);
      await company.reload();

      return res.json({ success: true, data: company });
    } catch (err) {
      return next(err);
    }
  },
};

