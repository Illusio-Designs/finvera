const { createApiClientFromCompany } = require('./thirdPartyApiClient');
const logger = require('../utils/logger');

/**
 * GST API Service
 * Provides third-party API integration for GSTIN validation, GST rate lookup, and GST return generation
 */
class GSTApiService {
  /**
   * Validate GSTIN using third-party API
   */
  async validateGSTIN(ctx, gstin) {
    const { company } = ctx;
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.gst_api?.applicable && compliance.gst_api?.api_key;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        const result = await apiClient.validateGSTIN(gstin);
        return {
          valid: result.valid !== false,
          gstin: result.gstin || gstin,
          legalName: result.legalName || result.legal_name || null,
          tradeName: result.tradeName || result.trade_name || null,
          status: result.status || 'active',
          registrationDate: result.registrationDate || result.registration_date || null,
          address: result.address || null,
          state: result.state || null,
          stateCode: result.stateCode || result.state_code || null,
          message: result.message || 'GSTIN is valid',
          details: result,
        };
      } catch (error) {
        logger.error('Third-party GST validation API error:', error);
        // Fall through to basic validation
      }
    }

    // Fallback to basic format validation
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return {
      valid: gstinRegex.test(gstin),
      gstin,
      message: gstinRegex.test(gstin) ? 'GSTIN format is valid' : 'Invalid GSTIN format',
      details: null,
    };
  }

  /**
   * Get GSTIN details using third-party API
   */
  async getGSTINDetails(ctx, gstin) {
    const { company } = ctx;
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.gst_api?.applicable && compliance.gst_api?.api_key;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        const result = await apiClient.getGSTINDetails(gstin);
        return {
          gstin: result.gstin || gstin,
          legalName: result.legalName || result.legal_name || null,
          tradeName: result.tradeName || result.trade_name || null,
          status: result.status || 'active',
          registrationDate: result.registrationDate || result.registration_date || null,
          address: result.address || null,
          city: result.city || null,
          state: result.state || null,
          stateCode: result.stateCode || result.state_code || null,
          pincode: result.pincode || result.pin_code || null,
          businessType: result.businessType || result.business_type || null,
          details: result,
        };
      } catch (error) {
        logger.error('Third-party GST details API error:', error);
        throw new Error(`Failed to fetch GSTIN details: ${error.message}`);
      }
    }

    throw new Error('GST API not configured');
  }

  /**
   * Get GST rate for HSN code using third-party API
   */
  async getGSTRate(ctx, hsnCode, state = null) {
    const { company } = ctx;
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.gst_api?.applicable && compliance.gst_api?.api_key;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        const result = await apiClient.getGSTRate(hsnCode, state);
        return {
          hsnCode: result.hsnCode || result.hsn_code || hsnCode,
          cgstRate: result.cgstRate || result.cgst_rate || 0,
          sgstRate: result.sgstRate || result.sgst_rate || 0,
          igstRate: result.igstRate || result.igst_rate || 0,
          cessRate: result.cessRate || result.cess_rate || 0,
          effectiveFrom: result.effectiveFrom || result.effective_from || null,
          effectiveTo: result.effectiveTo || result.effective_to || null,
          details: result,
        };
      } catch (error) {
        logger.error('Third-party GST rate API error:', error);
        // Fall through to local lookup
      }
    }

    // Fallback to local lookup (from master database)
    const { Op } = require('sequelize');
    const masterModels = require('../models/masterModels');
    
    const hsn = await masterModels.HSNSAC.findByPk(hsnCode);
    if (hsn && hsn.gst_rate) {
      const rate = parseFloat(hsn.gst_rate);
      return {
        hsnCode,
        cgstRate: state ? rate / 2 : 0,
        sgstRate: state ? rate / 2 : 0,
        igstRate: state ? 0 : rate,
        cessRate: parseFloat(hsn.cess_rate || 0),
        effectiveFrom: hsn.effective_from,
        effectiveTo: null,
        details: hsn,
      };
    }

    throw new Error('GST rate not found for HSN code');
  }

  /**
   * Generate GSTR-1 using third-party API
   */
  async generateGSTR1(ctx, gstr1Data) {
    const { company } = ctx;
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.gst_api?.applicable && compliance.gst_api?.api_key;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        const result = await apiClient.generateGSTR1(gstr1Data);
        return {
          success: true,
          returnId: result.returnId || result.return_id || null,
          status: result.status || 'generated',
          data: result.data || result,
          message: result.message || 'GSTR-1 generated successfully',
        };
      } catch (error) {
        logger.error('Third-party GSTR-1 API error:', error);
        throw new Error(`Failed to generate GSTR-1: ${error.message}`);
      }
    }

    throw new Error('GST API not configured');
  }

  /**
   * Generate GSTR-3B using third-party API
   */
  async generateGSTR3B(ctx, gstr3bData) {
    const { company } = ctx;
    const compliance = company?.compliance || {};
    const useThirdParty = compliance.gst_api?.applicable && compliance.gst_api?.api_key;

    if (useThirdParty) {
      try {
        const apiClient = createApiClientFromCompany(company);
        const result = await apiClient.generateGSTR3B(gstr3bData);
        return {
          success: true,
          returnId: result.returnId || result.return_id || null,
          status: result.status || 'generated',
          data: result.data || result,
          message: result.message || 'GSTR-3B generated successfully',
        };
      } catch (error) {
        logger.error('Third-party GSTR-3B API error:', error);
        throw new Error(`Failed to generate GSTR-3B: ${error.message}`);
      }
    }

    throw new Error('GST API not configured');
  }
}

module.exports = new GSTApiService();
