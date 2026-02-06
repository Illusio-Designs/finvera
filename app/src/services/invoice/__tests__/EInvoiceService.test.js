/**
 * Unit Tests for EInvoiceService
 * 
 * Tests specific examples and edge cases for e-invoice management.
 * Validates: Requirements 2.1, 2.4, 2.5, 9.1
 */

import EInvoiceService from '../EInvoiceService';
import { eInvoiceAPI } from '../../../lib/api';

// Mock the API
jest.mock('../../../lib/api', () => ({
  eInvoiceAPI: {
    generate: jest.fn(),
    cancel: jest.fn(),
    getStatus: jest.fn(),
    retry: jest.fn(),
  },
}));

describe('EInvoiceService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEInvoice', () => {
    test('should generate e-invoice successfully', async () => {
      const mockResponse = {
        data: {
          id: 'einvoice-123',
          voucher_id: 'voucher-456',
          status: 'GENERATED',
          irn: 'IRN-ABC123XYZ',
          ack_no: 'ACK-789',
          ack_date: '2024-01-15T10:30:00Z',
          qr_code: 'QR-CODE-DATA',
          error_message: null,
          generated_at: '2024-01-15T10:30:00Z',
          cancelled_at: null,
          cancellation_reason: null,
        },
      };

      eInvoiceAPI.generate.mockResolvedValueOnce(mockResponse);

      const result = await EInvoiceService.generateEInvoice({
        voucherId: 'voucher-456',
        voucherType: 'SALES_INVOICE',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('einvoice-123');
      expect(result.voucherId).toBe('voucher-456');
      expect(result.status).toBe('GENERATED');
      expect(result.irn).toBe('IRN-ABC123XYZ');
      expect(result.ackNo).toBe('ACK-789');
      expect(result.ackDate).toBeInstanceOf(Date);
      expect(result.qrCode).toBe('QR-CODE-DATA');
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    test('should throw error when voucher ID is missing', async () => {
      await expect(
        EInvoiceService.generateEInvoice({
          voucherType: 'SALES_INVOICE',
        })
      ).rejects.toThrow('Voucher ID is required');

      expect(eInvoiceAPI.generate).not.toHaveBeenCalled();
    });

    test('should throw error when voucher type is missing', async () => {
      await expect(
        EInvoiceService.generateEInvoice({
          voucherId: 'voucher-123',
        })
      ).rejects.toThrow('Voucher type is required');

      expect(eInvoiceAPI.generate).not.toHaveBeenCalled();
    });

    test('should handle network error gracefully', async () => {
      const networkError = new Error('Network error');
      networkError.code = 'ERR_NETWORK';

      eInvoiceAPI.generate.mockRejectedValue(networkError);

      await expect(
        EInvoiceService.generateEInvoice({
          voucherId: 'voucher-123',
          voucherType: 'SALES_INVOICE',
        })
      ).rejects.toThrow('Unable to generate e-invoice. Please check your internet connection.');
    }, 10000); // 10 second timeout for retry tests

    test('should handle validation error', async () => {
      const validationError = new Error('Validation failed');
      validationError.response = {
        status: 400,
        data: {
          message: 'Invalid invoice data',
        },
      };

      eInvoiceAPI.generate.mockRejectedValueOnce(validationError);

      await expect(
        EInvoiceService.generateEInvoice({
          voucherId: 'voucher-123',
          voucherType: 'SALES_INVOICE',
        })
      ).rejects.toThrow('Invalid invoice data');
    });

    test('should handle server error', async () => {
      const serverError = new Error('Server error');
      serverError.response = {
        status: 500,
        data: {},
      };

      eInvoiceAPI.generate.mockRejectedValue(serverError);

      await expect(
        EInvoiceService.generateEInvoice({
          voucherId: 'voucher-123',
          voucherType: 'SALES_INVOICE',
        })
      ).rejects.toThrow('Server error occurred while trying to generate e-invoice.');
    }, 10000); // 10 second timeout for retry tests
  });

  describe('cancelEInvoice', () => {
    test('should cancel e-invoice successfully', async () => {
      const mockResponse = {
        data: {
          id: 'einvoice-123',
          voucher_id: 'voucher-456',
          status: 'CANCELLED',
          irn: 'IRN-ABC123XYZ',
          ack_no: 'ACK-789',
          ack_date: '2024-01-15T10:30:00Z',
          qr_code: 'QR-CODE-DATA',
          error_message: null,
          generated_at: '2024-01-15T10:30:00Z',
          cancelled_at: '2024-01-15T11:00:00Z',
          cancellation_reason: 'Duplicate entry',
        },
      };

      eInvoiceAPI.cancel.mockResolvedValueOnce(mockResponse);

      const result = await EInvoiceService.cancelEInvoice({
        voucherId: 'voucher-456',
        irn: 'IRN-ABC123XYZ',
        reason: 'Duplicate entry',
        reasonCode: '1',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('CANCELLED');
      expect(result.cancelledAt).toBeInstanceOf(Date);
      expect(result.cancellationReason).toBe('Duplicate entry');
    });

    test('should throw error when voucher ID is missing', async () => {
      await expect(
        EInvoiceService.cancelEInvoice({
          irn: 'IRN-ABC123XYZ',
          reason: 'Test',
          reasonCode: '1',
        })
      ).rejects.toThrow('Voucher ID is required');
    });

    test('should throw error when IRN is missing', async () => {
      await expect(
        EInvoiceService.cancelEInvoice({
          voucherId: 'voucher-123',
          reason: 'Test',
          reasonCode: '1',
        })
      ).rejects.toThrow('IRN is required');
    });

    test('should throw error when reason is missing', async () => {
      await expect(
        EInvoiceService.cancelEInvoice({
          voucherId: 'voucher-123',
          irn: 'IRN-ABC123XYZ',
          reasonCode: '1',
        })
      ).rejects.toThrow('Cancellation reason is required');
    });

    test('should throw error when reason code is missing', async () => {
      await expect(
        EInvoiceService.cancelEInvoice({
          voucherId: 'voucher-123',
          irn: 'IRN-ABC123XYZ',
          reason: 'Test',
        })
      ).rejects.toThrow('Cancellation reason code is required');
    });
  });

  describe('getEInvoiceStatus', () => {
    test('should get e-invoice status successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'einvoice-123',
            voucher_id: 'voucher-456',
            status: 'GENERATED',
            irn: 'IRN-ABC123XYZ',
            ack_no: 'ACK-789',
            ack_date: '2024-01-15T10:30:00Z',
            qr_code: 'QR-CODE-DATA',
            error_message: null,
            generated_at: '2024-01-15T10:30:00Z',
            cancelled_at: null,
            cancellation_reason: null,
          },
        },
      };

      eInvoiceAPI.getStatus.mockResolvedValueOnce(mockResponse);

      const result = await EInvoiceService.getEInvoiceStatus('voucher-456');

      expect(result).toBeDefined();
      expect(result.voucherId).toBe('voucher-456');
      expect(result.status).toBe('GENERATED');
    });

    test('should return null when e-invoice not found (404)', async () => {
      const notFoundError = new Error('Not found');
      notFoundError.response = {
        status: 404,
      };

      eInvoiceAPI.getStatus.mockRejectedValueOnce(notFoundError);

      const result = await EInvoiceService.getEInvoiceStatus('voucher-456');

      expect(result).toBeNull();
    });

    test('should throw error when voucher ID is missing', async () => {
      await expect(
        EInvoiceService.getEInvoiceStatus()
      ).rejects.toThrow('Voucher ID is required');
    });

    test('should return null when response data is empty', async () => {
      const mockResponse = {
        data: {},
      };

      eInvoiceAPI.getStatus.mockResolvedValueOnce(mockResponse);

      const result = await EInvoiceService.getEInvoiceStatus('voucher-456');

      expect(result).toBeNull();
    });
  });

  describe('retryEInvoiceGeneration', () => {
    test('should retry e-invoice generation successfully', async () => {
      const mockResponse = {
        data: {
          id: 'einvoice-123',
          voucher_id: 'voucher-456',
          status: 'GENERATED',
          irn: 'IRN-ABC123XYZ',
          ack_no: 'ACK-789',
          ack_date: '2024-01-15T10:30:00Z',
          qr_code: 'QR-CODE-DATA',
          error_message: null,
          generated_at: '2024-01-15T10:30:00Z',
          cancelled_at: null,
          cancellation_reason: null,
        },
      };

      eInvoiceAPI.retry.mockResolvedValueOnce(mockResponse);

      const result = await EInvoiceService.retryEInvoiceGeneration('einvoice-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('einvoice-123');
      expect(result.status).toBe('GENERATED');
    });

    test('should throw error when e-invoice ID is missing', async () => {
      await expect(
        EInvoiceService.retryEInvoiceGeneration()
      ).rejects.toThrow('E-invoice ID is required');
    });

    test('should handle network error with retry', async () => {
      const networkError = new Error('Network error');
      networkError.code = 'ERR_NETWORK';

      const mockSuccess = {
        data: {
          id: 'einvoice-123',
          voucher_id: 'voucher-456',
          status: 'GENERATED',
          irn: 'IRN-ABC123XYZ',
          ack_no: 'ACK-789',
          ack_date: '2024-01-15T10:30:00Z',
          qr_code: 'QR-CODE-DATA',
          error_message: null,
          generated_at: '2024-01-15T10:30:00Z',
          cancelled_at: null,
          cancellation_reason: null,
        },
      };

      // Fail twice, succeed on third attempt
      eInvoiceAPI.retry
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(mockSuccess);

      const result = await EInvoiceService.retryEInvoiceGeneration('einvoice-123');

      expect(result).toBeDefined();
      expect(result.status).toBe('GENERATED');
      expect(eInvoiceAPI.retry).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error handling', () => {
    test('should handle timeout error', async () => {
      const timeoutError = new Error('timeout of 30000ms exceeded');
      timeoutError.code = 'ECONNABORTED';

      eInvoiceAPI.generate.mockRejectedValue(timeoutError);

      await expect(
        EInvoiceService.generateEInvoice({
          voucherId: 'voucher-123',
          voucherType: 'SALES_INVOICE',
        })
      ).rejects.toThrow('Unable to generate e-invoice. Please check your internet connection.');
    }, 10000); // 10 second timeout for retry tests

    test('should handle connection refused error', async () => {
      const connError = new Error('Connection refused');
      connError.code = 'ECONNREFUSED';

      eInvoiceAPI.generate.mockRejectedValue(connError);

      await expect(
        EInvoiceService.generateEInvoice({
          voucherId: 'voucher-123',
          voucherType: 'SALES_INVOICE',
        })
      ).rejects.toThrow('Unable to generate e-invoice. Please check your internet connection.');
    }, 10000); // 10 second timeout for retry tests

    test('should handle 401 unauthorized error', async () => {
      const authError = new Error('Unauthorized');
      authError.response = {
        status: 401,
        data: {
          message: 'Invalid credentials',
        },
      };

      eInvoiceAPI.generate.mockRejectedValueOnce(authError);

      await expect(
        EInvoiceService.generateEInvoice({
          voucherId: 'voucher-123',
          voucherType: 'SALES_INVOICE',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    test('should handle 403 forbidden error', async () => {
      const forbiddenError = new Error('Forbidden');
      forbiddenError.response = {
        status: 403,
        data: {
          message: 'Access denied',
        },
      };

      eInvoiceAPI.generate.mockRejectedValueOnce(forbiddenError);

      await expect(
        EInvoiceService.generateEInvoice({
          voucherId: 'voucher-123',
          voucherType: 'SALES_INVOICE',
        })
      ).rejects.toThrow('Access denied');
    });

    test('should handle unknown error', async () => {
      const unknownError = new Error('Something went wrong');

      eInvoiceAPI.generate.mockRejectedValue(unknownError);

      await expect(
        EInvoiceService.generateEInvoice({
          voucherId: 'voucher-123',
          voucherType: 'SALES_INVOICE',
        })
      ).rejects.toThrow('Something went wrong');
    });
  });

  describe('Data parsing', () => {
    test('should parse snake_case response correctly', async () => {
      const mockResponse = {
        data: {
          id: 'einvoice-123',
          voucher_id: 'voucher-456',
          status: 'GENERATED',
          irn: 'IRN-ABC123XYZ',
          ack_no: 'ACK-789',
          ack_date: '2024-01-15T10:30:00Z',
          qr_code: 'QR-CODE-DATA',
          error_message: null,
          generated_at: '2024-01-15T10:30:00Z',
          cancelled_at: null,
          cancellation_reason: null,
        },
      };

      eInvoiceAPI.generate.mockResolvedValueOnce(mockResponse);

      const result = await EInvoiceService.generateEInvoice({
        voucherId: 'voucher-456',
        voucherType: 'SALES_INVOICE',
      });

      expect(result.voucherId).toBe('voucher-456');
      expect(result.ackNo).toBe('ACK-789');
      expect(result.qrCode).toBe('QR-CODE-DATA');
      expect(result.errorMessage).toBeNull();
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.cancelledAt).toBeNull();
      expect(result.cancellationReason).toBeNull();
    });

    test('should parse camelCase response correctly', async () => {
      const mockResponse = {
        data: {
          id: 'einvoice-123',
          voucherId: 'voucher-456',
          status: 'GENERATED',
          irn: 'IRN-ABC123XYZ',
          ackNo: 'ACK-789',
          ackDate: '2024-01-15T10:30:00Z',
          qrCode: 'QR-CODE-DATA',
          errorMessage: null,
          generatedAt: '2024-01-15T10:30:00Z',
          cancelledAt: null,
          cancellationReason: null,
        },
      };

      eInvoiceAPI.generate.mockResolvedValueOnce(mockResponse);

      const result = await EInvoiceService.generateEInvoice({
        voucherId: 'voucher-456',
        voucherType: 'SALES_INVOICE',
      });

      expect(result.voucherId).toBe('voucher-456');
      expect(result.ackNo).toBe('ACK-789');
      expect(result.qrCode).toBe('QR-CODE-DATA');
    });

    test('should handle null date fields', async () => {
      const mockResponse = {
        data: {
          id: 'einvoice-123',
          voucher_id: 'voucher-456',
          status: 'PENDING',
          irn: null,
          ack_no: null,
          ack_date: null,
          qr_code: null,
          error_message: null,
          generated_at: null,
          cancelled_at: null,
          cancellation_reason: null,
        },
      };

      eInvoiceAPI.generate.mockResolvedValueOnce(mockResponse);

      const result = await EInvoiceService.generateEInvoice({
        voucherId: 'voucher-456',
        voucherType: 'SALES_INVOICE',
      });

      expect(result.ackDate).toBeNull();
      expect(result.generatedAt).toBeNull();
      expect(result.cancelledAt).toBeNull();
    });
  });
});
