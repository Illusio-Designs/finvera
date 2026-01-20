const incomeTaxService = require('../services/incomeTaxService');

module.exports = {
  /**
   * Calculate Income Tax
   */
  async calculateTax(req, res, next) {
    try {
      const taxData = req.body;

      if (!taxData.financialYear) {
        return res.status(400).json({ message: 'financialYear is required' });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await incomeTaxService.calculateTax(ctx, taxData);

      res.json({
        success: true,
        calculation: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Prepare ITR
   */
  async prepareITR(req, res, next) {
    try {
      const itrData = req.body;

      if (!itrData.financialYear) {
        return res.status(400).json({ message: 'financialYear is required' });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await incomeTaxService.prepareITR(ctx, itrData);

      res.json({
        success: true,
        preparedITR: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * File ITR
   */
  async fileITR(req, res, next) {
    try {
      const itrData = req.body;

      if (!itrData.financialYear || !itrData.formType) {
        return res.status(400).json({ message: 'financialYear and formType are required' });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await incomeTaxService.fileITR(ctx, itrData);

      res.json({
        success: true,
        filedITR: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get ITR Status
   */
  async getITRStatus(req, res, next) {
    try {
      const { return_id } = req.params;
      const { form_type = 'ITR-1' } = req.query;

      if (!return_id) {
        return res.status(400).json({ message: 'return_id is required' });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const status = await incomeTaxService.getITRStatus(ctx, return_id, form_type);

      res.json({
        success: true,
        status,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get Form 26AS
   */
  async getForm26AS(req, res, next) {
    try {
      const { pan } = req.params;
      const { financial_year } = req.query;

      if (!pan) {
        return res.status(400).json({ message: 'PAN is required' });
      }

      if (!financial_year) {
        return res.status(400).json({ message: 'financial_year is required' });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const form26AS = await incomeTaxService.getForm26AS(ctx, pan, financial_year);

      res.json({
        success: true,
        form26AS,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Parse Form 16 (OCR)
   */
  async parseForm16(req, res, next) {
    try {
      // Handle file upload (multer middleware should be used)
      const file = req.file;
      const form16Data = req.body;

      if (!file && !form16Data.fileData) {
        return res.status(400).json({ message: 'Form 16 file is required' });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      // Prepare data for API (file buffer, base64, or file path)
      const dataToSend = file 
        ? { file: file.buffer, filename: file.originalname, mimetype: file.mimetype }
        : form16Data;

      const result = await incomeTaxService.parseForm16(ctx, dataToSend);

      res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ==================== SANDBOX INCOME TAX CALCULATOR APIs ====================

  /**
   * Submit Tax P&L Job for Securities
   */
  async submitTaxPnLJob(req, res, next) {
    try {
      const { input, from, output, to } = req.body;
      
      if (!input || !from || !output || !to) {
        return res.status(400).json({ message: 'input, from, output, and to parameters are required' });
      }

      const { createApiClientFromCompany } = require('../services/thirdPartyApiClient');
      const apiClient = createApiClientFromCompany(req.company);
      
      const result = await apiClient.submitTaxPnLJob({
        input,
        from,
        output,
        to
      });

      res.json({
        success: true,
        jobId: result.job_id || result.jobId,
        uploadUrl: result.upload_url || result.uploadUrl,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get Tax P&L Job Status
   */
  async getTaxPnLJobStatus(req, res, next) {
    try {
      const { job_id } = req.params;
      
      if (!job_id) {
        return res.status(400).json({ message: 'job_id is required' });
      }

      const { createApiClientFromCompany } = require('../services/thirdPartyApiClient');
      const apiClient = createApiClientFromCompany(req.company);
      
      const result = await apiClient.getTaxPnLJobStatus(job_id);

      res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Upload Trading Data for Tax Calculation
   */
  async uploadTradingData(req, res, next) {
    try {
      const { upload_url, trading_data } = req.body;
      
      if (!upload_url || !trading_data) {
        return res.status(400).json({ message: 'upload_url and trading_data are required' });
      }

      const { createApiClientFromCompany } = require('../services/thirdPartyApiClient');
      const apiClient = createApiClientFromCompany(req.company);
      
      const result = await apiClient.uploadTradingData(upload_url, trading_data);

      res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Calculate Capital Gains Tax
   */
  async calculateCapitalGainsTax(req, res, next) {
    try {
      const calculationParams = req.body;
      
      if (!calculationParams.transactions || !calculationParams.financial_year) {
        return res.status(400).json({ message: 'transactions and financial_year are required' });
      }

      const { createApiClientFromCompany } = require('../services/thirdPartyApiClient');
      const apiClient = createApiClientFromCompany(req.company);
      
      const result = await apiClient.calculateCapitalGainsTax(calculationParams);

      res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Calculate Advance Tax
   */
  async calculateAdvanceTax(req, res, next) {
    try {
      const calculationParams = req.body;
      
      if (!calculationParams.estimated_income || !calculationParams.financial_year) {
        return res.status(400).json({ message: 'estimated_income and financial_year are required' });
      }

      const { createApiClientFromCompany } = require('../services/thirdPartyApiClient');
      const apiClient = createApiClientFromCompany(req.company);
      
      const result = await apiClient.calculateAdvanceTax(calculationParams);

      res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Generate Form 16
   */
  async generateForm16(req, res, next) {
    try {
      const form16Params = req.body;
      
      if (!form16Params.employee_details || !form16Params.salary_details || !form16Params.financial_year) {
        return res.status(400).json({ message: 'employee_details, salary_details, and financial_year are required' });
      }

      const { createApiClientFromCompany } = require('../services/thirdPartyApiClient');
      const apiClient = createApiClientFromCompany(req.company);
      
      const result = await apiClient.generateForm16(form16Params);

      res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },
};
