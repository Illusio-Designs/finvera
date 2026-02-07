/**
 * Unit Tests for APIErrorHandler
 * 
 * Tests error categorization, error handling, retry logic, and error formatting.
 * Validates: Requirements 9.1, 9.4, 9.5, 9.6
 */

import {
  APIErrorHandler,
  ErrorCategory,
  NetworkError,
  ServerError,
  ValidationError,
  BusinessLogicError,
  ErrorContext,
  ErrorResponse,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  withErrorHandling
} from '../APIErrorHandler';

describe('APIErrorHandler - Unit Tests', () => {
  describe('Error Categorization', () => {
    test('should categorize network errors correctly', () => {
      const networkCodes = ['ERR_NETWORK', 'ECONNREFUSED', 'ECONNABORTED', 'ETIMEDOUT'];
      
      networkCodes.forEach(code => {
        const error = new Error('Network error');
        error.code = code;
        
        const category = APIErrorHandler.categorizeError(error);
        expect(category).toBe(ErrorCategory.NETWORK);
      });
    });

    test('should categorize server errors correctly', () => {
      const serverStatusCodes = [500, 502, 503, 504];
      
      serverStatusCodes.forEach(statusCode => {
        const error = new Error('Server error');
        error.response = { status: statusCode };
        
        const category = APIErrorHandler.categorizeError(error);
        expect(category).toBe(ErrorCategory.SERVER);
      });
    });

    test('should categorize validation errors correctly', () => {
      const validationStatusCodes = [400, 422];
      
      validationStatusCodes.forEach(statusCode => {
        const error = new Error('Validation error');
        error.response = { status: statusCode };
        
        const category = APIErrorHandler.categorizeError(error);
        expect(category).toBe(ErrorCategory.VALIDATION);
      });
    });

    test('should categorize business logic errors correctly', () => {
      const error1 = new Error('Invoice not eligible for e-invoice');
      expect(APIErrorHandler.categorizeError(error1)).toBe(ErrorCategory.BUSINESS_LOGIC);

      const error2 = new Error('Invoice threshold not met');
      expect(APIErrorHandler.categorizeError(error2)).toBe(ErrorCategory.BUSINESS_LOGIC);

      const error3 = new Error('Business error');
      error3.code = 'BL_001';
      expect(APIErrorHandler.categorizeError(error3)).toBe(ErrorCategory.BUSINESS_LOGIC);
    });

    test('should categorize unknown errors as UNKNOWN', () => {
      const error = new Error('Unknown error');
      const category = APIErrorHandler.categorizeError(error);
      expect(category).toBe(ErrorCategory.UNKNOWN);
    });

    test('should preserve category for custom error classes', () => {
      const networkError = new NetworkError('Network failed');
      expect(APIErrorHandler.categorizeError(networkError)).toBe(ErrorCategory.NETWORK);

      const serverError = new ServerError('Server failed', 500);
      expect(APIErrorHandler.categorizeError(serverError)).toBe(ErrorCategory.SERVER);

      const validationError = new ValidationError('Validation failed', {});
      expect(APIErrorHandler.categorizeError(validationError)).toBe(ErrorCategory.VALIDATION);

      const businessError = new BusinessLogicError('Business rule violated', 'BL_001');
      expect(APIErrorHandler.categorizeError(businessError)).toBe(ErrorCategory.BUSINESS_LOGIC);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors with user-friendly message', () => {
      const error = new Error('Connection failed');
      error.code = 'ERR_NETWORK';
      const context = new ErrorContext('E_INVOICE_GENERATE', 'voucher-123');

      const response = APIErrorHandler.handleError(error, context);

      expect(response.message).toBe('Unable to connect. Please check your internet connection.');
      expect(response.displayToUser).toBe(true);
      expect(response.allowRetry).toBe(true);
      expect(response.logToBackend).toBe(false);
      expect(response.notifyUser).toBe(false);
      expect(response.category).toBe(ErrorCategory.NETWORK);
    });

    test('should handle server errors with retry option', () => {
      const error = new Error('Internal server error');
      error.response = { status: 500, data: { message: 'Server error' } };
      const context = new ErrorContext('E_WAY_BILL_GENERATE', 'voucher-456');

      const response = APIErrorHandler.handleError(error, context);

      expect(response.message).toBe('Server error occurred. Please try again.');
      expect(response.displayToUser).toBe(true);
      expect(response.allowRetry).toBe(true);
      expect(response.logToBackend).toBe(true);
      expect(response.notifyUser).toBe(true);
      expect(response.category).toBe(ErrorCategory.SERVER);
    });

    test('should handle validation errors with specific message', () => {
      const error = new Error('Validation failed');
      error.response = {
        status: 400,
        data: { message: 'Invalid PAN number format' }
      };
      const context = new ErrorContext('TDS_CALCULATE', 'voucher-789');

      const response = APIErrorHandler.handleError(error, context);

      expect(response.message).toBe('Invalid PAN number format');
      expect(response.displayToUser).toBe(true);
      expect(response.allowRetry).toBe(false);
      expect(response.logToBackend).toBe(true);
      expect(response.notifyUser).toBe(false);
      expect(response.category).toBe(ErrorCategory.VALIDATION);
    });

    test('should handle business logic errors without retry', () => {
      const error = new Error('Invoice not eligible for e-invoice');
      const context = new ErrorContext('E_INVOICE_GENERATE', 'voucher-101');

      const response = APIErrorHandler.handleError(error, context);

      expect(response.message).toBe('Invoice not eligible for e-invoice');
      expect(response.displayToUser).toBe(true);
      expect(response.allowRetry).toBe(false);
      expect(response.logToBackend).toBe(true);
      expect(response.notifyUser).toBe(false);
      expect(response.category).toBe(ErrorCategory.BUSINESS_LOGIC);
    });

    test('should handle unknown errors with generic message', () => {
      const error = new Error('Something went wrong');
      const context = new ErrorContext('UNKNOWN_OPERATION', 'voucher-999');

      const response = APIErrorHandler.handleError(error, context);

      expect(response.message).toBe('An unexpected error occurred. Please contact support.');
      expect(response.displayToUser).toBe(true);
      expect(response.allowRetry).toBe(true);
      expect(response.logToBackend).toBe(true);
      expect(response.notifyUser).toBe(true);
      expect(response.category).toBe(ErrorCategory.UNKNOWN);
    });
  });

  describe('Retry Logic', () => {
    test('should identify retryable errors', () => {
      const networkError = new Error('Network error');
      networkError.code = 'ERR_NETWORK';
      expect(APIErrorHandler.isRetryable(networkError)).toBe(true);

      const serverError = new Error('Server error');
      serverError.response = { status: 500 };
      expect(APIErrorHandler.isRetryable(serverError)).toBe(true);
    });

    test('should identify non-retryable errors', () => {
      const validationError = new Error('Validation error');
      validationError.response = { status: 400 };
      expect(APIErrorHandler.isRetryable(validationError)).toBe(false);

      const businessError = new Error('Business logic error');
      businessError.code = 'BL_001';
      expect(APIErrorHandler.isRetryable(businessError)).toBe(false);
    });

    test('should retry operation with exponential backoff', async () => {
      let attemptCount = 0;
      const operation = jest.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          const error = new Error('Temporary failure');
          error.code = 'ERR_NETWORK';
          throw error;
        }
        return 'success';
      });

      const config = new RetryConfig({
        maxRetries: 3,
        initialDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2
      });

      const result = await APIErrorHandler.retryWithBackoff(operation, config);

      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('should throw error after max retries', async () => {
      const operation = jest.fn(async () => {
        const error = new Error('Persistent failure');
        error.code = 'ERR_NETWORK';
        throw error;
      });

      const config = new RetryConfig({
        maxRetries: 2,
        initialDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2
      });

      await expect(
        APIErrorHandler.retryWithBackoff(operation, config)
      ).rejects.toThrow('Persistent failure');

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    test('should not retry non-retryable errors', async () => {
      const operation = jest.fn(async () => {
        const error = new Error('Validation error');
        error.response = { status: 400 };
        throw error;
      });

      const config = new RetryConfig({
        maxRetries: 3,
        initialDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2
      });

      await expect(
        APIErrorHandler.retryWithBackoff(operation, config)
      ).rejects.toThrow('Validation error');

      expect(operation).toHaveBeenCalledTimes(1); // No retries
    });

    test('should respect max delay in backoff', async () => {
      const delays = [];
      const originalSleep = APIErrorHandler.sleep;
      APIErrorHandler.sleep = jest.fn(async (ms) => {
        delays.push(ms);
        return originalSleep(1); // Use minimal delay for test speed
      });

      const operation = jest.fn(async () => {
        const error = new Error('Network error');
        error.code = 'ERR_NETWORK';
        throw error;
      });

      const config = new RetryConfig({
        maxRetries: 5,
        initialDelay: 100,
        maxDelay: 500,
        backoffMultiplier: 2
      });

      await expect(
        APIErrorHandler.retryWithBackoff(operation, config)
      ).rejects.toThrow();

      // Verify delays don't exceed maxDelay
      delays.forEach(delay => {
        expect(delay).toBeLessThanOrEqual(config.maxDelay);
      });

      // Verify exponential growth up to maxDelay
      expect(delays[0]).toBe(100);
      expect(delays[1]).toBe(200);
      expect(delays[2]).toBe(400);
      expect(delays[3]).toBe(500); // Capped at maxDelay
      expect(delays[4]).toBe(500); // Stays at maxDelay

      APIErrorHandler.sleep = originalSleep;
    });
  });

  describe('Error Formatting', () => {
    test('should format error for logging with all required fields', () => {
      const error = new Error('Test error');
      error.code = 'TEST_ERROR';
      error.response = { status: 500 };
      error.stack = 'Error stack trace';

      const context = new ErrorContext('E_INVOICE_GENERATE', 'voucher-123');

      const logData = APIErrorHandler.formatErrorForLogging(error, context);

      expect(logData).toHaveProperty('category');
      expect(logData).toHaveProperty('message');
      expect(logData).toHaveProperty('operation');
      expect(logData).toHaveProperty('voucherId');
      expect(logData).toHaveProperty('statusCode');
      expect(logData).toHaveProperty('errorCode');
      expect(logData).toHaveProperty('timestamp');
      expect(logData).toHaveProperty('stack');

      expect(logData.message).toBe('Test error');
      expect(logData.operation).toBe('E_INVOICE_GENERATE');
      expect(logData.voucherId).toBe('voucher-123');
      expect(logData.statusCode).toBe(500);
      expect(logData.errorCode).toBe('TEST_ERROR');
    });

    test('should extract user-friendly message from error', () => {
      const error = new Error('Network connection failed');
      error.code = 'ERR_NETWORK';

      const message = APIErrorHandler.getUserFriendlyMessage(error);

      expect(message).toBe('Unable to connect. Please check your internet connection.');
    });
  });

  describe('withErrorHandling Wrapper', () => {
    test('should execute API call successfully', async () => {
      const apiCall = jest.fn(async () => ({ data: 'success' }));
      const context = new ErrorContext('E_INVOICE_GENERATE', 'voucher-123');

      const result = await withErrorHandling(apiCall, context);

      expect(result).toEqual({ data: 'success' });
      expect(apiCall).toHaveBeenCalledTimes(1);
    });

    test('should handle errors and throw enhanced error', async () => {
      const apiCall = jest.fn(async () => {
        const error = new Error('Network error');
        error.code = 'ERR_NETWORK';
        throw error;
      });
      const context = new ErrorContext('E_INVOICE_GENERATE', 'voucher-123');

      await expect(
        withErrorHandling(apiCall, context)
      ).rejects.toThrow('Unable to connect. Please check your internet connection.');

      expect(apiCall).toHaveBeenCalledTimes(1);
    });

    test('should retry with provided retry config', async () => {
      let attemptCount = 0;
      const apiCall = jest.fn(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          const error = new Error('Temporary error');
          error.code = 'ERR_NETWORK';
          throw error;
        }
        return { data: 'success' };
      });
      const context = new ErrorContext('E_INVOICE_GENERATE', 'voucher-123');
      const retryConfig = new RetryConfig({
        maxRetries: 2,
        initialDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2
      });

      const result = await withErrorHandling(apiCall, context, retryConfig);

      expect(result).toEqual({ data: 'success' });
      expect(attemptCount).toBe(2);
    });
  });

  describe('Custom Error Classes', () => {
    test('should create NetworkError with correct properties', () => {
      const originalError = new Error('Original error');
      const networkError = new NetworkError('Network failed', originalError);

      expect(networkError.name).toBe('NetworkError');
      expect(networkError.message).toBe('Network failed');
      expect(networkError.category).toBe(ErrorCategory.NETWORK);
      expect(networkError.originalError).toBe(originalError);
    });

    test('should create ServerError with correct properties', () => {
      const originalError = new Error('Original error');
      const serverError = new ServerError('Server failed', 503, originalError);

      expect(serverError.name).toBe('ServerError');
      expect(serverError.message).toBe('Server failed');
      expect(serverError.category).toBe(ErrorCategory.SERVER);
      expect(serverError.statusCode).toBe(503);
      expect(serverError.originalError).toBe(originalError);
    });

    test('should create ValidationError with correct properties', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const originalError = new Error('Original error');
      const validationError = new ValidationError('Validation failed', details, originalError);

      expect(validationError.name).toBe('ValidationError');
      expect(validationError.message).toBe('Validation failed');
      expect(validationError.category).toBe(ErrorCategory.VALIDATION);
      expect(validationError.details).toEqual(details);
      expect(validationError.originalError).toBe(originalError);
    });

    test('should create BusinessLogicError with correct properties', () => {
      const originalError = new Error('Original error');
      const businessError = new BusinessLogicError('Business rule violated', 'BL_001', originalError);

      expect(businessError.name).toBe('BusinessLogicError');
      expect(businessError.message).toBe('Business rule violated');
      expect(businessError.category).toBe(ErrorCategory.BUSINESS_LOGIC);
      expect(businessError.code).toBe('BL_001');
      expect(businessError.originalError).toBe(originalError);
    });
  });

  describe('ErrorContext', () => {
    test('should create ErrorContext with correct properties', () => {
      const context = new ErrorContext('E_INVOICE_GENERATE', 'voucher-123', true);

      expect(context.operation).toBe('E_INVOICE_GENERATE');
      expect(context.voucherId).toBe('voucher-123');
      expect(context.retryable).toBe(true);
    });

    test('should default retryable to true', () => {
      const context = new ErrorContext('E_INVOICE_GENERATE', 'voucher-123');

      expect(context.retryable).toBe(true);
    });
  });

  describe('ErrorResponse', () => {
    test('should create ErrorResponse with all properties', () => {
      const response = new ErrorResponse({
        message: 'Test error',
        displayToUser: true,
        allowRetry: true,
        logToBackend: true,
        notifyUser: true,
        category: ErrorCategory.NETWORK
      });

      expect(response.message).toBe('Test error');
      expect(response.displayToUser).toBe(true);
      expect(response.allowRetry).toBe(true);
      expect(response.logToBackend).toBe(true);
      expect(response.notifyUser).toBe(true);
      expect(response.category).toBe(ErrorCategory.NETWORK);
    });

    test('should use default values', () => {
      const response = new ErrorResponse({ message: 'Test error' });

      expect(response.message).toBe('Test error');
      expect(response.displayToUser).toBe(true);
      expect(response.allowRetry).toBe(false);
      expect(response.logToBackend).toBe(false);
      expect(response.notifyUser).toBe(false);
      expect(response.category).toBe(ErrorCategory.UNKNOWN);
    });
  });

  describe('RetryConfig', () => {
    test('should create RetryConfig with custom values', () => {
      const config = new RetryConfig({
        maxRetries: 5,
        initialDelay: 2000,
        maxDelay: 20000,
        backoffMultiplier: 3
      });

      expect(config.maxRetries).toBe(5);
      expect(config.initialDelay).toBe(2000);
      expect(config.maxDelay).toBe(20000);
      expect(config.backoffMultiplier).toBe(3);
    });

    test('should use default values', () => {
      const config = new RetryConfig();

      expect(config.maxRetries).toBe(3);
      expect(config.initialDelay).toBe(1000);
      expect(config.maxDelay).toBe(10000);
      expect(config.backoffMultiplier).toBe(2);
    });

    test('should have correct default config constant', () => {
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_RETRY_CONFIG.initialDelay).toBe(1000);
      expect(DEFAULT_RETRY_CONFIG.maxDelay).toBe(10000);
      expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBe(2);
    });
  });
});
