const axios = require('axios');
const logger = require('../utils/logger');

/**
 * E-Way Bill Portal Client
 * Handles authentication and API calls to the Government E-Way Bill Portal
 * Supports both sandbox and production environments
 */
class EWayBillClient {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.EWAY_BILL_BASE_URL || 'https://api.sandbox.co.in',
      apiKey: config.apiKey || process.env.SANDBOX_API_KEY,
      apiSecret: config.apiSecret || process.env.SANDBOX_API_SECRET,
      environment: config.environment || process.env.SANDBOX_ENVIRONMENT || 'test',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      initialDelay: config.initialDelay || 1000,
      maxDelay: config.maxDelay || 30000,
      backoffMultiplier: config.backoffMultiplier || 2,
    };
    
    this.accessToken = null;
    this.tokenExpiry = null;
    this.retryCount = 0;
  }

  /**
   * Authenticate with E-Way Bill portal using OAuth2 client credentials
   * @returns {Promise<string>} Access token
   */
  async authenticate() {
    try {
      const response = await axios.post(`${this.config.baseUrl}/authenticate`, {}, {
        headers: {
          'x-api-key': this.config.apiKey,
          'x-api-secret': this.config.apiSecret,
          'x-api-version': '1.0',
          'Content-Type': 'application/json'
        },
        timeout: this.config.timeout
      });

      if (response.data && response.data.data && response.data.data.access_token) {
        this.accessToken = response.data.data.access_token;
        // Set token expiry (typically 1 hour, but we'll refresh after 50 minutes)
        this.tokenExpiry = new Date(Date.now() + 50 * 60 * 1000);
        
        logger.info('E-Way Bill Portal authentication successful');
        return this.accessToken;
      }
      
      throw new Error('Invalid authentication response from E-Way Bill portal');
    } catch (error) {
      logger.error('E-Way Bill Portal authentication failed:', error.message);
      
      if (error.response?.status === 401) {
        throw new Error(`E-Way Bill authentication failed: Invalid API credentials for ${this.config.environment} environment`);
      }
      
      throw new Error(`E-Way Bill authentication failed: ${error.message}`);
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   * @returns {Promise<string>} Valid access token
   */
  async getAccessToken() {
    if (!this.accessToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      await this.authenticate();
    }
    return this.accessToken;
  }

  /**
   * Calculate exponential backoff delay
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  calculateBackoffDelay(attempt) {
    const delay = Math.min(
      this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt),
      this.config.maxDelay
    );
    return delay;
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make authenticated API request with retry logic
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request payload
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response
   */
  async makeRequest(endpoint, method = 'POST', data = null, options = {}) {
    let lastError;
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const accessToken = await this.getAccessToken();
        
        const config = {
          method,
          url: `${this.config.baseUrl}${endpoint}`,
          headers: {
            'authorization': accessToken,
            'x-api-key': this.config.apiKey,
            'x-api-version': '1.0',
            'Content-Type': 'application/json',
            ...options.headers
          },
          timeout: this.config.timeout,
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          config.data = data;
        }

        const response = await axios(config);
        
        // Reset retry count on success
        this.retryCount = 0;
        
        return response.data;
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except 401 (token expiry)
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 401) {
          logger.error(`E-Way Bill API client error (${error.response.status}):`, error.response?.data);
          throw new Error(
            error.response?.data?.message || 
            error.response?.data?.error || 
            `E-Way Bill API client error: ${error.message}`
          );
        }
        
        // Handle token expiry
        if (error.response?.status === 401) {
          logger.warn('E-Way Bill token expired, clearing cached token');
          this.accessToken = null;
          this.tokenExpiry = null;
          // Continue to retry with new token
        }
        
        // Don't retry on last attempt
        if (attempt === this.config.maxRetries - 1) {
          break;
        }
        
        // Calculate backoff delay
        const delay = this.calculateBackoffDelay(attempt);
        logger.warn(`E-Way Bill API request failed (attempt ${attempt + 1}/${this.config.maxRetries}), retrying in ${delay}ms:`, error.message);
        
        await this.sleep(delay);
      }
    }
    
    // All retries exhausted
    logger.error(`E-Way Bill API request failed after ${this.config.maxRetries} attempts:`, lastError.message);
    throw new Error(
      lastError.response?.data?.message || 
      lastError.response?.data?.error || 
      `E-Way Bill API request failed: ${lastError.message}`
    );
  }

  /**
   * Generate E-Way Bill
   * @param {Object} eWayBillData - E-Way Bill data
   * @returns {Promise<Object>} E-Way Bill response with EWB number
   */
  async generateEWayBill(eWayBillData) {
    try {
      logger.info('Generating E-Way Bill via portal', { 
        docNo: eWayBillData.docNo,
        docDate: eWayBillData.docDate 
      });
      
      const response = await this.makeRequest('/api/v1/gst/compliance/e-way-bill', 'POST', eWayBillData);
      
      logger.info('E-Way Bill generated successfully', { 
        ewbNo: response.ewbNo || response.EwbNo,
        validUpto: response.validUpto 
      });
      
      return response;
    } catch (error) {
      logger.error('E-Way Bill generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Cancel E-Way Bill
   * @param {string} ewbNo - E-Way Bill number
   * @param {string} reason - Cancellation reason code
   * @param {string} remarks - Additional remarks
   * @returns {Promise<Object>} Cancellation response
   */
  async cancelEWayBill(ewbNo, reason, remarks = '') {
    try {
      logger.info('Cancelling E-Way Bill via portal', { ewbNo, reason });
      
      const payload = {
        cancel_reason: reason,
        remarks: remarks
      };
      
      const response = await this.makeRequest(`/api/v1/gst/compliance/e-way-bill/${ewbNo}/cancel`, 'POST', payload);
      
      logger.info('E-Way Bill cancelled successfully', { ewbNo });
      
      return response;
    } catch (error) {
      logger.error('E-Way Bill cancellation failed:', error.message);
      throw error;
    }
  }

  /**
   * Update vehicle details for E-Way Bill
   * @param {string} ewbNo - E-Way Bill number
   * @param {string} vehicleNo - New vehicle number
   * @param {string} reasonCode - Reason for vehicle change
   * @param {string} remarks - Additional remarks
   * @returns {Promise<Object>} Update response
   */
  async updateVehicleDetails(ewbNo, vehicleNo, reasonCode, remarks = '') {
    try {
      logger.info('Updating E-Way Bill vehicle details via portal', { ewbNo, vehicleNo });
      
      const payload = {
        vehicle_no: vehicleNo,
        reason_code: reasonCode,
        remarks: remarks
      };
      
      const response = await this.makeRequest(`/api/v1/gst/compliance/e-way-bill/${ewbNo}/vehicle`, 'PUT', payload);
      
      logger.info('E-Way Bill vehicle details updated successfully', { ewbNo, vehicleNo });
      
      return response;
    } catch (error) {
      logger.error('E-Way Bill vehicle update failed:', error.message);
      throw error;
    }
  }

  /**
   * Get E-Way Bill status
   * @param {string} ewbNo - E-Way Bill number
   * @returns {Promise<Object>} E-Way Bill status
   */
  async getEWayBillStatus(ewbNo) {
    try {
      logger.info('Getting E-Way Bill status via portal', { ewbNo });
      
      const response = await this.makeRequest(`/api/v1/gst/compliance/e-way-bill/${ewbNo}`, 'GET');
      
      return response;
    } catch (error) {
      logger.error('E-Way Bill status retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate GSTIN format
   * @param {string} gstin - GSTIN to validate
   * @returns {boolean} True if valid
   */
  validateGSTIN(gstin) {
    if (!gstin || typeof gstin !== 'string') return false;
    
    // GSTIN format: 2 digits (state) + 10 chars (PAN) + 1 digit (entity) + 1 char (Z) + 1 check digit
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  }

  /**
   * Validate vehicle number format
   * @param {string} vehicleNo - Vehicle number to validate
   * @returns {boolean} True if valid
   */
  validateVehicleNumber(vehicleNo) {
    if (!vehicleNo || typeof vehicleNo !== 'string') return false;
    
    // Remove spaces and convert to uppercase
    const cleanVehicleNo = vehicleNo.replace(/\s/g, '').toUpperCase();
    
    // Indian vehicle number format: XX00XX0000 or XX00X0000
    const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
    return vehicleRegex.test(cleanVehicleNo);
  }
}

module.exports = EWayBillClient;
