/**
 * TDS/TCS Controller
 * Phase 1: Foundation Layer - Section Management
 */

const logger = require('../utils/logger');
const TDSTCSService = require('../services/tdsTcsService');

module.exports = {
  /**
   * Get TDS sections list
   */
  async getTDSSections(req, res, next) {
    try {
      const sections = await TDSTCSService.getTDSSections(req.masterModels);
      res.json({ success: true, data: sections });
    } catch (error) {
      logger.error('Get TDS sections error:', error);
      next(error);
    }
  },

  /**
   * Get TCS sections list
   */
  async getTCSSections(req, res, next) {
    try {
      const sections = await TDSTCSService.getTCSSections(req.masterModels);
      res.json({ success: true, data: sections });
    } catch (error) {
      logger.error('Get TCS sections error:', error);
      next(error);
    }
  },

  /**
   * Get company TDS/TCS configuration
   */
  async getCompanyConfig(req, res, next) {
    try {
      const { companyId } = req.params;
      const config = await TDSTCSService.getCompanyTDSTCSConfig(req.masterModels, companyId);
      res.json({ success: true, data: config });
    } catch (error) {
      logger.error('Get company TDS/TCS config error:', error);
      next(error);
    }
  },

  /**
   * Manually trigger TDS ledger creation (admin only)
   */
  async createTDSLedgers(req, res, next) {
    try {
      const ledgers = await TDSTCSService.createTDSLedgers(
        req.tenantModels,
        req.masterModels,
        req.tenant_id
      );
      res.json({
        success: true,
        message: 'TDS ledgers created successfully',
        data: ledgers,
      });
    } catch (error) {
      logger.error('Create TDS ledgers error:', error);
      next(error);
    }
  },

  /**
   * Manually trigger TCS ledger creation (admin only)
   */
  async createTCSLedgers(req, res, next) {
    try {
      const ledgers = await TDSTCSService.createTCSLedgers(
        req.tenantModels,
        req.masterModels,
        req.tenant_id
      );
      res.json({
        success: true,
        message: 'TCS ledgers created successfully',
        data: ledgers,
      });
    } catch (error) {
      logger.error('Create TCS ledgers error:', error);
      next(error);
    }
  },
};
