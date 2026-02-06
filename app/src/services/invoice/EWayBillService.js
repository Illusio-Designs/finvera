import { eWayBillAPI } from '../../lib/api';
import SettingsService from './SettingsService';

/**
 * EWayBillService
 * 
 * Manages e-way bill generation, cancellation, vehicle updates, and status retrieval.
 * Implements threshold checking and error handling with retry logic.
 * 
 * Requirements: 3.1, 3.4, 3.5
 */

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds
const BACKOFF_MULTIPLIER = 2;

class EWayBillService {
  /**
   * Generate e-way bill for a voucher
   * @param {Object} request - E-way bill generation request
   * @param {string} request.voucherId - Voucher ID
   * @param {string} request.voucherType - Voucher type
   * @param {number} request.amount - Invoice amount for threshold checking
   * @param {string} [request.vehicleNumber] - Vehicle number (optional)
   * @param {string} [request.transporterId] - Transporter ID (optional)
   * @param {number} [request.distance] - Distance in km (optional)
   * @returns {Promise<Object>} E-way bill status object
   */
  async generateEWayBill(request) {
    try {
      if (!request.voucherId) {
        throw new Error('Voucher ID is required');
      }

      if (!request.voucherType) {
        throw new Error('Voucher type is required');
      }

      if (request.amount === undefined || request.amount === null) {
        throw new Error('Amount is required for threshold checking');
      }

      // Check threshold before generating
      const meetsThreshold = await this.checkThreshold(request.amount);
      if (!meetsThreshold) {
        const settings = await SettingsService.getCompanySettings();
        throw new Error(
          `E-way bill not required. Amount ${request.amount} is below threshold ${settings.eWayBillThreshold}`
        );
      }

      const response = await this._retryWithBackoff(
        () => eWayBillAPI.generate({
          voucher_id: request.voucherId,
          voucher_type: request.voucherType,
          vehicle_number: request.vehicleNumber,
          transporter_id: request.transporterId,
          distance: request.distance,
        })
      );

      return this._parseEWayBillStatus(response.data);
    } catch (error) {
      console.error('Error generating e-way bill:', error);
      throw this._handleError(error, 'generate e-way bill');
    }
  }

  /**
   * Cancel an e-way bill
   * @param {Object} request - E-way bill cancellation request
   * @param {string} request.voucherId - Voucher ID
   * @param {string} request.ewbNumber - E-way bill number
   * @param {string} request.reason - Cancellation reason
   * @param {string} request.reasonCode - Cancellation reason code
   * @returns {Promise<Object>} Updated e-way bill status object
   */
  async cancelEWayBill(request) {
    try {
      if (!request.voucherId) {
        throw new Error('Voucher ID is required');
      }

      if (!request.ewbNumber) {
        throw new Error('E-way bill number is required');
      }

      if (!request.reason) {
        throw new Error('Cancellation reason is required');
      }

      if (!request.reasonCode) {
        throw new Error('Cancellation reason code is required');
      }

      const response = await eWayBillAPI.cancel(request.voucherId, {
        ewb_number: request.ewbNumber,
        reason: request.reason,
        reason_code: request.reasonCode,
      });

      return this._parseEWayBillStatus(response.data);
    } catch (error) {
      console.error('Error cancelling e-way bill:', error);
      throw this._handleError(error, 'cancel e-way bill');
    }
  }

  /**
   * Update vehicle details for an e-way bill
   * @param {Object} request - Vehicle update request
   * @param {string} request.id - E-way bill record ID
   * @param {string} request.vehicleNumber - New vehicle number
   * @param {string} request.reasonCode - Reason code for update
   * @param {string} request.reasonRemark - Reason remark for update
   * @returns {Promise<Object>} Updated e-way bill status object
   */
  async updateVehicleDetails(request) {
    try {
      if (!request.id) {
        throw new Error('E-way bill ID is required');
      }

      if (!request.vehicleNumber) {
        throw new Error('Vehicle number is required');
      }

      if (!request.reasonCode) {
        throw new Error('Reason code is required');
      }

      if (!request.reasonRemark) {
        throw new Error('Reason remark is required');
      }

      const response = await eWayBillAPI.updateVehicle(request.id, {
        vehicle_number: request.vehicleNumber,
        reason_code: request.reasonCode,
        reason_remark: request.reasonRemark,
      });

      return this._parseEWayBillStatus(response.data);
    } catch (error) {
      console.error('Error updating vehicle details:', error);
      throw this._handleError(error, 'update vehicle details');
    }
  }

