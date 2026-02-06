/**
 * Unit Tests for TDSService
 * 
 * Tests specific examples and edge cases for TDS calculation and management.
 * Validates: Requirements 4.1, 9.3
 */

import TDSService from '../TDSService';
import { tdsAPI } from '../../../lib/api';

// Mock the API
jest.mock('../../../lib/api', () => ({
  tdsAPI: {
    calculate: jest.fn(),
    getDetails: jest.fn(),
    getRates: jest.fn(),
  },
}));

describe('TDSService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateTDS', () => {
    test('should calculate TDS successfully for 194C section', async () => {
      const mockResponse = {
        data: {
          id: 'tds-123',
          voucher_id: 'voucher-456',
          section: '194C',
          rate: 0.01,
          amount: 1000,
          deductee_type: 'COMPANY',
          pan_number: 'ABCDE1234F',
          calculated_at: '2024-01-15T10:30:00Z',
        },
      };

      tdsAPI.calculate.mockResolvedValueOnce(mockResponse);

      const result = await TDSService.calculateTDS({
        voucherId: 'voucher-456',
        amount: 100000,
        section: '194C',
        deducteeType: 'COMPANY',
        panNumber: 'ABCDE1234F',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('tds-123');
      expect(result.voucherId).toBe('voucher-456');
      expect(result.section).toBe('194C');
      expect(result.rate).toBe(0.01);
      expect(result.amount).toBe(1000);
      expect(result.deducteeType).toBe('COMPANY');
      expect(result.panNumber).toBe('ABCDE1234F');
      expect(result.calculatedAt).toBeInstanceOf(Date);
    });

    test('should calculate TDS successfully for 194J section', async () => {
      const mockResponse = {
        data: {
          id: 'tds-124',
          voucher_id: 'voucher-457',
          section: '194J',
          rate: 0.10,
          amount: 10000,
          deductee_type: 'INDIVIDUAL',
          pan_number: null,
          calculated_at: '2024-01-15T10:30:00Z',
        },
      };

      tdsAPI.calculate.mockResolvedValueOnce(mockResponse);

      const result = await TDSService.calculateTDS({
        voucherId: 'voucher-457',
        amount: 100000,
        section: '194J',
        deducteeType: 'INDIVIDUAL',
      });

      expect(result).toBeDefined();
      expect(result.section).toBe('194J');
      expect(result.rate).toBe(0.10);
      expect(result.amount).toBe(10000);
    });

    test('should throw error when voucher ID is missing', async () => {
      await expect(
        TDSService.calculateTDS({
          amount: 100000,
          section: '194C',
          deducteeType: 'COMPANY',
        })
      ).rejects.toThrow('Voucher ID is required');

      expect(tdsAPI.calculate).not.toHaveBeenCalled();
    });

    test('should throw error when amount is missing', async () => {
      await expect(
        TDSService.calculateTDS({
          voucherId: 'voucher-123',
          section: '194C',
          deducteeType: 'COMPANY',
        })
      ).rejects.toThrow('Amount is required');

      expect(tdsAPI.calculate).not.toHaveBeenCalled();
    });

    test('should throw error when amount is negative', async () => {
      await expect(
        TDSService.calculateTDS({
          voucherId: 'voucher-123',
          amount: -1000,
          section: '194C',
          deducteeType: 'COMPANY',
        })
      ).rejects.toThrow('Amount cannot be negative');

      expect(tdsAPI.calculate).not.toHaveBeenCalled();
    });

    test('should throw error when section is missing', async () => {
      await expect(
        TDSService.calculateTDS({
          voucherId: 'voucher-123',
          amount: 100000,
          deducteeType: 'COMPANY',
        })
      ).rejects.toThrow('TDS section is required');

      expect(tdsAPI.calculate).not.toHaveBeenCalled();
    });

    test('should throw error when deductee type is missing', async () => {
      await expect(
        TDSService.calculateTDS({
          voucherId: 'voucher-123',
          amount: 100000,
          section: '194C',
        })
      ).rejects.toThrow('Deductee type is required');

      expect(tdsAPI.calculate).not.toHaveBeenCalled();
    });

    test('should throw error when PAN number is invalid', async () => {
      await expect(
        TDSService.calculateTDS({
          voucherId: 'voucher-123',
          amount: 100000,
          section: '194C',
          deducteeType: 'COMPANY',
          panNumber: 'INVALID',
        })
      ).rejects.toThrow('Invalid PAN number format');

      expect(tdsAPI.calculate).not.toHaveBeenCalled();
    });

    test('should handle zero amount', async () => {
      const mockResponse = {
        data: {
          id: 'tds-125',
          voucher_id: 'voucher-458',
          section: '194C',
          rate: 0.01,
          amount: 0,
          deductee_type: 'COMPANY',
          pan_number: null,
          calculated_at: '2024-01-15T10:30:00Z',
        },
      };

      tdsAPI.calculate.mockResolvedValueOnce(mockResponse);

      const result = await TDSService.calculateTDS({
        voucherId: 'voucher-458',
        amount: 0,
        section: '194C',
        deducteeType: 'COMPANY',
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(0);
    });

    test('should handle network error gracefully', async () => {
      const networkError = new Error('Network error');
      networkError.code = 'ERR_NETWORK';

      tdsAPI.calculate.mockRejectedValueOnce(networkError);

      await expect(
        TDSService.calculateTDS({
          voucherId: 'voucher-123',
          amount: 100000,
          section: '194C',
          deducteeType: 'COMPANY',
        })
      ).rejects.toThrow('Unable to calculate TDS. Please check your internet connection.');
    });

    test('should handle validation error', async () => {
      const validationError = new Error('Validation failed');
      validationError.response = {
        status: 400,
        data: {
          message: 'Invalid TDS section',
        },
      };

      tdsAPI.calculate.mockRejectedValueOnce(validationError);

      await expect(
        TDSService.calculateTDS({
          voucherId: 'voucher-123',
          amount: 100000,
          section: 'INVALID',
          deducteeType: 'COMPANY',
        })
      ).rejects.toThrow('Invalid TDS section');
    });

    test('should handle server error', async () => {
      const serverError = new Error('Server error');
      serverError.response = {
        status: 500,
        data: {},
      };

      tdsAPI.calculate.mockRejectedValueOnce(serverError);

      await expect(
        TDSService.calculateTDS({
          voucherId: 'voucher-123',
          amount: 100000,
          section: '194C',
          deducteeType: 'COMPANY',
        })
      ).rejects.toThrow('Server error occurred while trying to calculate TDS.');
    });
  });

  describe('getTDSDetails', () => {
    test('should get TDS details successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 'tds-123',
              voucher_id: 'voucher-456',
              section: '194C',
              rate: 0.01,
              amount: 1000,
              deductee_type: 'COMPANY',
              pan_number: 'ABCDE1234F',
              calculated_at: '2024-01-15T10:30:00Z',
            },
          ],
        },
      };

      tdsAPI.getDetails.mockResolvedValueOnce(mockResponse);

      const result = await TDSService.getTDSDetails('voucher-456');

      expect(result).toBeDefined();
      expect(result.voucherId).toBe('voucher-456');
      expect(result.section).toBe('194C');
      expect(result.rate).toBe(0.01);
      expect(result.amount).toBe(1000);
    });

    test('should return null when TDS not found (404)', async () => {
      const notFoundError = new Error('Not found');
      notFoundError.response = {
        status: 404,
      };

      tdsAPI.getDetails.mockRejectedValueOnce(notFoundError);

      const result = await TDSService.getTDSDetails('voucher-456');

      expect(result).toBeNull();
    });

    test('should throw error when voucher ID is missing', async () => {
      await expect(
        TDSService.getTDSDetails()
      ).rejects.toThrow('Voucher ID is required');
    });

    test('should return null when response data is empty', async () => {
      const mockResponse = {
        data: {
          data: [],
        },
      };

      tdsAPI.getDetails.mockResolvedValueOnce(mockResponse);

      const result = await TDSService.getTDSDetails('voucher-456');

      expect(result).toBeNull();
    });

    test('should return null when response has no data field', async () => {
      const mockResponse = {
        data: {},
      };

      tdsAPI.getDetails.mockResolvedValueOnce(mockResponse);

      const result = await TDSService.getTDSDetails('voucher-456');

      expect(result).toBeNull();
    });
  });

  describe('getTDSRates', () => {
    test('should get TDS rates successfully (array format)', async () => {
      const mockResponse = {
        data: {
          data: [
            { section: '194C', rate: 0.01 },
            { section: '194J', rate: 0.10 },
            { section: '194H', rate: 0.05 },
            { section: '194I', rate: 0.10 },
            { section: '194A', rate: 0.10 },
          ],
        },
      };

      tdsAPI.getRates.mockResolvedValueOnce(mockResponse);

      const result = await TDSService.getTDSRates();

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(5);
      expect(result.get('194C')).toBe(0.01);
      expect(result.get('194J')).toBe(0.10);
      expect(result.get('194H')).toBe(0.05);
      expect(result.get('194I')).toBe(0.10);
      expect(result.get('194A')).toBe(0.10);
    });

    test('should get TDS rates successfully (object format)', async () => {
      const mockResponse = {
        data: {
          data: {
            '194C': 0.01,
            '194J': 0.10,
            '194H': 0.05,
            '194I': 0.10,
            '194A': 0.10,
          },
        },
      };

      tdsAPI.getRates.mockResolvedValueOnce(mockResponse);

      const result = await TDSService.getTDSRates();

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(5);
      expect(result.get('194C')).toBe(0.01);
      expect(result.get('194J')).toBe(0.10);
    });

    test('should handle empty rates response', async () => {
      const mockResponse = {
        data: {
          data: [],
        },
      };

      tdsAPI.getRates.mockResolvedValueOnce(mockResponse);

      const result = await TDSService.getTDSRates();

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    test('should throw error when response is invalid', async () => {
      const mockResponse = {
        data: {},
      };

      tdsAPI.getRates.mockResolvedValueOnce(mockResponse);

      await expect(
        TDSService.getTDSRates()
      ).rejects.toThrow('Invalid TDS rates response');
    });

    test('should handle network error', async () => {
      const networkError = new Error('Network error');
      networkError.code = 'ERR_NETWORK';

      tdsAPI.getRates.mockRejectedValueOnce(networkError);

      await expect(
        TDSService.getTDSRates()
      ).rejects.toThrow('Unable to get TDS rates. Please check your internet connection.');
    });
  });

  describe('validatePAN', () => {
    test('should validate correct PAN format', () => {
      expect(TDSService.validatePAN('ABCDE1234F')).toBe(true);
      expect(TDSService.validatePAN('XYZAB9876C')).toBe(true);
      expect(TDSService.validatePAN('PQRST5432G')).toBe(true);
    });

    test('should validate PAN with lowercase letters', () => {
      expect(TDSService.validatePAN('abcde1234f')).toBe(true);
      expect(TDSService.validatePAN('AbCdE1234F')).toBe(true);
    });

    test('should validate PAN with extra whitespace', () => {
      expect(TDSService.validatePAN(' ABCDE1234F ')).toBe(true);
      expect(TDSService.validatePAN('ABCDE1234F ')).toBe(true);
      expect(TDSService.validatePAN(' ABCDE1234F')).toBe(true);
    });

    test('should reject PAN with incorrect length', () => {
      expect(TDSService.validatePAN('ABCDE1234')).toBe(false); // Too short
      expect(TDSService.validatePAN('ABCDE12345F')).toBe(false); // Too long
      expect(TDSService.validatePAN('ABC')).toBe(false); // Way too short
    });

    test('should reject PAN with incorrect format', () => {
      expect(TDSService.validatePAN('12345ABCDE')).toBe(false); // Numbers first
      expect(TDSService.validatePAN('ABCDEFGHIJ')).toBe(false); // All letters
      expect(TDSService.validatePAN('1234567890')).toBe(false); // All numbers
      expect(TDSService.validatePAN('ABCD1234EF')).toBe(false); // Only 4 letters at start
      expect(TDSService.validatePAN('ABCDEF1234')).toBe(false); // 6 letters at start
    });

    test('should reject PAN with special characters', () => {
      expect(TDSService.validatePAN('ABCDE@1234F')).toBe(false);
      expect(TDSService.validatePAN('ABCDE-1234F')).toBe(false);
      expect(TDSService.validatePAN('ABCDE 1234F')).toBe(false);
    });

    test('should reject null or undefined PAN', () => {
      expect(TDSService.validatePAN(null)).toBe(false);
      expect(TDSService.validatePAN(undefined)).toBe(false);
      expect(TDSService.validatePAN('')).toBe(false);
    });

    test('should reject non-string PAN', () => {
      expect(TDSService.validatePAN(123456789)).toBe(false);
      expect(TDSService.validatePAN({})).toBe(false);
      expect(TDSService.validatePAN([])).toBe(false);
    });
  });

  describe('Data parsing', () => {
    test('should parse snake_case response correctly', async () => {
      const mockResponse = {
        data: {
          id: 'tds-123',
          voucher_id: 'voucher-456',
          section: '194C',
          rate: 0.01,
          amount: 1000,
          deductee_type: 'COMPANY',
          pan_number: 'ABCDE1234F',
          calculated_at: '2024-01-15T10:30:00Z',
        },
      };

      tdsAPI.calculate.mockResolvedValueOnce(mockResponse);

      const result = await TDSService.calculateTDS({
        voucherId: 'voucher-456',
        amount: 100000,
        section: '194C',
        deducteeType: 'COMPANY',
        panNumber: 'ABCDE1234F',
      });

      expect(result.voucherId).toBe('voucher-456');
      expect(result.deducteeType).toBe('COMPANY');
      expect(result.panNumber).toBe('ABCDE1234F');
      expect(result.calculatedAt).toBeInstanceOf(Date);
    });

    test('should parse camelCase response correctly', async () => {
      const mockResponse = {
        data: {
          id: 'tds-123',
          voucherId: 'voucher-456',
          section: '194C',
          rate: 0.01,
          amount: 1000,
          deducteeType: 'COMPANY',
          panNumber: 'ABCDE1234F',
          calculatedAt: '2024-01-15T10:30:00Z',
        },
      };

      tdsAPI.calculate.mockResolvedValueOnce(mockResponse);

      const result = await TDSService.calculateTDS({
        voucherId: 'voucher-456',
        amount: 100000,
        section: '194C',
        deducteeType: 'COMPANY',
        panNumber: 'ABCDE1234F',
      });

      expect(result.voucherId).toBe('voucher-456');
      expect(result.deducteeType).toBe('COMPANY');
      expect(result.panNumber).toBe('ABCDE1234F');
    });

    test('should handle null PAN number', async () => {
      const mockResponse = {
        data: {
          id: 'tds-123',
          voucher_id: 'voucher-456',
          section: '194C',
          rate: 0.01,
          amount: 1000,
          deductee_type: 'COMPANY',
          pan_number: null,
          calculated_at: '2024-01-15T10:30:00Z',
        },
      };

      tdsAPI.calculate.mockResolvedValueOnce(mockResponse);

      const result = await TDSService.calculateTDS({
        voucherId: 'voucher-456',
        amount: 100000,
        section: '194C',
        deducteeType: 'COMPANY',
      });

      expect(result.panNumber).toBeNull();
    });

    test('should handle missing calculated_at field', async () => {
      const mockResponse = {
        data: {
          id: 'tds-123',
          voucher_id: 'voucher-456',
          section: '194C',
          rate: 0.01,
          amount: 1000,
          deductee_type: 'COMPANY',
          pan_number: null,
        },
      };

      tdsAPI.calculate.mockResolvedValueOnce(mockResponse);

      const result = await TDSService.calculateTDS({
        voucherId: 'voucher-456',
        amount: 100000,
        section: '194C',
        deducteeType: 'COMPANY',
      });

      expect(result.calculatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Error handling', () => {
    test('should handle timeout error', async () => {
      const timeoutError = new Error('timeout of 30000ms exceeded');
      timeoutError.code = 'ECONNABORTED';

      tdsAPI.calculate.mockRejectedValueOnce(timeoutError);

      await expect(
        TDSService.calculateTDS({
          voucherId: 'voucher-123',
          amount: 100000,
          section: '194C',
          deducteeType: 'COMPANY',
        })
      ).rejects.toThrow('Unable to calculate TDS. Please check your internet connection.');
    });

    test('should handle connection refused error', async () => {
      const connError = new Error('Connection refused');
      connError.code = 'ECONNREFUSED';

      tdsAPI.calculate.mockRejectedValueOnce(connError);

      await expect(
        TDSService.calculateTDS({
          voucherId: 'voucher-123',
          amount: 100000,
          section: '194C',
          deducteeType: 'COMPANY',
        })
      ).rejects.toThrow('Unable to calculate TDS. Please check your internet connection.');
    });

    test('should handle 401 unauthorized error', async () => {
      const authError = new Error('Unauthorized');
      authError.response = {
        status: 401,
        data: {
          message: 'Invalid credentials',
        },
      };

      tdsAPI.calculate.mockRejectedValueOnce(authError);

      await expect(
        TDSService.calculateTDS({
          voucherId: 'voucher-123',
          amount: 100000,
          section: '194C',
          deducteeType: 'COMPANY',
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

      tdsAPI.calculate.mockRejectedValueOnce(forbiddenError);

      await expect(
        TDSService.calculateTDS({
          voucherId: 'voucher-123',
          amount: 100000,
          section: '194C',
          deducteeType: 'COMPANY',
        })
      ).rejects.toThrow('Access denied');
    });

    test('should handle unknown error', async () => {
      const unknownError = new Error('Something went wrong');

      tdsAPI.calculate.mockRejectedValueOnce(unknownError);

      await expect(
        TDSService.calculateTDS({
          voucherId: 'voucher-123',
          amount: 100000,
          section: '194C',
          deducteeType: 'COMPANY',
        })
      ).rejects.toThrow('Something went wrong');
    });
  });
});
