const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Third-Party API Client
 * Handles integration with Sandbox API for HSN, GST, E-Invoice, E-Way Bill, and TDS
 * Uses Sandbox as the only provider for all tax compliance services
 * 
 * Provider: Sandbox (https://api.sandbox.co.in)
 * - Comprehensive tax compliance platform
 * - Single API key for all services
 * - E-Invoice, E-Way Bill, HSN, GST, TDS APIs
 */
class ThirdPartyApiClient {
  constructor(config = {}) {
    this.config = config;
    this.providers = {
      einvoice: config.einvoice || {},
      ewaybill: config.ewaybill || {},
      hsn: config.hsn || {},
      gst: config.gst || {},
      tds: config.tds || {},
      income_tax: config.income_tax || {},
      finbox: config.finbox || {},
    };
  }

  /**
   * Get authentication token for a service
   */
  async getAuthToken(service, provider = 'default') {
    const serviceConfig = this.providers[service]?.[provider];
    if (!serviceConfig) {
      throw new Error(`No configuration found for ${service} service`);
    }

    const { base_url, username, password, client_id, client_secret, api_key, auth_endpoint } = serviceConfig;

    try {
      // For API key based services (HSN, GST)
      if (api_key) {
        return api_key;
      }

      // Different providers may have different auth mechanisms
      if (auth_endpoint) {
        const authPayload = {
          username,
          password,
          ...(client_id && client_secret ? { client_id, client_secret } : {}),
        };

        const response = await axios.post(`${base_url}${auth_endpoint}`, authPayload, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });

        return response.data?.access_token || response.data?.token || response.data;
      }

      // Fallback: return basic auth credentials
      return { username, password, client_id, client_secret };
    } catch (error) {
      logger.error(`Failed to get auth token for ${service}:`, error);
      throw new Error(`Authentication failed for ${service}: ${error.message}`);
    }
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(service, endpoint, method = 'GET', data = null, provider = 'default') {
    const serviceConfig = this.providers[service]?.[provider];
    if (!serviceConfig) {
      throw new Error(`No configuration found for ${service} service`);
    }

    const { base_url, api_key } = serviceConfig;
    const token = await this.getAuthToken(service, provider);

    // Sandbox uses Authorization header with API key
    const isSandbox = base_url?.includes('sandbox.co.in') || base_url?.includes('api.sandbox.co.in');
    // FinBox uses x-api-key header
    const isFinBox = base_url?.includes('finbox.in') || service === 'finbox';
    
    const config = {
      method,
      url: `${base_url}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(isFinBox && api_key
          ? { 'x-api-key': api_key }
          : isSandbox && api_key
          ? { Authorization: `Bearer ${api_key}` }
          : api_key || (typeof token === 'string' && token.length > 50)
            ? { 'X-API-Key': api_key || token, Authorization: `Bearer ${token}` }
            : typeof token === 'string' 
              ? { Authorization: `Bearer ${token}` }
              : token?.access_token 
                ? { Authorization: `Bearer ${token.access_token}` }
                : {}),
      },
      timeout: 30000,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error(`API request failed for ${service} ${endpoint}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        `API request failed: ${error.message}`
      );
    }
  }

  /**
   * E-Invoice API Methods
   * Provider: Sandbox only
   */
  async generateIRN(invoiceData, provider = 'sandbox') {
    const endpoint = '/api/v1/gst/compliance/e-invoice';
    return this.makeRequest('einvoice', endpoint, 'POST', invoiceData, provider);
  }

  async cancelIRN(irn, reason, provider = 'sandbox') {
    const endpoint = `/api/v1/gst/compliance/e-invoice/${irn}/cancel`;
    const payload = { cancel_reason: reason };
    return this.makeRequest('einvoice', endpoint, 'POST', payload, provider);
  }

  async getIRNStatus(irn, provider = 'sandbox') {
    const endpoint = `/api/v1/gst/compliance/e-invoice/${irn}`;
    return this.makeRequest('einvoice', endpoint, 'GET', null, provider);
  }

  /**
   * E-Way Bill API Methods
   * Provider: Sandbox only
   */
  async generateEWayBill(ewayBillData, provider = 'sandbox') {
    const endpoint = '/api/v1/gst/compliance/e-way-bill';
    return this.makeRequest('ewaybill', endpoint, 'POST', ewayBillData, provider);
  }

  async cancelEWayBill(ewayBillNo, reason, provider = 'sandbox') {
    const endpoint = `/api/v1/gst/compliance/e-way-bill/${ewayBillNo}/cancel`;
    const payload = { cancel_reason: reason };
    return this.makeRequest('ewaybill', endpoint, 'POST', payload, provider);
  }

  async getEWayBillStatus(ewayBillNo, provider = 'sandbox') {
    const endpoint = `/api/v1/gst/compliance/e-way-bill/${ewayBillNo}`;
    return this.makeRequest('ewaybill', endpoint, 'GET', null, provider);
  }

  async updateEWayBill(ewayBillNo, updateData, provider = 'sandbox') {
    const endpoint = `/api/v1/gst/compliance/e-way-bill/${ewayBillNo}`;
    return this.makeRequest('ewaybill', endpoint, 'PUT', updateData, provider);
  }

  async extendEWayBill(ewayBillNo, extendData, provider = 'sandbox') {
    const endpoint = `/api/v1/gst/compliance/e-way-bill/${ewayBillNo}/extend`;
    return this.makeRequest('ewaybill', endpoint, 'POST', extendData, provider);
  }

  /**
   * HSN API Methods
   * Provider: Sandbox only
   */
  async searchHSN(query, filters = {}, provider = 'sandbox') {
    const endpoint = '/api/v1/gst/tax-lookup/hsn/search';
    return this.makeRequest('hsn', endpoint, 'POST', { query, ...filters }, provider);
  }

  async getHSNByCode(code, provider = 'sandbox') {
    const endpoint = `/api/v1/gst/tax-lookup/hsn/${code}`;
    return this.makeRequest('hsn', endpoint, 'GET', null, provider);
  }

  async validateHSN(code, provider = 'sandbox') {
    const endpoint = `/api/v1/gst/tax-lookup/hsn/${code}/validate`;
    return this.makeRequest('hsn', endpoint, 'GET', null, provider);
  }

  /**
   * GST API Methods
   * Provider: Sandbox only
   */
  async validateGSTIN(gstin, provider = 'sandbox') {
    const endpoint = '/api/v1/gst/kyc/gstin/validate';
    return this.makeRequest('gst', endpoint, 'POST', { gstin }, provider);
  }

  async getGSTINDetails(gstin, provider = 'sandbox') {
    const endpoint = `/api/v1/gst/kyc/gstin/${gstin}`;
    return this.makeRequest('gst', endpoint, 'GET', null, provider);
  }

  async getGSTRate(hsnCode, state, provider = 'sandbox') {
    const endpoint = '/api/v1/gst/tax-lookup/rate';
    return this.makeRequest('gst', endpoint, 'POST', { hsn_code: hsnCode, state }, provider);
  }

  async generateGSTR1(gstr1Data, provider = 'sandbox') {
    const endpoint = '/api/v1/gst/compliance/returns/gstr1';
    return this.makeRequest('gst', endpoint, 'POST', gstr1Data, provider);
  }

  async generateGSTR3B(gstr3bData, provider = 'sandbox') {
    const endpoint = '/api/v1/gst/compliance/returns/gstr3b';
    return this.makeRequest('gst', endpoint, 'POST', gstr3bData, provider);
  }

  /**
   * TDS API Methods
   * Provider: Sandbox only
   */
  async prepareTDSReturn(returnData, formType = '24Q', provider = 'sandbox') {
    const endpoint = `/api/v1/tds/returns/${formType}/prepare`;
    return this.makeRequest('tds', endpoint, 'POST', returnData, provider);
  }

  async fileTDSReturn(returnData, formType = '24Q', provider = 'sandbox') {
    const endpoint = `/api/v1/tds/returns/${formType}/file`;
    return this.makeRequest('tds', endpoint, 'POST', returnData, provider);
  }

  async generateForm16A(tdsDetailId, provider = 'sandbox') {
    const endpoint = `/api/v1/tds/certificates/form16a/${tdsDetailId}`;
    return this.makeRequest('tds', endpoint, 'GET', null, provider);
  }

  async getTDSReturnStatus(returnId, formType = '24Q', provider = 'sandbox') {
    const endpoint = `/api/v1/tds/returns/${formType}/${returnId}/status`;
    return this.makeRequest('tds', endpoint, 'GET', null, provider);
  }

  async calculateTDS(paymentData, provider = 'sandbox') {
    const endpoint = '/api/v1/tds/calculate';
    return this.makeRequest('tds', endpoint, 'POST', paymentData, provider);
  }

  /**
   * Income Tax (ITR) API Methods
   * Provider: Sandbox only
   */
  async calculateIncomeTax(taxData, provider = 'sandbox') {
    const endpoint = '/api/v1/income-tax/calculate';
    return this.makeRequest('income_tax', endpoint, 'POST', taxData, provider);
  }

  async prepareITR(itrData, formType = 'ITR-1', provider = 'sandbox') {
    const endpoint = `/api/v1/income-tax/itr/${formType}/prepare`;
    return this.makeRequest('income_tax', endpoint, 'POST', itrData, provider);
  }

  async fileITR(itrData, formType = 'ITR-1', provider = 'sandbox') {
    const endpoint = `/api/v1/income-tax/itr/${formType}/file`;
    return this.makeRequest('income_tax', endpoint, 'POST', itrData, provider);
  }

  async getITRStatus(returnId, formType = 'ITR-1', provider = 'sandbox') {
    const endpoint = `/api/v1/income-tax/itr/${formType}/${returnId}/status`;
    return this.makeRequest('income_tax', endpoint, 'GET', null, provider);
  }

  async getForm26AS(pan, financialYear, provider = 'sandbox') {
    const endpoint = `/api/v1/income-tax/form26as/${pan}`;
    return this.makeRequest('income_tax', endpoint, 'POST', { financial_year: financialYear }, provider);
  }

  async parseForm16(form16Data, provider = 'sandbox') {
    const endpoint = '/api/v1/income-tax/form16/parse';
    return this.makeRequest('income_tax', endpoint, 'POST', form16Data, provider);
  }

  /**
   * FinBox API Methods
   * Provider: FinBox (https://insights.finbox.in, https://api.finbox.in)
   * - Credit scoring and loan eligibility
   * - Bank statement analysis
   * - Device intelligence
   */
  
  /**
   * DeviceConnect: Get device insights for credit assessment
   * Uses insights.finbox.in as base URL (different from main API)
   */
  async getDeviceInsights(customerId, version, salt, provider = 'finbox') {
    const serviceConfig = this.providers.finbox?.[provider];
    if (!serviceConfig) {
      throw new Error('No configuration found for finbox service');
    }

    // DeviceConnect uses insights.finbox.in, not api.finbox.in
    const insightsBaseUrl = serviceConfig.insights_base_url || 
                           serviceConfig.base_url?.replace('api.finbox.in', 'insights.finbox.in') ||
                           'https://insights.finbox.in';
    
    const endpoint = '/v2/risk/predictors';
    const payload = {
      customer_id: customerId,
      version: version,
      salt: salt,
    };

    const { api_key } = serviceConfig;
    const config = {
      method: 'POST',
      url: `${insightsBaseUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(api_key ? { 'x-api-key': api_key } : {}),
      },
      data: payload,
      timeout: 30000,
    };

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error(`DeviceConnect API request failed:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        `DeviceConnect API request failed: ${error.message}`
      );
    }
  }

  /**
   * BankConnect: Initiate bank statement collection
   */
  async initiateBankConnect(customerId, bankData, provider = 'finbox') {
    const endpoint = '/v1/bank-connect/initiate';
    const payload = {
      customer_id: customerId,
      ...bankData,
    };
    return this.makeRequest('finbox', endpoint, 'POST', payload, provider);
  }

  /**
   * BankConnect: Get bank statement status
   */
  async getBankConnectStatus(customerId, provider = 'finbox') {
    const endpoint = `/v1/bank-connect/${customerId}/status`;
    return this.makeRequest('finbox', endpoint, 'GET', null, provider);
  }

  /**
   * BankConnect: Get analyzed bank statement data
   */
  async getBankStatementAnalysis(customerId, provider = 'finbox') {
    const endpoint = `/v1/bank-connect/${customerId}/analysis`;
    return this.makeRequest('finbox', endpoint, 'GET', null, provider);
  }

  /**
   * Sourcing API: Create user in FinBox system
   */
  async createFinBoxUser(customerId, userData, provider = 'finbox') {
    const endpoint = '/v1/user';
    const payload = {
      customer_id: customerId,
      ...userData,
    };
    return this.makeRequest('finbox', endpoint, 'POST', payload, provider);
  }

  /**
   * Sourcing API: Get loan eligibility
   */
  async getLoanEligibility(customerId, loanData = {}, provider = 'finbox') {
    const endpoint = `/v1/user/${customerId}/eligibility`;
    return this.makeRequest('finbox', endpoint, 'POST', loanData, provider);
  }

  /**
   * Sourcing API: Generate session token for SDK
   */
  async generateSessionToken(customerId, sessionData = {}, provider = 'finbox') {
    const endpoint = `/v1/user/${customerId}/session`;
    return this.makeRequest('finbox', endpoint, 'POST', sessionData, provider);
  }

  /**
   * Credit Score: Get credit score from bureau
   */
  async getCreditScore(customerId, pan, provider = 'finbox') {
    const endpoint = '/v1/credit-score';
    const payload = {
      customer_id: customerId,
      pan: pan,
    };
    return this.makeRequest('finbox', endpoint, 'POST', payload, provider);
  }

  /**
   * Credit Score: Get FinBox Inclusion Score (FIS)
   */
  async getFinBoxInclusionScore(customerId, provider = 'finbox') {
    const endpoint = `/v1/credit-score/${customerId}/fis`;
    return this.makeRequest('finbox', endpoint, 'GET', null, provider);
  }
}