  /**
   * Get e-way bill status for a voucher
   * @param {string} voucherId - Voucher ID
   * @returns {Promise<Object|null>} E-way bill status object or null if not found
   */
  async getEWayBillStatus(voucherId) {
    try {
      if (!voucherId) {
        throw new Error('Voucher ID is required');
      }

      const response = await eWayBillAPI.getStatus(voucherId);

      if (!response.data || !response.data.data) {
        return null;
      }

      return this._parseEWayBillStatus(response.data.data);
    } catch (error) {
      // Return null for 404 errors (e-way bill not found)
      if (error.response && error.response.status === 404) {
        return null;
      }

      console.error('Error getting e-way bill status:', error);
      throw this._handleError(error, 'get e-way bill status');
    }
  }

  /**
   * Retry e-way bill generation for a failed attempt
   * @param {string} id - E-way bill record ID
   * @returns {Promise<Object>} Updated e-way bill status object
   */
  async retryEWayBillGeneration(id) {
    try {
      if (!id) {
        throw new Error('E-way bill ID is required');
      }

      const response = await this._retryWithBackoff(
        () => eWayBillAPI.retry(id)
      );

      return this._parseEWayBillStatus(response.data);
    } catch (error) {
      console.error('Error retrying e-way bill generation:', error);
      throw this._handleError(error, 'retry e-way bill generation');
    }
  }

  /**
   * Check if amount meets e-way bill threshold
   * @param {number} amount - Invoice amount
   * @returns {Promise<boolean>} True if amount meets or exceeds threshold
   */
  async checkThreshold(amount) {
    try {
      const settings = await SettingsService.getCompanySettings();
      
      if (!settings.eWayBillEnabled) {
        return false;
      }

      const threshold = settings.eWayBillThreshold !== undefined && settings.eWayBillThreshold !== null 
        ? settings.eWayBillThreshold 
        : 50000;
      return amount >= threshold;
    } catch (error) {
      console.error('Error checking e-way bill threshold:', error);
      // Default to false on error to prevent unwanted generation
      return false;
    }
  }

  /**
   * Parse e-way bill status from API response
   * @private
   * @param {Object} data - Raw API response data
   * @returns {Object} Parsed e-way bill status object
   */
  _parseEWayBillStatus(data) {
    if (!data) {
      throw new Error('Invalid e-way bill data');
    }

    return {
      id: data.id || null,
      voucherId: data.voucher_id || data.voucherId || null,
      status: data.status || 'PENDING',
      ewbNumber: data.ewb_number || data.ewbNumber || null,
      validUntil: data.valid_until || data.validUntil ? new Date(data.valid_until || data.validUntil) : null,
      vehicleNumber: data.vehicle_number || data.vehicleNumber || null,
      transporterId: data.transporter_id || data.transporterId || null,
      distance: data.distance || null,
      errorMessage: data.error_message || data.errorMessage || null,
      generatedAt: data.generated_at || data.generatedAt ? new Date(data.generated_at || data.generatedAt) : null,
      cancelledAt: data.cancelled_at || data.cancelledAt ? new Date(data.cancelled_at || data.cancelledAt) : null,
      cancellationReason: data.cancellation_reason || data.cancellationReason || null,
    };
  }

  /**
   * Retry an operation with exponential backoff
   * @private
   * @param {Function} operation - Async operation to retry
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<any>} Operation result
   */
  async _retryWithBackoff(operation, maxRetries = MAX_RETRIES) {
    let lastError;
    let delay = INITIAL_RETRY_DELAY;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry for non-retryable errors
        if (!this._isRetryableError(error)) {
          throw error;
        }

        // Don't retry if we've exhausted attempts
        if (attempt >= maxRetries) {
          throw error;
        }

        // Wait before retrying
        await this._sleep(delay);
        delay = Math.min(delay * BACKOFF_MULTIPLIER, MAX_RETRY_DELAY);
      }
    }

    throw lastError;
  }

  /**
   * Check if an error is retryable
   * @private
   * @param {Error} error - Error object
   * @returns {boolean} True if error is retryable
   */
  _isRetryableError(error) {
    // Network errors are retryable
    if (error.code === 'ECONNABORTED' || 
        error.code === 'ERR_NETWORK' || 
        error.code === 'ECONNREFUSED') {
      return true;
    }

    // Server errors (5xx) are retryable
    if (error.response && error.response.status >= 500) {
      return true;
    }

    // Timeout errors are retryable
    if (error.message && error.message.toLowerCase().includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * Sleep for specified milliseconds
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
export default new EWayBillService();
