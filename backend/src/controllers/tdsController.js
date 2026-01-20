const { Op } = require('sequelize');
const tdsService = require('../services/tdsService');

module.exports = {
  async list(req, res, next) {
    try {
      const { quarter, financial_year, ledger_id } = req.query;
      const where = {};

      if (quarter) where.quarter = quarter;
      if (financial_year) where.financial_year = financial_year;
      if (ledger_id) where.ledger_id = ledger_id;

      const tdsDetails = await req.tenantModels.TDSDetail.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      res.json({ tdsDetails });
    } catch (err) {
      next(err);
    }
  },

  async calculateTDS(req, res, next) {
    try {
      const { voucher_id, tds_section, tds_rate, amount, pan_available } = req.body;

      // For testing purposes, allow calculation without voucher_id if amount is provided
      if (!voucher_id && !amount) {
        return res.status(400).json({ message: 'Either voucher_id or amount is required' });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      let result;
      if (voucher_id) {
        // Calculate TDS for existing voucher
        result = await tdsService.calculateTDS(ctx, voucher_id, tds_section, tds_rate);
      } else {
        // Calculate TDS for given amount (testing/preview mode)
        result = await tdsService.calculateTDSForAmount(ctx, amount, tds_section, tds_rate, pan_available);
      }

      res.status(201).json({
        success: true,
        tdsDetail: result.tdsDetail,
        summary: result.summary,
        apiResponse: result.apiResponse,
      });
    } catch (err) {
      next(err);
    }
  },

  async generateReturn(req, res, next) {
    try {
      const { quarter, financial_year } = req.body;

      if (!quarter || !financial_year) {
        return res.status(400).json({ message: 'quarter and financial_year are required' });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await tdsService.prepareAndFileReturn(ctx, quarter, financial_year);

      res.json({
        success: true,
        preparedReturn: result.preparedReturn,
        filedReturn: result.filedReturn,
        returnId: result.returnId,
        acknowledgmentNumber: result.acknowledgmentNumber,
        summary: result.summary,
      });
    } catch (err) {
      next(err);
    }
  },

  async generateCertificate(req, res, next) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'TDS detail id is required' });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const result = await tdsService.generateForm16A(ctx, id);

      res.json({
        success: true,
        certificate: result.certificate,
        tdsDetail: result.tdsDetail,
        ledger: result.ledger,
        voucher: result.voucher,
      });
    } catch (err) {
      next(err);
    }
  },

  async getReturnStatus(req, res, next) {
    try {
      const { return_id } = req.params;
      const { form_type = '24Q' } = req.query;

      if (!return_id) {
        return res.status(400).json({ message: 'return_id is required' });
      }

      const ctx = {
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
        company: req.company,
      };

      const status = await tdsService.getReturnStatus(ctx, return_id, form_type);

      res.json({
        success: true,
        status,
      });
    } catch (err) {
      next(err);
    }
  },

  // ==================== SANDBOX TDS ANALYTICS APIs ====================

  /**
   * Create TDS Potential Notice Job
   */
  async createTDSPotentialNoticeJob(req, res, next) {
    try {
      const { quarter, tan, form, financial_year } = req.body;
      
      if (!quarter || !tan || !form || !financial_year) {
        return res.status(400).json({ message: 'quarter, tan, form, and financial_year are required' });
      }

      const { createApiClientFromCompany } = require('../services/thirdPartyApiClient');
      const apiClient = createApiClientFromCompany(req.company);
      
      const result = await apiClient.createTDSPotentialNoticeJob({
        quarter,
        tan,
        form,
        financial_year
      });

      res.json({
        success: true,
        jobId: result.job_id || result.jobId,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get TDS Analytics Job Status
   */
  async getTDSAnalyticsJobStatus(req, res, next) {
    try {
      const { job_id } = req.params;
      
      if (!job_id) {
        return res.status(400).json({ message: 'job_id is required' });
      }

      const { createApiClientFromCompany } = require('../services/thirdPartyApiClient');
      const apiClient = createApiClientFromCompany(req.company);
      
      const result = await apiClient.getTDSAnalyticsJobStatus(job_id);

      res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  // ==================== SANDBOX TDS CALCULATOR APIs ====================

  /**
   * Calculate Non-Salary TDS
   */
  async calculateNonSalaryTDS(req, res, next) {
    try {
      const calculationParams = req.body;
      
      if (!calculationParams.payment_amount || !calculationParams.section) {
        return res.status(400).json({ message: 'payment_amount and section are required' });
      }

      const { createApiClientFromCompany } = require('../services/thirdPartyApiClient');
      const apiClient = createApiClientFromCompany(req.company);
      
      const result = await apiClient.calculateNonSalaryTDS(calculationParams);

      res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  // ==================== SANDBOX TDS COMPLIANCE APIs ====================

  /**
   * Check Section 206AB & 206CCA Compliance
   */
  async check206ABCompliance(req, res, next) {
    try {
      const { pan, consent, reason } = req.body;
      
      if (!pan || consent === undefined) {
        return res.status(400).json({ message: 'pan and consent are required' });
      }

      const { createApiClientFromCompany } = require('../services/thirdPartyApiClient');
      const apiClient = createApiClientFromCompany(req.company);
      
      const result = await apiClient.check206ABCompliance({
        pan,
        consent,
        reason
      });

      res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Generate OTP for CSI Download
   */
  async generateCSIOTP(req, res, next) {
    try {
      const otpParams = req.body;
      
      if (!otpParams.tan) {
        return res.status(400).json({ message: 'tan is required' });
      }

      const { createApiClientFromCompany } = require('../services/thirdPartyApiClient');
      const apiClient = createApiClientFromCompany(req.company);
      
      const result = await apiClient.generateCSIOTP(otpParams);

      res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Download CSI with OTP
   */
  async downloadCSI(req, res, next) {
    try {
      const downloadParams = req.body;
      
      if (!downloadParams.tan || !downloadParams.otp) {
        return res.status(400).json({ message: 'tan and otp are required' });
      }

      const { createApiClientFromCompany } = require('../services/thirdPartyApiClient');
      const apiClient = createApiClientFromCompany(req.company);
      
      const result = await apiClient.downloadCSI(downloadParams);

      res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  // ==================== SANDBOX TDS REPORTS APIs ====================

  /**
   * Submit TCS Report Job
   */
  async submitTCSReportJob(req, res, next) {
    try {
      const reportParams = req.body;
      
      if (!reportParams.tan || !reportParams.quarter || !reportParams.financial_year) {
        return res.status(400).json({ message: 'tan, quarter, and financial_year are required' });
      }

      const { createApiClientFromCompany } = require('../services/thirdPartyApiClient');
      const apiClient = createApiClientFromCompany(req.company);
      
      const result = await apiClient.submitTCSReportJob(reportParams);

      res.json({
        success: true,
        jobId: result.job_id || result.jobId,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get TCS Report Job Status
   */
  async getTCSReportJobStatus(req, res, next) {
    try {
      const { job_id } = req.params;
      
      if (!job_id) {
        return res.status(400).json({ message: 'job_id is required' });
      }

      const { createApiClientFromCompany } = require('../services/thirdPartyApiClient');
      const apiClient = createApiClientFromCompany(req.company);
      
      const result = await apiClient.getTCSReportJobStatus(job_id);

      res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Search TCS Report Jobs
   */
  async searchTCSReportJobs(req, res, next) {
    try {
      const searchParams = req.body || {};

      const { createApiClientFromCompany } = require('../services/thirdPartyApiClient');
      const apiClient = createApiClientFromCompany(req.company);
      
      const result = await apiClient.searchTCSReportJobs(searchParams);

      res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },
};