/**
 * Factory function to create API client from company compliance config
 * 
 * Provider: Sandbox only (https://api.sandbox.co.in)
 * - All services use Sandbox as the only provider
 * - Single API key for all tax compliance services
 * - E-Invoice, E-Way Bill, HSN, GST, TDS, Income Tax (ITR) APIs
 */
function createApiClientFromCompany(company) {
  const compliance = company?.compliance || {};
  
  // Force Sandbox provider for all services
  const provider = 'sandbox';
  const sandboxBaseUrl = 'https://api.sandbox.co.in';
  
  const config = {
    einvoice: {
      [provider]: compliance.e_invoice?.applicable ? {
        base_url: compliance.e_invoice.base_url || process.env.EINVOICE_API_URL || sandboxBaseUrl,
        api_key: compliance.e_invoice.api_key,
        provider: provider,
      } : null,
    },
    ewaybill: {
      [provider]: compliance.e_way_bill?.applicable ? {
        base_url: compliance.e_way_bill.base_url || process.env.EWAYBILL_API_URL || sandboxBaseUrl,
        api_key: compliance.e_way_bill.api_key,
        provider: provider,
      } : null,
    },
    hsn: {
      [provider]: compliance.hsn_api?.applicable && compliance.hsn_api?.api_key ? {
        base_url: compliance.hsn_api.base_url || process.env.HSN_API_URL || sandboxBaseUrl,
        api_key: compliance.hsn_api.api_key,
        provider: provider,
      } : null,
    },
    gst: {
      [provider]: compliance.gst_api?.applicable && compliance.gst_api?.api_key ? {
        base_url: compliance.gst_api.base_url || process.env.GST_API_URL || sandboxBaseUrl,
        api_key: compliance.gst_api.api_key,
        provider: provider,
      } : null,
    },
    tds: {
      [provider]: compliance.tds_api?.applicable && compliance.tds_api?.api_key ? {
        base_url: compliance.tds_api.base_url || process.env.TDS_API_URL || sandboxBaseUrl,
        api_key: compliance.tds_api.api_key,
        provider: provider,
      } : null,
    },
    income_tax: {
      [provider]: compliance.income_tax_api?.applicable && compliance.income_tax_api?.api_key ? {
        base_url: compliance.income_tax_api.base_url || process.env.INCOME_TAX_API_URL || sandboxBaseUrl,
        api_key: compliance.income_tax_api.api_key,
        provider: provider,
      } : null,
    },
    finbox: {
      [provider]: compliance.finbox_api?.applicable && compliance.finbox_api?.api_key ? {
        base_url: compliance.finbox_api.base_url || process.env.FINBOX_API_URL || 'https://api.finbox.in',
        insights_base_url: compliance.finbox_api.insights_base_url || process.env.FINBOX_INSIGHTS_API_URL || 'https://insights.finbox.in',
        api_key: compliance.finbox_api.api_key,
        server_hash: compliance.finbox_api.server_hash || null,
        provider: provider,
      } : null,
    },
  };

  return new ThirdPartyApiClient(config);
}

module.exports = {
  ThirdPartyApiClient,
  createApiClientFromCompany,
};
