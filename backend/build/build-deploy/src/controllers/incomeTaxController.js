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
};
