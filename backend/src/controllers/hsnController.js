const hsnApiService = require('../services/hsnApiService');

module.exports = {
  async search(req, res, next) {
    try {
      const { q = '', type, limit = 20 } = req.query;
      const query = String(q || '').trim();

      if (query.length < 2) {
        return res.json({ 
          success: true, 
          data: [],
          message: 'Please enter at least 2 characters to search HSN codes'
        });
      }

      const ctx = {
        company: req.company,
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
      };

      // Check if HSN API is configured
      if (!hsnApiService.isConfigured(req.company)) {
        return res.status(400).json({
          success: false,
          message: 'HSN API not configured. Please configure HSN API credentials in company settings.',
          configStatus: hsnApiService.getConfigStatus(req.company)
        });
      }

      const results = await hsnApiService.search(ctx, query, { type, limit });
      return res.json({ 
        success: true, 
        data: results,
        source: 'api'
      });
    } catch (err) {
      if (err.message.includes('HSN API not configured')) {
        return res.status(400).json({
          success: false,
          message: err.message,
          configStatus: hsnApiService.getConfigStatus(req.company)
        });
      }
      return next(err);
    }
  },

  async getByCode(req, res, next) {
    try {
      const { code } = req.params;
      
      const ctx = {
        company: req.company,
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
      };

      // Check if HSN API is configured
      if (!hsnApiService.isConfigured(req.company)) {
        return res.status(400).json({
          success: false,
          message: 'HSN API not configured. Please configure HSN API credentials in company settings.',
          configStatus: hsnApiService.getConfigStatus(req.company)
        });
      }

      const result = await hsnApiService.getByCode(ctx, code);
      return res.json({ 
        success: true, 
        data: result,
        source: 'api'
      });
    } catch (err) {
      if (err.message === 'HSN/SAC code not found') {
        return res.status(404).json({ success: false, message: err.message });
      }
      if (err.message.includes('HSN API not configured')) {
        return res.status(400).json({
          success: false,
          message: err.message,
          configStatus: hsnApiService.getConfigStatus(req.company)
        });
      }
      return next(err);
    }
  },

  async validate(req, res, next) {
    try {
      const { code } = req.params;
      
      const ctx = {
        company: req.company,
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
      };

      const result = await hsnApiService.validate(ctx, code);
      return res.json({ 
        success: true, 
        ...result,
        source: 'api'
      });
    } catch (err) {
      return next(err);
    }
  },

  // New endpoint to check HSN API configuration status
  async getConfigStatus(req, res, next) {
    try {
      const configStatus = hsnApiService.getConfigStatus(req.company);
      return res.json({
        success: true,
        data: configStatus
      });
    } catch (err) {
      return next(err);
    }
  },
};

