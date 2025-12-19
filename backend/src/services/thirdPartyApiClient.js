const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Third-Party API Client
 * Handles integration with external APIs for HSN, GST, E-Invoice, E-Way Bill, and TDS
 * Supports multiple providers with a unified interface
 * 
 * Supported Providers:
 * - E-Invoice: NIC (official), Sandbox, FastGST, ClearTax
 * - E-Way Bill: NIC (official), Sandbox, FastGST
 * - HSN: Sandbox, FastGST, GST Portal
 * - GST: Sandbox, FastGST, ClearTax
 * - TDS: Sandbox (comprehensive TDS compliance APIs)
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
    
    const config = {
      method,
      url: `${base_url}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(isSandbox && api_key
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
   * Provider: 'nic' (NIC - official), 'sandbox', 'gstzen', 'gstrobo', 'mygstcafe', 'cleartax'
   * Note: FastGST does NOT provide e-invoice APIs
   */
  async generateIRN(invoiceData, provider = 'default') {
    // Provider-specific endpoint mapping
    const endpoints = {
      nic: '/api/v1/invoice/generate',
      sandbox: '/api/v1/gst/compliance/e-invoice',
      gstzen: '/api/v1/einvoice/generate',
      gstrobo: '/api/v1/einvoice/generate',
      mygstcafe: '/api/v1/einvoice/generate',
      cleartax: '/v1/einvoice/generate',
      default: '/api/v1/invoice/generate',
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('einvoice', endpoint, 'POST', invoiceData, provider);
  }

  async cancelIRN(irn, reason, provider = 'default') {
    const endpoints = {
      nic: '/api/v1/invoice/cancel',
      sandbox: `/api/v1/gst/compliance/e-invoice/${irn}/cancel`,
      gstzen: '/api/v1/einvoice/cancel',
      gstrobo: '/api/v1/einvoice/cancel',
      mygstcafe: '/api/v1/einvoice/cancel',
      cleartax: '/v1/einvoice/cancel',
      default: '/api/v1/invoice/cancel',
    };
    const endpoint = endpoints[provider] || endpoints.default;
    const payload = provider === 'sandbox' ? { cancel_reason: reason } : { irn, reason };
    return this.makeRequest('einvoice', endpoint, 'POST', payload, provider);
  }

  async getIRNStatus(irn, provider = 'default') {
    const endpoints = {
      nic: `/api/v1/invoice/status/${irn}`,
      sandbox: `/api/v1/gst/compliance/e-invoice/${irn}`,
      gstzen: `/api/v1/einvoice/status/${irn}`,
      gstrobo: `/api/v1/einvoice/status/${irn}`,
      mygstcafe: `/api/v1/einvoice/status/${irn}`,
      cleartax: `/v1/einvoice/status/${irn}`,
      default: `/api/v1/invoice/status/${irn}`,
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('einvoice', endpoint, 'GET', null, provider);
  }

  /**
   * E-Way Bill API Methods
   * Provider: 'nic' (NIC - official), 'sandbox', 'gstzen', 'gstrobo', 'mygstcafe'
   * Note: FastGST does NOT provide e-way bill APIs
   */
  async generateEWayBill(ewayBillData, provider = 'default') {
    const endpoints = {
      nic: '/api/v1/ewaybill/generate',
      sandbox: '/api/v1/gst/compliance/e-way-bill',
      gstzen: '/api/v1/ewaybill/generate',
      gstrobo: '/api/v1/ewaybill/generate',
      mygstcafe: '/api/v1/ewaybill/generate',
      default: '/api/v1/ewaybill/generate',
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('ewaybill', endpoint, 'POST', ewayBillData, provider);
  }

  async cancelEWayBill(ewayBillNo, reason, provider = 'default') {
    const endpoints = {
      nic: '/api/v1/ewaybill/cancel',
      sandbox: `/api/v1/gst/compliance/e-way-bill/${ewayBillNo}/cancel`,
      gstzen: '/api/v1/ewaybill/cancel',
      gstrobo: '/api/v1/ewaybill/cancel',
      mygstcafe: '/api/v1/ewaybill/cancel',
      default: '/api/v1/ewaybill/cancel',
    };
    const endpoint = endpoints[provider] || endpoints.default;
    const payload = provider === 'sandbox' ? { cancel_reason: reason } : { eway_bill_no: ewayBillNo, reason };
    return this.makeRequest('ewaybill', endpoint, 'POST', payload, provider);
  }

  async getEWayBillStatus(ewayBillNo, provider = 'default') {
    const endpoints = {
      nic: `/api/v1/ewaybill/status/${ewayBillNo}`,
      sandbox: `/api/v1/gst/compliance/e-way-bill/${ewayBillNo}`,
      gstzen: `/api/v1/ewaybill/status/${ewayBillNo}`,
      gstrobo: `/api/v1/ewaybill/status/${ewayBillNo}`,
      mygstcafe: `/api/v1/ewaybill/status/${ewayBillNo}`,
      default: `/api/v1/ewaybill/status/${ewayBillNo}`,
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('ewaybill', endpoint, 'GET', null, provider);
  }

  async updateEWayBill(ewayBillNo, updateData, provider = 'default') {
    const endpoints = {
      sandbox: `/api/v1/gst/compliance/e-way-bill/${ewayBillNo}`,
      default: `/api/v1/ewaybill/update/${ewayBillNo}`,
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('ewaybill', endpoint, 'PUT', updateData, provider);
  }

  async extendEWayBill(ewayBillNo, extendData, provider = 'default') {
    const endpoints = {
      sandbox: `/api/v1/gst/compliance/e-way-bill/${ewayBillNo}/extend`,
      default: `/api/v1/ewaybill/extend/${ewayBillNo}`,
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('ewaybill', endpoint, 'POST', extendData, provider);
  }

  /**
   * HSN API Methods
   * Provider: 'sandbox', 'fastgst' (Tax Lookup API), 'gst_portal'
   * Sandbox and FastGST provide comprehensive HSN/SAC lookup
   */
  async searchHSN(query, filters = {}, provider = 'default') {
    const endpoints = {
      sandbox: '/api/v1/gst/tax-lookup/hsn/search',
      fastgst: '/api/v1/tax-lookup/search', // FastGST Tax Lookup API
      gst_portal: '/services/hsn/search',
      default: '/api/v1/tax-lookup/search',
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('hsn', endpoint, 'POST', { query, ...filters }, provider);
  }

  async getHSNByCode(code, provider = 'default') {
    const endpoints = {
      sandbox: `/api/v1/gst/tax-lookup/hsn/${code}`,
      fastgst: `/api/v1/tax-lookup/hsn/${code}`, // FastGST Tax Lookup API
      gst_portal: `/services/hsn/${code}`,
      default: `/api/v1/tax-lookup/hsn/${code}`,
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('hsn', endpoint, 'GET', null, provider);
  }

  async validateHSN(code, provider = 'default') {
    const endpoints = {
      sandbox: `/api/v1/gst/tax-lookup/hsn/${code}/validate`,
      fastgst: `/api/v1/tax-lookup/validate/${code}`, // FastGST Tax Lookup API
      gst_portal: `/services/hsn/validate/${code}`,
      default: `/api/v1/tax-lookup/validate/${code}`,
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('hsn', endpoint, 'GET', null, provider);
  }

  /**
   * GST API Methods
   * Provider: 'sandbox', 'gstzen' (default - provides all GST services), 'gstrobo', 'cleartax'
   * Sandbox and GSTZen provide: GSTIN validation, GST returns (GSTR-1, GSTR-3B), GST rate lookup
   */
  async validateGSTIN(gstin, provider = 'default') {
    const endpoints = {
      sandbox: '/api/v1/gst/kyc/gstin/validate',
      gstzen: '/api/v1/gst/validate',
      gstrobo: '/api/v1/gst/validate',
      cleartax: '/v1/gst/validate',
      default: '/api/v1/gst/validate', // Default to GSTZen
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('gst', endpoint, 'POST', { gstin }, provider);
  }

  async getGSTINDetails(gstin, provider = 'default') {
    const endpoints = {
      sandbox: `/api/v1/gst/kyc/gstin/${gstin}`,
      gstzen: '/api/v1/gst/details',
      gstrobo: '/api/v1/gst/details',
      cleartax: '/v1/gst/details',
      default: '/api/v1/gst/details', // Default to GSTZen
    };
    const endpoint = endpoints[provider] || endpoints.default;
    const finalEndpoint = provider === 'sandbox' ? endpoint : `${endpoint}/${gstin}`;
    return this.makeRequest('gst', finalEndpoint, 'GET', null, provider);
  }

  async getGSTRate(hsnCode, state, provider = 'default') {
    const endpoints = {
      sandbox: '/api/v1/gst/tax-lookup/rate',
      gstzen: '/api/v1/gst/rate',
      gstrobo: '/api/v1/gst/rate',
      cleartax: '/v1/gst/rate',
      default: '/api/v1/gst/rate', // Default to GSTZen
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('gst', endpoint, 'POST', { hsn_code: hsnCode, state }, provider);
  }

  async generateGSTR1(gstr1Data, provider = 'default') {
    const endpoints = {
      gstzen: '/api/v1/gst/returns/gstr1',
      gstrobo: '/api/v1/gst/returns/gstr1',
      cleartax: '/v1/gst/returns/gstr1',
      default: '/api/v1/gst/returns/gstr1', // Default to GSTZen
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('gst', endpoint, 'POST', gstr1Data, provider);
  }

  async generateGSTR3B(gstr3bData, provider = 'default') {
    const endpoints = {
      sandbox: '/api/v1/gst/compliance/returns/gstr3b',
      gstzen: '/api/v1/gst/returns/gstr3b',
      gstrobo: '/api/v1/gst/returns/gstr3b',
      cleartax: '/v1/gst/returns/gstr3b',
      default: '/api/v1/gst/returns/gstr3b', // Default to GSTZen
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('gst', endpoint, 'POST', gstr3bData, provider);
  }

  /**
   * TDS API Methods
   * Provider: 'sandbox' (comprehensive TDS compliance)
   * Sandbox provides: TDS return preparation, filing, Form 16A generation
   */
  async prepareTDSReturn(returnData, formType = '24Q', provider = 'default') {
    const endpoints = {
      sandbox: `/api/v1/tds/returns/${formType}/prepare`,
      default: `/api/v1/tds/returns/${formType}/prepare`,
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('tds', endpoint, 'POST', returnData, provider);
  }

  async fileTDSReturn(returnData, formType = '24Q', provider = 'default') {
    const endpoints = {
      sandbox: `/api/v1/tds/returns/${formType}/file`,
      default: `/api/v1/tds/returns/${formType}/file`,
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('tds', endpoint, 'POST', returnData, provider);
  }

  async generateForm16A(tdsDetailId, provider = 'default') {
    const endpoints = {
      sandbox: `/api/v1/tds/certificates/form16a/${tdsDetailId}`,
      default: `/api/v1/tds/certificates/form16a/${tdsDetailId}`,
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('tds', endpoint, 'GET', null, provider);
  }

  async getTDSReturnStatus(returnId, formType = '24Q', provider = 'default') {
    const endpoints = {
      sandbox: `/api/v1/tds/returns/${formType}/${returnId}/status`,
      default: `/api/v1/tds/returns/${formType}/${returnId}/status`,
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('tds', endpoint, 'GET', null, provider);
  }

  async calculateTDS(paymentData, provider = 'default') {
    const endpoints = {
      sandbox: '/api/v1/tds/calculate',
      default: '/api/v1/tds/calculate',
    };
    const endpoint = endpoints[provider] || endpoints.default;
    return this.makeRequest('tds', endpoint, 'POST', paymentData, provider);
  }
}

/**
 * Factory function to create API client from company compliance config
 * 
 * Provider Selection:
 * - If provider is specified in config, uses that provider
 * - Otherwise uses 'default' provider (GSTZen for GST/E-Invoice/E-Way Bill, FastGST for HSN)
 * - Supports multiple providers: 'sandbox', 'gstzen', 'nic', 'gstrobo', 'cleartax', 'fastgst'
 * 
 * Default Providers:
 * - GST API: GSTZen (provides GSTIN validation, GST returns)
 * - E-Invoice: GSTZen
 * - E-Way Bill: GSTZen
 * - HSN API: FastGST (for HSN/SAC lookup)
 * - TDS API: Sandbox (comprehensive TDS compliance)
 * 
 * Note: Sandbox is recommended for comprehensive tax compliance as it provides all services
 * including TDS, GST, E-Invoice, E-Way Bill, and HSN lookup in a single platform.
 */
function createApiClientFromCompany(company) {
  const compliance = company?.compliance || {};
  
  // Helper to get provider name or default
  const getProvider = (serviceConfig) => serviceConfig?.provider || 'default';
  
  const einvoiceProvider = getProvider(compliance.e_invoice);
  const ewaybillProvider = getProvider(compliance.e_way_bill);
  const hsnProvider = getProvider(compliance.hsn_api);
  const gstProvider = getProvider(compliance.gst_api);
  const tdsProvider = getProvider(compliance.tds_api);
  
  const config = {
    einvoice: {
      [einvoiceProvider]: compliance.e_invoice?.applicable ? {
        base_url: compliance.e_invoice.base_url || process.env.EINVOICE_API_URL || 'https://api.gstzen.in',
        username: compliance.e_invoice.username,
        password: compliance.e_invoice.password,
        client_id: compliance.e_invoice.client_id,
        client_secret: compliance.e_invoice.client_secret,
        api_key: compliance.e_invoice.api_key, // For API key based providers (Sandbox, GSTZen use API key)
        auth_endpoint: compliance.e_invoice.auth_endpoint || '/api/v1/auth/login',
        provider: compliance.e_invoice.provider || 'gstzen', // Default to GSTZen
      } : null,
    },
    ewaybill: {
      [ewaybillProvider]: compliance.e_way_bill?.applicable ? {
        base_url: compliance.e_way_bill.base_url || process.env.EWAYBILL_API_URL || 'https://api.gstzen.in',
        username: compliance.e_way_bill.username,
        password: compliance.e_way_bill.password,
        client_id: compliance.e_way_bill.client_id,
        client_secret: compliance.e_way_bill.client_secret,
        api_key: compliance.e_way_bill.api_key, // For API key based providers (Sandbox, GSTZen use API key)
        auth_endpoint: compliance.e_way_bill.auth_endpoint || '/api/v1/auth/login',
        provider: compliance.e_way_bill.provider || 'gstzen', // Default to GSTZen
      } : null,
    },
    hsn: {
      [hsnProvider]: compliance.hsn_api?.applicable && compliance.hsn_api?.api_key ? {
        base_url: compliance.hsn_api.base_url || process.env.HSN_API_URL || 'https://api.fastgst.in',
        api_key: compliance.hsn_api.api_key,
        auth_endpoint: compliance.hsn_api.auth_endpoint || null,
        provider: compliance.hsn_api.provider || 'fastgst',
      } : null,
    },
    gst: {
      [gstProvider]: compliance.gst_api?.applicable && compliance.gst_api?.api_key ? {
        base_url: compliance.gst_api.base_url || process.env.GST_API_URL || 'https://api.gstzen.in',
        api_key: compliance.gst_api.api_key,
        auth_endpoint: compliance.gst_api.auth_endpoint || null,
        provider: compliance.gst_api.provider || 'gstzen', // Default to GSTZen for GST services
      } : null,
    },
    tds: {
      [tdsProvider]: compliance.tds_api?.applicable && compliance.tds_api?.api_key ? {
        base_url: compliance.tds_api.base_url || process.env.TDS_API_URL || 'https://api.sandbox.co.in',
        api_key: compliance.tds_api.api_key,
        auth_endpoint: compliance.tds_api.auth_endpoint || null,
        provider: compliance.tds_api.provider || 'sandbox', // Default to Sandbox for TDS services
      } : null,
    },
  };

  return new ThirdPartyApiClient(config);
}

module.exports = {
  ThirdPartyApiClient,
  createApiClientFromCompany,
};
