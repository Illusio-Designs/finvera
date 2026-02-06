/**
 * Unit Tests for EWayBillService
 * 
 * Tests specific examples and edge cases for e-way bill management.
 * Validates: Requirements 3.1, 3.4, 3.5, 9.2
 */

import EWayBillService from '../EWayBillService';
import SettingsService from '../SettingsService';
import { eWayBillAPI } from '../../../lib/api';

// Mock the APIs
jest.mock('../../../lib/api', () => ({
  eWayBillAPI: {
    generate: jest.fn(),
    cancel: jest.fn(),
    getStatus: jest.fn(),
    updateVehicle: jest.fn(),
    retry: jest.fn(),
  },
}));

jest.mock('../SettingsService');

describe('EWayBillService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEWayBill', () => {
    test('should generate e-way bill successfully', async () => {
      // Mock settings
      SettingsService.getCompanySettings.mockResolvedValue({
        companyId: 'test-company',
        eWayBillEnabled: true,
        eWayBillThreshold: 50000,
      });

      const mockResponse = {
        data: {
          id: 'ewb-123',
          voucher_id: 'voucher-456',
          status: 'GENERATED',
          ewb_number: '123456789012',
          valid_until: '2024-01-18T10:30:00Z',
          vehicle_number: 'DL01AB1234',
          transporter_id: 'TRANS123',
          distance: 100,
          error_message: null,
          generated_at: '2024-01-15T10:30:00Z',
          cancelled_at: null,
          cancellation_reason: null,
        },
      };

      eWayBillAPI.generate.mockResolvedValueOnce(mockResponse);

      const result = await EWayBillService.generateEWayBill({
        voucherId: 'voucher-456',
        voucherType: 'SALES_INVOICE',
        amount: 75000,
        vehicleNumber: 'DL01AB1234',
        transporterId: 'TRANS123',
        distance: 100,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('ewb-123');
      expect(result.voucherId).toBe('voucher-456');
      expect(result.status).toBe('GENERATED');
      expect(result.ewbNumber).toBe('123456789012');
      expect(result.validUntil).toBeInstanceOf(Date);
      expect(result.vehicleNumber).toBe('DL01AB1234');
      expect(result.transporterId).toBe('TRANS123');
      expect(result.distance).toBe(100);
    });

    test('should throw error when voucher ID is missing', async () => {
      await expect(
        EWayBillService.generateEWayBill({
          voucherType: 'SALES_INVOICE',
          amount: 75000,
        })
      ).rejects.toThrow('Voucher ID is required');

      expect(eWayBillAPI.generate).not.toHaveBeenCalled();
    });

    test('should throw error when voucher type is missing', async () => {
      await expect(
        EWayBillService.generateEWayBill({
          voucherId: 'voucher-123',
          amount: 75000,
        })
      ).rejects.toThrow('Voucher type is required');

      expect(eWayBillAPI.generate).not.toHaveBeenCalled();
    });

    test('should throw error when amount is missing', async () => {
      await expect(
        EWayBillService.generateEWayBill({
          voucherId: 'voucher-123',
          voucherType: 'SALES_INVOICE',
        })
      ).rejects.toThrow('Amount is required for threshold checking');

      expect(eWayBillAPI.generate).not.toHaveBeenCalled();
    });

    test('should throw error when amount is below threshold', async () => {
      SettingsService.getCompanySettings.mockResolvedValue({
        companyId: 'test-company',
        eWayBillEnabled: true,
        eWayBillThreshold: 50000,
      });

      await expect(
        EWayBillService.generateEWayBill({
          voucherId: 'voucher-123',
          voucherType: 'SALES_INVOICE',
          amount: 40000,
        })
      ).rejects.toThrow('E-way bill not required');

      expect(eWayBillAPI.generate).not.toHaveBeenCalled();
    });

    test('should handle network error gracefully', async () => {
      SettingsService.getCompanySettings.mockResolvedValue({
        companyId: 'test-company',
        eWayBillEnabled: true,
        eWayBillThreshold: 50000,
      });

      const networkError = new Error('Network error');
      networkError.code = 'ERR_NETWORK';

      eWayBillAPI.generate.mockRejectedValue(networkError);

      await expect(
        EWayBillService.generateEWayBill({
          voucherId: 'voucher-123',
          voucherType: 'SALES_INVOICE',
          amount: 75000,
        })
      ).rejects.toThrow('Unable to generate e-way bill. Please check your internet connection.');
    }, 10000);

    test('should handle validation error', async () => {
      SettingsService.getCompanySettings.mockResolvedValue({
        companyId: 'test-company',
        eWayBillEnabled: true,
        eWayBillThreshold: 50000,
      });

      const validationError = new Error('Validation failed');
      validationError.response = {
        status: 400,
        data: {
          message: 'Invalid e-way bill data',
        },
      };

      eWayBillAPI.generate.mockRejectedValueOnce(validationError);

      await expect(
        EWayBillService.generateEWayBill({
          voucherId: 'voucher-123',
          voucherType: 'SALES_INVOICE',
          amount: 75000,
        })
      ).rejects.toThrow('Invalid e-way bill data');
    });
  });

  describe('checkThreshold', () => {
    test('should return true when amount meets threshold', async () => {
      SettingsService.getCompanySettings.mockResolvedValue({
        companyId: 'test-company',
        eWayBillEnabled: true,
        eWayBillThreshold: 50000,
      });

      const result = await EWayBillService.checkThreshold(50000);
      expect(result).toBe(true);
    });

    test('should return true when amount exceeds threshold', async () => {
      SettingsService.getCompanySettings.mockResolvedValue({
        companyId: 'test-company',
        eWayBillEnabled: true,
        eWayBillThreshold: 50000,
      });

      const result = await EWayBillService.checkThreshold(75000);
      expect(result).toBe(true);
    });

    test('should return false when amount is below threshold', async () => {
      SettingsService.getCompanySettings.mockResolvedValue({
        companyId: 'test-company',
        eWayBillEnabled: true,
        eWayBillThreshold: 50000,
      });

      const result = await EWayBillService.checkThreshold(40000);
      expect(result).toBe(false);
    });

    test('should return false when e-way bill is disabled', async () => {
      SettingsService.getCompanySettings.mockResolvedValue({
        companyId: 'test-company',
        eWayBillEnabled: false,
        eWayBillThreshold: 50000,
      });

      const result = await EWayBillService.checkThreshold(75000);
      expect(result).toBe(false);
    });

    test('should handle threshold at zero', async () => {
      SettingsService.getCompanySettings.mockResolvedValue({
        companyId: 'test-company',
        eWayBillEnabled: true,
        eWayBillThreshold: 0,
      });

      // When threshold is 0, any amount >= 0 should pass
      const resultAtZero = await EWayBillService.checkThreshold(0);
      expect(resultAtZero).toBe(true);

      const resultAboveZero = await EWayBillService.checkThreshold(1);
      expect(resultAboveZero).toBe(true);
    });

    test('should use default threshold when not specified', async () => {
      SettingsService.getCompanySettings.mockResolvedValue({
        companyId: 'test-company',
        eWayBillEnabled: true,
        eWayBillThreshold: undefined,
      });

      const result = await EWayBillService.checkThreshold(50000);
      expect(result).toBe(true);
    });

    test('should return false on error', async () => {
      SettingsService.getCompanySettings.mockRejectedValue(new Error('Settings error'));

      const result = await EWayBillService.checkThreshold(75000);
      expect(result).toBe(false);
    });
  });

  describe('updateVehicleDetails', () => {
    test('should update vehicle details successfully', async () => {
      const mockResponse = {
        data: {
          id: 'ewb-123',
          voucher_id: 'voucher-456',
          status: 'GENERATED',
          ewb_number: '123456789012',
          valid_until: '2024-01-18T10:30:00Z',
          vehicle_number: 'DL02CD5678',
          transporter_id: 'TRANS123',
          distance: 100,
          error_message: null,
          generated_at: '2024-01-15T10:30:00Z',
          cancelled_at: null,
          cancellation_reason: null,
        },
      };

      eWayBillAPI.updateVehicle.mockResolvedValueOnce(mockResponse);

      const result = await EWayBillService.updateVehicleDetails({
        id: 'ewb-123',
        vehicleNumber: 'DL02CD5678',
        reasonCode: '1',
        reasonRemark: 'Vehicle breakdown',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('ewb-123');
      expect(result.vehicleNumber).toBe('DL02CD5678');
      expect(result.status).toBe('GENERATED');
    });

    test('should throw error when e-way bill ID is missing', async () => {
      await expect(
        EWayBillService.updateVehicleDetails({
          vehicleNumber: 'DL02CD5678',
          reasonCode: '1',
          reasonRemark: 'Test',
        })
      ).rejects.toThrow('E-way bill ID is required');
    });

    test('should throw error when vehicle number is missing', async () => {
      await expect(
        EWayBillService.updateVehicleDetails({
          id: 'ewb-123',
          reasonCode: '1',
          reasonRemark: 'Test',
        })
      ).rejects.toThrow('Vehicle number is required');
    });

    test('should throw error when reason code is missing', async () => {
      await expect(
        EWayBillService.updateVehicleDetails({
          id: 'ewb-123',
          vehicleNumber: 'DL02CD5678',
          reasonRemark: 'Test',
        })
      ).rejects.toThrow('Reason code is required');
    });

    test('should throw error when reason remark is missing', async () => {
      await expect(
        EWayBillService.updateVehicleDetails({
          id: 'ewb-123',
          vehicleNumber: 'DL02CD5678',
          reasonCode: '1',
        })
      ).rejects.toThrow('Reason remark is required');
    });
  });

  describe('cancelEWayBill', () => {
    test('should cancel e-way bill successfully', async () => {
      const mockResponse = {
        data: {
          id: 'ewb-123',
          voucher_id: 'voucher-456',
          status: 'CANCELLED',
          ewb_number: '123456789012',
          valid_until: '2024-01-18T10:30:00Z',
          vehicle_number: 'DL01AB1234',
          transporter_id: 'TRANS123',
          distance: 100,
          error_message: null,
          generated_at: '2024-01-15T10:30:00Z',
          cancelled_at: '2024-01-15T11:00:00Z',
          cancellation_reason: 'Duplicate entry',
        },
      };

      eWayBillAPI.cancel.mockResolvedValueOnce(mockResponse);

      const result = await EWayBillService.cancelEWayBill({
        voucherId: 'voucher-456',
        ewbNumber: '123456789012',
        reason: 'Duplicate entry',
        reasonCode: '2',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('CANCELLED');
      expect(result.cancelledAt).toBeInstanceOf(Date);
      expect(result.cancellationReason).toBe('Duplicate entry');
    });

    test('should throw error when voucher ID is missing', async () => {
      await expect(
        EWayBillService.cancelEWayBill({
          ewbNumber: '123456789012',
          reason: 'Test',
          reasonCode: '2',
        })
      ).rejects.toThrow('Voucher ID is required');
    });

    test('should throw error when e-way bill number is missing', async () => {
      await expect(
        EWayBillService.cancelEWayBill({
          voucherId: 'voucher-123',
          reason: 'Test',
          reasonCode: '2',
        })
      ).rejects.toThrow('E-way bill number is required');
    });

    test('should throw error when reason is missing', async () => {
      await expect(
        EWayBillService.cancelEWayBill({
          voucherId: 'voucher-123',
          ewbNumber: '123456789012',
          reasonCode: '2',
        })
      ).rejects.toThrow('Cancellation reason is required');
    });

    test('should throw error when reason code is missing', async () => {
      await expect(
        EWayBillService.cancelEWayBill({
          voucherId: 'voucher-123',
          ewbNumber: '123456789012',
          reason: 'Test',
        })
      ).rejects.toThrow('Cancellation reason code is required');
    });
  });

  describe('getEWayBillStatus', () => {
    test('should get e-way bill status successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'ewb-123',
            voucher_id: 'voucher-456',
            status: 'GENERATED',
            ewb_number: '123456789012',
            valid_until: '2024-01-18T10:30:00Z',
            vehicle_number: 'DL01AB1234',
            transporter_id: 'TRANS123',
            distance: 100,
            error_message: null,
            generated_at: '2024-01-15T10:30:00Z',
            cancelled_at: null,
            cancellation_reason: null,
          },
        },
      };

      eWayBillAPI.getStatus.mockResolvedValueOnce(mockResponse);

      const result = await EWayBillService.getEWayBillStatus('voucher-456');

      expect(result).toBeDefined();
      expect(result.voucherId).toBe('voucher-456');
      expect(result.status).toBe('GENERATED');
      expect(result.ewbNumber).toBe('123456789012');
    });

    test('should return null when e-way bill not found (404)', async () => {
      const notFoundError = new Error('Not found');
      notFoundError.response = {
        status: 404,
      };

      eWayBillAPI.getStatus.mockRejectedValueOnce(notFoundError);

      const result = await EWayBillService.getEWayBillStatus('voucher-456');

      expect(result).toBeNull();
    });

    test('should throw error when voucher ID is missing', async () => {
      await expect(
        EWayBillService.getEWayBillStatus()
      ).rejects.toThrow('Voucher ID is required');
    });

    test('should return null when response data is empty', async () => {
      const mockResponse = {
        data: {},
      };

      eWayBillAPI.getStatus.mockResolvedValueOnce(mockResponse);

      const result = await EWayBillService.getEWayBillStatus('voucher-456');

      expect(result).toBeNull();
    });
  });

  describe('retryEWayBillGeneration', () => {
    test('should retry e-way bill generation successfully', async () => {
      const mockResponse = {
        data: {
          id: 'ewb-123',
          voucher_id: 'voucher-456',
          status: 'GENERATED',
          ewb_number: '123456789012',
          valid_until: '2024-01-18T10:30:00Z',
          vehicle_number: null,
          transporter_id: null,
          distance: null,
          error_message: null,
          generated_at: '2024-01-15T10:30:00Z',
          cancelled_at: null,
          cancellation_reason: null,
        },
      };

      eWayBillAPI.retry.mockResolvedValueOnce(mockResponse);

      const result = await EWayBillService.retryEWayBillGeneration('ewb-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('ewb-123');
      expect(result.status).toBe('GENERATED');
    });

    test('should throw error when e-way bill ID is missing', async () => {
      await expect(
        EWayBillService.retryEWayBillGeneration()
      ).rejects.toThrow('E-way bill ID is required');
    });

    test('should handle network error with retry', async () => {
      const networkError = new Error('Network error');
      networkError.code = 'ERR_NETWORK';

      const mockSuccess = {
        data: {
          id: 'ewb-123',
          voucher_id: 'voucher-456',
          status: 'GENERATED',
          ewb_number: '123456789012',
          valid_until: '2024-01-18T10:30:00Z',
          vehicle_number: null,
          transporter_id: null,
          distance: null,
          error_message: null,
          generated_at: '2024-01-15T10:30:00Z',
          cancelled_at: null,
          cancellation_reason: null,
        },
      };

      // Fail twice, succeed on third attempt
      eWayBillAPI.retry
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(mockSuccess);

      const result = await EWayBillService.retryEWayBillGeneration('ewb-123');

      expect(result).toBeDefined();
      expect(result.status).toBe('GENERATED');
      expect(eWayBillAPI.retry).toHaveBeenCalledTimes(3);
    });
  });

  describe('Data parsing', () => {
    test('should parse snake_case response correctly', async () => {
      SettingsService.getCompanySettings.mockResolvedValue({
        companyId: 'test-company',
        eWayBillEnabled: true,
        eWayBillThreshold: 50000,
      });

      const mockResponse = {
        data: {
          id: 'ewb-123',
          voucher_id: 'voucher-456',
          status: 'GENERATED',
          ewb_number: '123456789012',
          valid_until: '2024-01-18T10:30:00Z',
          vehicle_number: 'DL01AB1234',
          transporter_id: 'TRANS123',
          distance: 100,
          error_message: null,
          generated_at: '2024-01-15T10:30:00Z',
          cancelled_at: null,
          cancellation_reason: null,
        },
      };

      eWayBillAPI.generate.mockResolvedValueOnce(mockResponse);

      const result = await EWayBillService.generateEWayBill({
        voucherId: 'voucher-456',
        voucherType: 'SALES_INVOICE',
        amount: 75000,
      });

      expect(result.voucherId).toBe('voucher-456');
      expect(result.ewbNumber).toBe('123456789012');
      expect(result.vehicleNumber).toBe('DL01AB1234');
      expect(result.transporterId).toBe('TRANS123');
      expect(result.errorMessage).toBeNull();
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.cancelledAt).toBeNull();
      expect(result.cancellationReason).toBeNull();
    });

    test('should parse camelCase response correctly', async () => {
      SettingsService.getCompanySettings.mockResolvedValue({
        companyId: 'test-company',
        eWayBillEnabled: true,
        eWayBillThreshold: 50000,
      });

      const mockResponse = {
        data: {
          id: 'ewb-123',
          voucherId: 'voucher-456',
          status: 'GENERATED',
          ewbNumber: '123456789012',
          validUntil: '2024-01-18T10:30:00Z',
          vehicleNumber: 'DL01AB1234',
          transporterId: 'TRANS123',
          distance: 100,
          errorMessage: null,
          generatedAt: '2024-01-15T10:30:00Z',
          cancelledAt: null,
          cancellationReason: null,
        },
      };

      eWayBillAPI.generate.mockResolvedValueOnce(mockResponse);

      const result = await EWayBillService.generateEWayBill({
        voucherId: 'voucher-456',
        voucherType: 'SALES_INVOICE',
        amount: 75000,
      });

      expect(result.voucherId).toBe('voucher-456');
      expect(result.ewbNumber).toBe('123456789012');
      expect(result.vehicleNumber).toBe('DL01AB1234');
    });

    test('should handle null date fields', async () => {
      SettingsService.getCompanySettings.mockResolvedValue({
        companyId: 'test-company',
        eWayBillEnabled: true,
        eWayBillThreshold: 50000,
      });

      const mockResponse = {
        data: {
          id: 'ewb-123',
          voucher_id: 'voucher-456',
          status: 'PENDING',
          ewb_number: null,
          valid_until: null,
          vehicle_number: null,
          transporter_id: null,
          distance: null,
          error_message: null,
          generated_at: null,
          cancelled_at: null,
          cancellation_reason: null,
        },
      };

      eWayBillAPI.generate.mockResolvedValueOnce(mockResponse);

      const result = await EWayBillService.generateEWayBill({
        voucherId: 'voucher-456',
        voucherType: 'SALES_INVOICE',
        amount: 75000,
      });

      expect(result.validUntil).toBeNull();
      expect(result.generatedAt).toBeNull();
      expect(result.cancelledAt).toBeNull();
    });
  });
});
