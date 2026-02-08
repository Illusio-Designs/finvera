const TenantMaster = require('../models/TenantMaster');
const { Company } = require('../models/masterModels');

module.exports = {
  async getProfile(req, res, next) {
    try {
      // Get tenant info
      const tenant = await TenantMaster.findByPk(req.tenant_id);
      if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
      
      // Get company info (if user has a company_id)
      let companySettings = {};
      if (req.user && req.user.company_id) {
        const company = await Company.findByPk(req.user.company_id);
        if (company) {
          companySettings = {
            eInvoiceEnabled: company.compliance?.e_invoice?.applicable || false,
            e_invoice_enabled: company.compliance?.e_invoice?.applicable || false,
            eInvoiceThreshold: company.compliance?.e_invoice?.threshold || 0,
            e_invoice_threshold: company.compliance?.e_invoice?.threshold || 0,
            eWayBillEnabled: company.compliance?.e_way_bill?.applicable || false,
            e_way_bill_enabled: company.compliance?.e_way_bill?.applicable || false,
            eWayBillThreshold: 50000, // Default threshold
            e_way_bill_threshold: 50000,
            tdsEnabled: company.compliance?.tds_applicable || false,
            tds_enabled: company.compliance?.tds_applicable || false,
            autoGenerateEInvoice: false,
            auto_generate_e_invoice: false,
            autoGenerateEWayBill: false,
            auto_generate_e_way_bill: false,
            defaultTDSSection: null,
            default_tds_section: null,
          };
        }
      }
      
      // Transform the tenant data to match expected structure
      const tenantData = {
        id: tenant.id,
        name: tenant.company_name, // Map company_name to name for frontend
        company_name: tenant.company_name,
        email: tenant.email,
        gstin: tenant.gstin,
        pan: tenant.pan,
        tan: tenant.tan,
        address: tenant.address,
        city: tenant.city,
        state: tenant.state,
        pincode: tenant.pincode,
        phone: tenant.phone,
        subscription_plan: tenant.subscription_plan,
        subscription_start: tenant.subscription_start,
        subscription_end: tenant.subscription_end,
        is_trial: tenant.is_trial,
        trial_ends_at: tenant.trial_ends_at,
        is_active: tenant.is_active,
        settings: {
          ...(tenant.settings || {}),
          ...companySettings, // Merge company-specific settings
        },
      };
      
      return res.json({ success: true, data: { tenant: tenantData } });
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
