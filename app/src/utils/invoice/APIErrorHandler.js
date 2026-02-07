/**
 * APIErrorHandler - Centralized error handling for invoice-related API operations
 * 
 * This module provides error categorization, response formatting, and retry logic
 * for e-invoice, e-way bill, and TDS API operations.
 */

/**
 * Error categories for classification
 */
export const ErrorCategory = {
  NETWORK: 'NETWORK',
  SERVER: 'SERVER',
  VALIDATION: 'VALIDATION',
  BUSINESS_LOGIC: 'BUSINESS_LOGIC',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Custom error classes for different error types
 */
export class NetworkError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'NetworkError';
    this.category = ErrorCategory.NETWORK;
    this.originalError = originalError;
  }
}

export class ServerError extends Error {
  constructor(message, statusCode = 500, originalError = null) {
    super(message);
    this.name = 'ServerError';
    this.category = ErrorCategory.SERVER;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

export class ValidationError extends Error {
  constructor(message, details = {}, originalError = null) {
    super(message);
    this.name = 'ValidationError';
    this.category = ErrorCategory.VALIDATION;
    this.details = details;
    this.originalError = originalError;
  }
}

export class BusinessLogicError extends Error {
  constructor(message, code = null, originalError = null) {
    super(message);
    this.name = 'BusinessLogicError';
    this.category = ErrorCategory.BUSINESS_LOGIC;
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Error context for providing additional information
 */
export class ErrorContext {
  constructor(operation, voucherId, retryable = true) {
    this.operation = operation;
    this.voucherId = voucherId;
    this.retryable = retryable;
  }
}

/**
 * Error response structure
 */
export class ErrorResponse {
  constructor({
    message,
    displayToUser = true,
    allowRetry = false,
    logToBackend = false,
    notifyUser = false,
    category = ErrorCategory.UNKNOWN
  }) {
    this.message = message;
    this.displayToUser = displayToUser;
    this.allowRetry = allowRetry;
    this.logToBackend = logToBackend;
    this.notifyUser = notifyUser;
    this.category = category;
  }
}

/**
 * Retry configuration
 */
export class RetryConfig {
  constructor({
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2
  } = {}) {
    this.maxRetries = maxRetries;
    this.initialDelay = initialDelay;
    this.maxDelay = maxDelay;
    this.backoffMultiplier = backoffMultiplier;
  }
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG = new RetryConfig();

/**
 * APIErrorHandler - Main error handling class
 */
export class APIErrorHandler {
  /**
   * Categorize an error based on its properties
   * @param {Error} error - The error to categorize
   * @returns {string} - The error category
   */
  static categorizeError(error) {
    // Already categorized custom errors
    if (error.category) {
      return error.category;
    }

    // Network errors
    if (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      error.message?.toLowerCase().includes('network') ||
      error.message?.toLowerCase().includes('connection')
    ) {
      return ErrorCategory.NETWORK;
    }

    // Server errors (5xx status codes)
    if (error.response?.status >= 500) {
      return ErrorCategory.SERVER;
    }

    // Validation errors (4xx status codes except 401, 403, 404)
    if (
      error.response?.status >= 400 &&
      error.response?.status < 500 &&
      error.response?.status !== 401 &&
      error.response?.status !== 403 &&
      error.response?.status !== 404
    ) {
      return ErrorCategory.VALIDATION;
    }

    // Business logic errors (specific error codes or messages)
    if (
      error.code?.startsWith('BL_') ||
      error.response?.data?.code?.startsWith('BL_') ||
      error.message?.includes('not eligible') ||
      error.message?.includes('threshold not met')
    ) {
      return ErrorCategory.BUSINESS_LOGIC;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Handle an error and return a formatted error response
   * @param {Error} error - The error to handle
   * @param {ErrorContext} context - Additional context about the error
   * @returns {ErrorResponse} - Formatted error response
   */
  static handleError(error, context) {
    const category = this.categorizeError(error);

    switch (category) {
      case ErrorCategory.NETWORK:
        return new ErrorResponse({
          message: 'Unable to connect. Please check your internet connection.',
          displayToUser: true,
          allowRetry: true,
          logToBackend: false,
          notifyUser: false,
          category: ErrorCategory.NETWORK
        });

      case ErrorCategory.SERVER:
        return new ErrorResponse({
          message: 'Server error occurred. Please try again.',
          displayToUser: true,
          allowRetry: true,
          logToBackend: true,
          notifyUser: true,
          category: ErrorCategory.SERVER
        });

      case ErrorCategory.VALIDATION:
        return new ErrorResponse({
          message: error.response?.data?.message || error.message || 'Validation error occurred.',
          displayToUser: true,
          allowRetry: false,
          logToBackend: true,
          notifyUser: false,
          category: ErrorCategory.VALIDATION
        });

      case ErrorCategory.BUSINESS_LOGIC:
        return new ErrorResponse({
          message: error.message || 'Operation cannot be completed.',
          displayToUser: true,
          allowRetry: false,
          logToBackend: true,
          notifyUser: false,
          category: ErrorCategory.BUSINESS_LOGIC
        });

      default:
        return new ErrorResponse({
          message: 'An unexpected error occurred. Please contact support.',
          displayToUser: true,
          allowRetry: true,
          logToBackend: true,
          notifyUser: true,
          category: ErrorCategory.UNKNOWN
        });
    }
  }

  /**
   * Check if an error is retryable
   * @param {Error} error - The error to check
   * @returns {boolean} - True if the error is retryable
   */
  static isRetryable(error) {
    const category = this.categorizeError(error);
    return (
      category === ErrorCategory.NETWORK ||
      category === ErrorCategory.SERVER ||
      (error.response?.status >= 500 && error.response?.status < 600)
    );
  }

  /**
   * Sleep for a specified duration
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry an operation with exponential backoff
   * @param {Function} operation - The async operation to retry
   * @param {RetryConfig} config - Retry configuration
   * @returns {Promise<any>} - Result of the operation
   */
  static async retryWithBackoff(operation, config = DEFAULT_RETRY_CONFIG) {
    let lastError;
    let delay = config.initialDelay;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < config.maxRetries && this.isRetryable(error)) {
          console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);
          await this.sleep(delay);
          delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }

  /**
   * Format error for logging to backend
   * @param {Error} error - The error to format
   * @param {ErrorContext} context - Error context
   * @returns {Object} - Formatted error object
   */
  static formatErrorForLogging(error, context) {
    return {
      category: this.categorizeError(error),
      message: error.message,
      operation: context.operation,
      voucherId: context.voucherId,
      statusCode: error.response?.status,
      errorCode: error.code || error.response?.data?.code,
      timestamp: new Date().toISOString(),
      stack: error.stack
    };
  }

  /**
   * Extract user-friendly message from error
   * @param {Error} error - The error to extract message from
   * @returns {string} - User-friendly error message
   */
  static getUserFriendlyMessage(error) {
    const errorResponse = this.handleError(error, new ErrorContext('unknown', null));
    return errorResponse.message;
  }
}

/**
 * Convenience function to wrap API calls with error handling
 * @param {Function} apiCall - The API call to wrap
 * @param {ErrorContext} context - Error context
 * @param {RetryConfig} retryConfig - Optional retry configuration
 * @returns {Promise<any>} - Result of the API call
 */
export async function withErrorHandling(apiCall, context, retryConfig = null) {
  try {
    if (retryConfig) {
      return await APIErrorHandler.retryWithBackoff(apiCall, retryConfig);
    }
    return await apiCall();
  } catch (error) {
    const errorResponse = APIErrorHandler.handleError(error, context);
    
    // Log to console in development
    if (__DEV__) {
      console.error('API Error:', {
        operation: context.operation,
        voucherId: context.voucherId,
        category: errorResponse.category,
        message: errorResponse.message,
        originalError: error
      });
    }

    // Re-throw with enhanced error information
    const enhancedError = new Error(errorResponse.message);
    enhancedError.category = errorResponse.category;
    enhancedError.allowRetry = errorResponse.allowRetry;
    enhancedError.originalError = error;
    throw enhancedError;
  }
}

export default APIErrorHandler;
