const { createApiClientFromCompany } = require('./thirdPartyApiClient');
const masterModels = require('../models/masterModels');
const logger = require('../utils/logger');

/**
 * HSN API Service
 * Provides third-party API integration for HSN/SAC code lookup and validation
 */
class HSNApiService {
  /**
   * Search HSN codes using third-party API
   */
  async search(ctx, query, filters = {}) {
    const { company } = ctx;
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.hsn_api?.applicable && compliance.hsn_api?.api_key;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        const results = await apiClient.searchHSN(query, filters);
        
        // Merge with local database results
        const localResults = await this.searchLocal(query, filters);
        
        // Combine and deduplicate
        const combined = [...(results.data || results || []), ...localResults];
        const unique = Array.from(new Map(combined.map(item => [item.code, item])).values());
        
        return unique;
      } catch (error) {
        logger.error('Third-party HSN API error:', error);
        // Fall through to local search
      }
    }

    // Fallback to local search
    return this.searchLocal(query, filters);
  }

  /**
   * Search HSN codes from local database
   */
  async searchLocal(query, filters = {}) {
    const { Op } = require('sequelize');
    const where = { is_active: true };
    
    if (filters.type) {
      where.item_type = String(filters.type).toUpperCase();
    }

    if (query && query.length >= 2) {
      where[Op.or] = [
        { code: { [Op.like]: `%${query}%` } },
        { technical_description: { [Op.like]: `%${query}%` } },
        { trade_description: { [Op.like]: `%${query}%` } },
      ];
    }

    const results = await masterModels.HSNSAC.findAll({
      where,
      limit: Math.min(parseInt(filters.limit) || 20, 100),
      order: [['code', 'ASC']],
      attributes: [
        'code',
        'item_type',
        'technical_description',
        'trade_description',
        'gst_rate',
        'cess_rate',
        'uqc_code',
        'effective_from',
      ],
    });

    return results;
  }

  /**
   * Get HSN code details using third-party API
   */
  async getByCode(ctx, code) {
    const { company } = ctx;
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.hsn_api?.applicable && compliance.hsn_api?.api_key;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        const result = await apiClient.getHSNByCode(code);
        
        if (result && result.code) {
          return result;
        }
      } catch (error) {
        logger.error('Third-party HSN API error:', error);
        // Fall through to local lookup
      }
    }

    // Fallback to local lookup
    const localResult = await masterModels.HSNSAC.findByPk(code);
    if (!localResult || !localResult.is_active) {
      throw new Error('HSN/SAC code not found');
    }
    return localResult;
  }

  /**
   * Validate HSN code using third-party API
   */
  async validate(ctx, code) {
    const { company } = ctx;
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.hsn_api?.applicable && compliance.hsn_api?.api_key;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        const result = await apiClient.validateHSN(code);
        return {
          valid: result.valid !== false,
          code: result.code || code,
          message: result.message || 'HSN code is valid',
          details: result,
        };
      } catch (error) {
        logger.error('Third-party HSN validation API error:', error);
        // Fall through to local validation
      }
    }

    // Fallback to local validation
    const localResult = await masterModels.HSNSAC.findByPk(code);
    return {
      valid: localResult && localResult.is_active,
      code,
      message: localResult && localResult.is_active ? 'HSN code is valid' : 'HSN code not found',
      details: localResult,
    };
  }
}

module.exports = new HSNApiService();
