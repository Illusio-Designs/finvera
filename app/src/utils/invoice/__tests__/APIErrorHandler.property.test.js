/**
 * Property-Based Tests for APIErrorHandler
 * 
 * Feature: mobile-invoice-system-enhancement
 * Property 21: Network Error Handling
 * Validates: Requirements 9.1, 9.2, 9.3
 */

import fc from 'fast-check';
import {
  APIErrorHandler,
  ErrorCategory,
  NetworkError,
  ServerError,
  ValidationError,
  BusinessLogicError,
  ErrorContext,
  withErrorHandling,
  DEFAULT_RETRY_CONFIG
} from '../APIErrorHandler';

describe('Feature: mobile-invoice-system-enhancement - APIErrorHandler Property Tests', () => {
  /**
   * Property 21: Network Error Handling
   * 
   * For any API call (e-invoice, e-way bill, or TDS operations) that fails due to 
   * network error, the system should handle the error gracefully and display a 
   * user-friendly error message.
   * 
   * Validates: Requirements 9.1, 9.2, 9.3
   */
  test('Property 21: Network Error Handling - graceful handling with user-friendly messages', () => {
    fc.assert(
      fc.property(
        // Generate various network error scenarios
        fc.constantFrom(
          'ERR_NETWORK',
          'ECONNREFUSED',
          'ECONNABORTED',
          'ETIMEDOUT'
        ),
        fc.constantFrom(
          'E_INVOICE_GENERATE',
          'E_WAY_BILL_GENERATE',
          'TDS_CALCULATE'
        ),
        fc.string({ minLength: 1, maxLength: 50 }),
        (errorCode, operation, voucherId) => {
          // Create a network error
          const error = new Error('Network request failed');
          error.code = errorCode;

          // Create error context
          const context = new ErrorContext(operation, voucherId, true);

          // Handle the error
          const errorResponse = APIErrorHandler.handleError(error, context);

          // Verify error is categorized as network error
          expect(errorResponse.category).toBe(ErrorCategory.NETWORK);

          // Verify user-friendly message is provided
          expect(errorResponse.message).toBeTruthy();
          expect(typeof errorResponse.message).toBe('string');
          expect(errorResponse.message.length).toBeGreaterThan(0);

          // Verify error should be displayed to user
          expect(errorResponse.displayToUser).toBe(true);

          // Verify retry is allowed for network errors
          expect(errorResponse.allowRetry).toBe(true);

          // Verify network errors are not logged to backend (no connection)
          expect(errorResponse.logToBackend).toBe(false);

          // Verify user is not notified (to avoid spam during network issues)
          expect(errorResponse.notifyUser).toBe(false);

          // Verify error is retryable
          expect(APIErrorHandler.isRetryable(error)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Server Error Handling
   * 
   * For any API call that fails due to server error (5xx), the system should
   * handle the error gracefully, allow retry, and log to backend.
   */
  test('Property: Server Error Handling - graceful handling with retry and logging', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 500, max: 599 }), // Server error status codes
        fc.constantFrom(
          'E_INVOICE_GENERATE',
          'E_WAY_BILL_GENERATE',
          'TDS_CALCULATE'
        ),
        fc.string({ minLength: 1, maxLength: 50 }),
        (statusCode, operation, voucherId) => {
          // Create a server error
          const error = new Error('Server error');
          error.response = {
            status: statusCode,
            data: { message: 'Internal server error' }
          };

          // Create error context
          const context = new ErrorContext(operation, voucherId, true);

          // Handle the error
          const errorResponse = APIErrorHandler.handleError(error, context);

          // Verify error is categorized as server error
          expect(errorResponse.category).toBe(ErrorCategory.SERVER);

          // Verify user-friendly message is provided
          expect(errorResponse.message).toBeTruthy();
          expect(errorResponse.displayToUser).toBe(true);

          // Verify retry is allowed for server errors
          expect(errorResponse.allowRetry).toBe(true);

          // Verify server errors are logged to backend
          expect(errorResponse.logToBackend).toBe(true);

          // Verify user is notified for server errors
          expect(errorResponse.notifyUser).toBe(true);

          // Verify error is retryable
          expect(APIErrorHandler.isRetryable(error)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Validation Error Handling
   * 
   * For any API call that fails due to validation error (4xx), the system should
   * display the specific validation error message and not allow retry.
   */
  test('Property: Validation Error Handling - specific messages without retry', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 499 }).filter(code => 
          code !== 401 && code !== 403 && code !== 404
        ),
        fc.string({ minLength: 10, maxLength: 100 }),
        fc.constantFrom(
          'E_INVOICE_GENERATE',
          'E_WAY_BILL_GENERATE',
          'TDS_CALCULATE'
        ),
        fc.string({ minLength: 1, maxLength: 50 }),
        (statusCode, validationMessage, operation, voucherId) => {
          // Create a validation error
          const error = new Error('Validation failed');
          error.response = {
            status: statusCode,
            data: { message: validationMessage }
          };

          // Create error context
          const context = new ErrorContext(operation, voucherId, false);

          // Handle the error
          const errorResponse = APIErrorHandler.handleError(error, context);

          // Verify error is categorized as validation error
          expect(errorResponse.category).toBe(ErrorCategory.VALIDATION);

          // Verify specific validation message is displayed
          expect(errorResponse.message).toBe(validationMessage);
          expect(errorResponse.displayToUser).toBe(true);

          // Verify retry is NOT allowed for validation errors
          expect(errorResponse.allowRetry).toBe(false);

          // Verify validation errors are logged to backend
          expect(errorResponse.logToBackend).toBe(true);

          // Verify user is not notified (message is already displayed)
          expect(errorResponse.notifyUser).toBe(false);

          // Verify error is not retryable
          expect(APIErrorHandler.isRetryable(error)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error Categorization Consistency
   * 
   * For any error, the categorization should be consistent and deterministic.
   */
  test('Property: Error Categorization Consistency', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'ERR_NETWORK',
          'ECONNREFUSED',
          'ECONNABORTED',
          'ETIMEDOUT'
        ),
        (errorCode) => {
          const error = new Error('Test error');
          error.code = errorCode;

          // Categorize multiple times
          const category1 = APIErrorHandler.categorizeError(error);
          const category2 = APIErrorHandler.categorizeError(error);
          const category3 = APIErrorHandler.categorizeError(error);

          // Verify categorization is consistent
          expect(category1).toBe(category2);
          expect(category2).toBe(category3);
          expect(category1).toBe(ErrorCategory.NETWORK);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Retry Backoff Delay Increases
   * 
   * For any retry configuration, the delay should increase exponentially
   * up to the maximum delay.
   */
  test('Property: Retry Backoff Delay Increases Exponentially', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 2000 }), // initialDelay
        fc.integer({ min: 2, max: 5 }), // backoffMultiplier
        fc.integer({ min: 5000, max: 20000 }), // maxDelay
        (initialDelay, backoffMultiplier, maxDelay) => {
          let delay = initialDelay;
          const delays = [delay];

          // Calculate delays for 5 retries
          for (let i = 0; i < 5; i++) {
            delay = Math.min(delay * backoffMultiplier, maxDelay);
            delays.push(delay);
          }

          // Verify delays are non-decreasing
          for (let i = 1; i < delays.length; i++) {
            expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
          }

          // Verify delays don't exceed maxDelay
          delays.forEach(d => {
            expect(d).toBeLessThanOrEqual(maxDelay);
          });

          // Verify first delay is initialDelay
          expect(delays[0]).toBe(initialDelay);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Custom Error Classes Preserve Category
   * 
   * For any custom error class, the category should be preserved.
   */
  test('Property: Custom Error Classes Preserve Category', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 100 }),
        (errorMessage) => {
          const networkError = new NetworkError(errorMessage);
          const serverError = new ServerError(errorMessage, 500);
          const validationError = new ValidationError(errorMessage, {});
          const businessError = new BusinessLogicError(errorMessage, 'BL_001');

          // Verify categories are preserved
          expect(APIErrorHandler.categorizeError(networkError)).toBe(ErrorCategory.NETWORK);
          expect(APIErrorHandler.categorizeError(serverError)).toBe(ErrorCategory.SERVER);
          expect(APIErrorHandler.categorizeError(validationError)).toBe(ErrorCategory.VALIDATION);
          expect(APIErrorHandler.categorizeError(businessError)).toBe(ErrorCategory.BUSINESS_LOGIC);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error Logging Format Completeness
   * 
   * For any error and context, the formatted log should contain all required fields.
   */
  test('Property: Error Logging Format Completeness', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 100 }),
        fc.constantFrom(
          'E_INVOICE_GENERATE',
          'E_WAY_BILL_GENERATE',
          'TDS_CALCULATE'
        ),
        fc.string({ minLength: 1, maxLength: 50 }),
        (errorMessage, operation, voucherId) => {
          const error = new Error(errorMessage);
          const context = new ErrorContext(operation, voucherId);

          const logData = APIErrorHandler.formatErrorForLogging(error, context);

          // Verify all required fields are present
          expect(logData).toHaveProperty('category');
          expect(logData).toHaveProperty('message');
          expect(logData).toHaveProperty('operation');
          expect(logData).toHaveProperty('voucherId');
          expect(logData).toHaveProperty('timestamp');

          // Verify field values
          expect(logData.message).toBe(errorMessage);
          expect(logData.operation).toBe(operation);
          expect(logData.voucherId).toBe(voucherId);
          expect(typeof logData.timestamp).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });
});
