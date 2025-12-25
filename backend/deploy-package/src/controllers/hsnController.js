const { Op } = require('sequelize');
const masterModels = require('../models/masterModels');
const hsnApiService = require('../services/hsnApiService');

module.exports = {
  async search(req, res, next) {
    try {
      const { q = '', type, limit = 20 } = req.query;
      const query = String(q || '').trim();

      if (query.length < 2) {
        return res.json({ success: true, data: [] });
      }

      const ctx = {
        company: req.company,
        tenantModels: req.tenantModels,
        masterModels: req.masterModels,
      };

      const results = await hsnApiService.search(ctx, query, { type, limit });
      return res.json({ success: true, data: results });
    } catch (err) {
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

      const result = await hsnApiService.getByCode(ctx, code);
      return res.json({ success: true, data: result });
    } catch (err) {
      if (err.message === 'HSN/SAC code not found') {
        return res.status(404).json({ success: false, message: err.message });
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
      return res.json({ success: true, ...result });
    } catch (err) {
      return next(err);
    }
  },
};

