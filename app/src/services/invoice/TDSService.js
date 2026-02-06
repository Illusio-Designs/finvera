import { tdsAPI } from '../../lib/api';

/**
 * TDSService
 * 
 * Manages TDS calculation, retrieval, and rate lookup.
 * Implements PAN validation and error handling.
 * 
 * Requirements: 4.1
 */

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

class TDSService {
  /**
   * Calculate TDS for a voucher
   * @param {Object} request - TDS calculation request
   * @param {string} request.voucherId - Voucher ID
   * @param {number} request.amount - Transaction amount
   * @param {string} request.section - TDS section (194C, 194J, etc.)
   * @param {string} request.deducteeType - Deductee type (INDIVIDUAL, COMPANY, FIRM)
   * @param {string} [request.panNumber] - PAN number (optional)
   * @returns {Promise<Object>} TDS details object
   */
  async calculateTDS(request) {
    try {
      if (!request.voucherId) {
        throw new Error('Voucher ID is required');
      }

      if (request.amount === undefined || request.amount === null) {
        throw new Error('Amount is required');
      }

      if (request.amount < 0) {
        throw new Error('Amount cannot be negative');
      }

      if (!request.section) {
        throw new Error('TDS section is required');
      }

      if (!request.deducteeType) {
        throw new Error('Deductee type is required');
      }

      // Validate PAN number if provided
      if (request.panNumber) {
        if (!this.validatePAN(request.panNumber)) {
          throw new Error('Invalid PAN number format. PAN must be 10 alphanumeric characters (e.g., ABCDE1234F)');
        }
      }

      const response = await tdsAPI.calculate({
        voucher_id: request.voucherId,
        amount: request.amount,
        section: request.section,
        deductee_type: request.deducteeType,
        pan_number: request.panNumber || null,
      });

      return this._parseTDSDetails(response.data);
    } catch (error) {
      console.error('Error calculating TDS:', error);
      throw this._handleError(error, 'calculate TDS');
    }
  }

  /**
   * Get TDS details for a voucher
   * @param {string} voucherId - Voucher ID
   * @returns {Promise<Object|null>} TDS details object or null if not found
   */
  async getTDSDetails(voucherId) {
    try {
      if (!voucherId) {
        throw new Error('Voucher ID is required');
      }

      const response = await tdsAPI.getDetails(voucherId);

      if (!response.data || !response.data.data || response.data.data.length === 0) {
        return null;
      }

      // Return the first TDS entry for the voucher
      return this._parseTDSDetails(response.data.data[0]);
    } catch (error) {
      // Return null for 404 errors (TDS not found)
      if (error.response && error.response.status === 404) {
        return null;
      }

      console.error('Error getting TDS details:', error);
      throw this._handleError(error, 'get TDS details');
    }
  }

  /**
   * Get TDS rates for all sections
   * @returns {Promise<Map<string, number>>} Map of TDS section to rate
   */
  async getTDSRates() {
    try {
      const response = await tdsAPI.getRates();

      if (!response.data || !response.data.data) {
        throw new Error('Invalid TDS rates response');
      }

      // Convert array of rates to Map
      const ratesMap = new Map();
      const rates = response.data.data;

      if (Array.isArray(rates)) {
        rates.forEach(rate => {
          if (rate.section && rate.rate !== undefined) {
            ratesMap.set(rate.section, rate.rate);
          }
        });
      } else if (typeof rates === 'object') {
        // Handle object format
        Object.keys(rates).forEach(section => {
          ratesMap.set(section, rates[section]);
        });
      }

      return ratesMap;
    } catch (error) {
      console.error('Error getting TDS rates:', error);
      throw this._handleError(error, 'get TDS rates');
    }
  }

  /**
   * Validate PAN number format
   * @param {string} panNumber - PAN number to validate
   * @returns {boolean} True if PAN is valid
   */
  validatePAN(panNumber) {
    if (!panNumber || typeof panNumber !== 'string') {
      return false;
    }

    // PAN format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
    return PAN_REGEX.test(panNumber.trim().toUpperCase());
  }

  /**
   * Parse TDS details from API response
   * @private
   * @param {Object} data - Raw API response data
   * @returns {Object} Parsed TDS details object
   */
  _parseTDSDetails(data) {
    if (!data) {
      throw new Error('Invalid TDS data');
    }

    return {
      id: data.id || null,
      voucherId: data.voucher_id || data.voucherId || null,
      section: data.section || null,
      rate: data.rate || 0,
      amount: data.amount || 0,
      deducteeType: data.deductee_type || data.deducteeType || null,
      panNumber: data.pan_number || data.panNumber || null,
      calculatedAt: data.calculated_at || data.calculatedAt ? new Date(data.calculated_at || data.calculatedAt) : new Date(),
    };
  }

  /**
   * Handle and format errors
   * @private
   * @param {Error} error - Error object
   * @param {string} operation - Operation name for error message
   * @returns {Error} Formatted error
   */
  _handleError(error, operation) {
    // Network errors
    if (error.code === 'ECONNABORTED' || 
        error.code === 'ERR_NETWORK' || 
        error.code === 'ECONNREFUSED') {
      const networkError = new Error(`Unable to ${operation}. Please check your internet connection.`);
      networkError.code = 'NETWORK_ERROR';
      networkError.retryable = true;
      return networkError;
    }

    // Server errors
    if (error.response && error.response.status >= 500) {
      const serverError = new Error(`Server error occurred while trying to ${operation}. Please try again.`);
      serverError.code = 'SERVER_ERROR';
      serverError.retryable = true;
      serverError.statusCode = error.response.status;
      return serverError;
    }

    // Validation errors
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      const validationError = new Error(
        error.response.data?.message || 
        error.response.data?.error || 
        `Failed to ${operation}. Please check your input.`
      );
      validationError.code = 'VALIDATION_ERROR';
      validationError.retryable = false;
      validationError.statusCode = error.response.status;
      validationError.details = error.response.data?.details || null;
      return validationError;
    }

    // Unknown errors
    const unknownError = new Error(error.message || `An unexpected error occurred while trying to ${operation}.`);
    unknownError.code = 'UNKNOWN_ERROR';
    unknownError.retryable = true;
    return unknownError;
  }
}

// Export singleton instance
export default new TDSService();
