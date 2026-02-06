import { eInvoiceAPI } from '../../lib/api';

/**
 * EInvoiceService
 * 
 * Manages e-invoice generation, cancellation, and status retrieval.
 * Implements error handling with retry logic for network failures.
 * 
 * Requirements: 2.1, 2.4, 2.5
 */

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds
const BACKOFF_MULTIPLIER = 2;

class EInvoiceService {
  /**
   * Generate e-invoice for a voucher
   * @param {Object} request - E-invoice generation request
   * @param {string} request.voucherId - Voucher ID
   * @param {string} request.voucherType - Voucher type (SALES_INVOICE, CREDIT_NOTE, etc.)
   * @returns {Promise<Object>} E-invoice status object
   */
  async generateEInvoice(request) {
    try {
      if (!request.voucherId) {
        throw new Error('Voucher ID is required');
      }

      if (!request.voucherType) {
        throw new Error('Voucher type is required');
      }

      const response = await this._retryWithBackoff(
        () => eInvoiceAPI.generate({
          voucher_id: request.voucherId,
          voucher_type: request.voucherType,
        })
      );

      return this._parseEInvoiceStatus(response.data);
    } catch (error) {
      console.error('Error generating e-invoice:', error);
      throw this._handleError(error, 'generate e-invoice');
    }
  }

  /**
   * Cancel an e-invoice
   * @param {Object} request - E-invoice cancellation request
   * @param {string} request.voucherId - Voucher ID
   * @param {string} request.irn - Invoice Reference Number
   * @param {string} request.reason - Cancellation reason
   * @param {string} request.reasonCode - Cancellation reason code
   * @returns {Promise<Object>} Updated e-invoice status object
   */
  async cancelEInvoice(request) {
    try {
      if (!request.voucherId) {
        throw new Error('Voucher ID is required');
      }

      if (!request.irn) {
        throw new Error('IRN is required');
      }

      if (!request.reason) {
        throw new Error('Cancellation reason is required');
      }

      if (!request.reasonCode) {
        throw new Error('Cancellation reason code is required');
      }

      const response = await eInvoiceAPI.cancel(request.voucherId, {
        irn: request.irn,
        reason: request.reason,
        reason_code: request.reasonCode,
      });

      return this._parseEInvoiceStatus(response.data);
    } catch (error) {
      console.error('Error cancelling e-invoice:', error);
      throw this._handleError(error, 'cancel e-invoice');
    }
  }

  /**
   * Get e-invoice status for a voucher
   * @param {string} voucherId - Voucher ID
   * @returns {Promise<Object|null>} E-invoice status object or null if not found
   */
  async getEInvoiceStatus(voucherId) {
    try {
      if (!voucherId) {
        throw new Error('Voucher ID is required');
      }

      const response = await eInvoiceAPI.getStatus(voucherId);

      if (!response.data || !response.data.data) {
        return null;
      }

      return this._parseEInvoiceStatus(response.data.data);
    } catch (error) {
      // Return null for 404 errors (e-invoice not found)
      if (error.response && error.response.status === 404) {
        return null;
      }

      console.error('Error getting e-invoice status:', error);
      throw this._handleError(error, 'get e-invoice status');
    }
  }

  /**
   * Retry e-invoice generation for a failed attempt
   * @param {string} id - E-invoice record ID
   * @returns {Promise<Object>} Updated e-invoice status object
   */
  async retryEInvoiceGeneration(id) {
    try {
      if (!id) {
        throw new Error('E-invoice ID is required');
      }

      const response = await this._retryWithBackoff(
        () => eInvoiceAPI.retry(id)
      );

      return this._parseEInvoiceStatus(response.data);
    } catch (error) {
      console.error('Error retrying e-invoice generation:', error);
      throw this._handleError(error, 'retry e-invoice generation');
    }
  }

  /**
   * Parse e-invoice status from API response
   * @private
   * @param {Object} data - Raw API response data
   * @returns {Object} Parsed e-invoice status object
   */
  _parseEInvoiceStatus(data) {
    if (!data) {
      throw new Error('Invalid e-invoice data');
    }

    return {
      id: data.id || null,
      voucherId: data.voucher_id || data.voucherId || null,
      status: data.status || 'PENDING',
      irn: data.irn || null,
      ackNo: data.ack_no || data.ackNo || null,
      ackDate: data.ack_date || data.ackDate ? new Date(data.ack_date || data.ackDate) : null,
      qrCode: data.qr_code || data.qrCode || null,
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
export default new EInvoiceService();
