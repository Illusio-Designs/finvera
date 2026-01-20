const { createApiClientFromCompany } = require('./thirdPartyApiClient');
const logger = require('../utils/logger');

/**
 * HSN API Service - API-Only Implementation
 * Provides third-party API integration for HSN/SAC code lookup and validation
 * No local database fallback - always uses external API
 */
class HSNApiService {
  /**
   * Search HSN codes using third-party API only
   */
  async search(ctx, query, filters = {}) {
    const { company } = ctx;
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.hsn_api?.applicable && compliance.hsn_api?.api_key;
    const hasEnvCredentials = process.env.SANDBOX_API_KEY && process.env.SANDBOX_API_SECRET;
    
    if (!useThirdParty && !hasEnvCredentials) {
      throw new Error('HSN API not configured. Please configure HSN API credentials in company settings or environment variables.');
    }

    try {
      const apiClient = createApiClientFromCompany(company);
      const results = await apiClient.searchHSN(query, filters);
      
      return results.data || results || [];
    } catch (error) {
      logger.error('HSN API search error:', error);
      throw new Error(`HSN API search failed: ${error.message}`);
    }
  }

  /**
   * Get HSN code details using third-party API only
   */
  async getByCode(ctx, code) {
    const { company } = ctx;
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.hsn_api?.applicable && compliance.hsn_api?.api_key;
    const hasEnvCredentials = process.env.SANDBOX_API_KEY && process.env.SANDBOX_API_SECRET;
    
    if (!useThirdParty && !hasEnvCredentials) {
      throw new Error('HSN API not configured. Please configure HSN API credentials in company settings or environment variables.');
    }

    try {
      const apiClient = createApiClientFromCompany(company);
      const result = await apiClient.getHSNByCode(code);
      
      if (!result || !result.code) {
        throw new Error('HSN/SAC code not found');
      }
      
      return result;
    } catch (error) {
      logger.error('HSN API getByCode error:', error);
      if (error.message === 'HSN/SAC code not found') {
        throw error;
      }
      throw new Error(`HSN API lookup failed: ${error.message}`);
    }
  }

  /**
   * Validate HSN code using third-party API only
   */
  async validate(ctx, code) {
    const { company } = ctx;
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.hsn_api?.applicable && compliance.hsn_api?.api_key;
    const hasEnvCredentials = process.env.SANDBOX_API_KEY && process.env.SANDBOX_API_SECRET;
    
    if (!useThirdParty && !hasEnvCredentials) {
      return {
        valid: false,
        code,
        message: 'HSN API not configured. Please configure HSN API credentials in company settings or environment variables.',
        details: null,
      };
    }

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
      logger.error('HSN API validation error:', error);
      return {
        valid: false,
        code,
        message: `HSN validation failed: ${error.message}`,
        details: null,
      };
    }
  }

  /**
   * Check if HSN API is configured for the company
   */
  isConfigured(company) {
    const compliance = company?.compliance || {};
    const hasCompanyConfig = compliance.hsn_api?.applicable && compliance.hsn_api?.api_key;
    const hasEnvCredentials = process.env.SANDBOX_API_KEY && process.env.SANDBOX_API_SECRET;
    return hasCompanyConfig || hasEnvCredentials;
  }

  /**
   * Get HSN API configuration status
   */
  getConfigStatus(company) {
    const compliance = company?.compliance || {};
    const hasEnvCredentials = process.env.SANDBOX_API_KEY && process.env.SANDBOX_API_SECRET;
    return {
      configured: this.isConfigured(company),
      applicable: compliance.hsn_api?.applicable || false,
      hasApiKey: !!(compliance.hsn_api?.api_key),
      hasEnvCredentials: hasEnvCredentials,
      provider: compliance.hsn_api?.provider || 'sandbox',
    };
  }
}

module.exports = new HSNApiService();
