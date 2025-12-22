const finboxService = require('../services/finboxService');

/**
 * FinBox Controller
 * Handles HTTP requests for FinBox credit scoring and loan services
 */
module.exports = {
  /**
   * Get credit score for a customer
   * POST /finbox/credit-score
   */
  async getCreditScore(req, res, next) {
    try {
      const { customer_id, pan } = req.body;

      if (!customer_id) {
        return res.status(400).json({ 
          success: false,
          message: 'customer_id is required' 
        });
      }

      if (!pan) {
        return res.status(400).json({ 
          success: false,
          message: 'PAN is required for credit score check' 
        });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await finboxService.getCreditScore(ctx, customer_id, pan);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get FinBox Inclusion Score (FIS)
   * GET /finbox/inclusion-score/:customer_id
   */
  async getInclusionScore(req, res, next) {
    try {
      const { customer_id } = req.params;

      if (!customer_id) {
        return res.status(400).json({ 
          success: false,
          message: 'customer_id is required' 
        });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await finboxService.getInclusionScore(ctx, customer_id);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Check loan eligibility
   * POST /finbox/eligibility
   */
  async checkLoanEligibility(req, res, next) {
    try {
      const { customer_id, loan_amount, loan_type, tenure } = req.body;

      if (!customer_id) {
        return res.status(400).json({ 
          success: false,
          message: 'customer_id is required' 
        });
      }

      const loanData = {
        ...(loan_amount && { loan_amount }),
        ...(loan_type && { loan_type }),
        ...(tenure && { tenure }),
      };

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await finboxService.checkLoanEligibility(ctx, customer_id, loanData);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Create FinBox user
   * POST /finbox/user
   */
  async createUser(req, res, next) {
    try {
      const { customer_id, name, email, phone, pan, date_of_birth } = req.body;

      if (!customer_id) {
        return res.status(400).json({ 
          success: false,
          message: 'customer_id is required' 
        });
      }

      const userData = {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(pan && { pan }),
        ...(date_of_birth && { date_of_birth }),
      };

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await finboxService.createUser(ctx, customer_id, userData);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Initiate bank statement collection
   * POST /finbox/bank-statement/initiate
   */
  async initiateBankStatement(req, res, next) {
    try {
      const { customer_id, bank_name, account_type, method } = req.body;

      if (!customer_id) {
        return res.status(400).json({ 
          success: false,
          message: 'customer_id is required' 
        });
      }

      const bankData = {
        ...(bank_name && { bank_name }),
        ...(account_type && { account_type }),
        ...(method && { method }), // 'aa' (Account Aggregator), 'netbanking', 'upload'
      };

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await finboxService.initiateBankStatement(ctx, customer_id, bankData);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get bank statement status
   * GET /finbox/bank-statement/:customer_id/status
   */
  async getBankStatementStatus(req, res, next) {
    try {
      const { customer_id } = req.params;

      if (!customer_id) {
        return res.status(400).json({ 
          success: false,
          message: 'customer_id is required' 
        });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await finboxService.getBankStatementStatus(ctx, customer_id);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get bank statement analysis
   * GET /finbox/bank-statement/:customer_id/analysis
   */
  async getBankStatementAnalysis(req, res, next) {
    try {
      const { customer_id } = req.params;

      if (!customer_id) {
        return res.status(400).json({ 
          success: false,
          message: 'customer_id is required' 
        });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await finboxService.getBankStatementAnalysis(ctx, customer_id);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get device insights
   * POST /finbox/device-insights
   */
  async getDeviceInsights(req, res, next) {
    try {
      const { customer_id, version, salt } = req.body;

      if (!customer_id) {
        return res.status(400).json({ 
          success: false,
          message: 'customer_id is required' 
        });
      }

      if (!version) {
        return res.status(400).json({ 
          success: false,
          message: 'version is required' 
        });
      }

      if (!salt) {
        return res.status(400).json({ 
          success: false,
          message: 'salt is required' 
        });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await finboxService.getDeviceInsights(ctx, customer_id, version, salt);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Generate session token for SDK
   * POST /finbox/session
   */
  async generateSessionToken(req, res, next) {
    try {
      const { customer_id, redirect_url, loan_amount } = req.body;

      if (!customer_id) {
        return res.status(400).json({ 
          success: false,
          message: 'customer_id is required' 
        });
      }

      const sessionData = {
        ...(redirect_url && { redirect_url }),
        ...(loan_amount && { loan_amount }),
      };

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await finboxService.generateSessionToken(ctx, customer_id, sessionData);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
};
