/**
 * Unit Tests for VoucherContext
 * 
 * These tests verify specific examples and edge cases for VoucherContext
 * functionality including state updates, data fetching, and error handling.
 * 
 * Requirements: 10.1, 10.2
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { VoucherProvider, useVoucher } from '../VoucherContext';
import { voucherAPI, eInvoiceAPI, eWayBillAPI, tdsAPI } from '../../lib/api';

// Mock the APIs
jest.mock('../../lib/api', () => ({
  voucherAPI: {
    get: jest.fn(),
  },
  eInvoiceAPI: {
    getStatus: jest.fn(),
  },
  eWayBillAPI: {
    getStatus: jest.fn(),
  },
  tdsAPI: {
    getDetails: jest.fn(),
  },
}));

describe('VoucherContext - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Context Provider', () => {
    test('should throw error when useVoucher is used outside provider', () => {
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useVoucher());
      }).toThrow('useVoucher must be used within a VoucherProvider');

      console.error = originalError;
    });

    test('should provide initial state values', () => {
      const wrapper = ({ children }) => <VoucherProvider>{children}</VoucherProvider>;
      const { result } = renderHook(() => useVoucher(), { wrapper });

      expect(result.current.voucher).toBeNull();
      expect(result.current.eInvoiceStatus).toBeNull();
      expect(result.current.eWayBillStatus).toBeNull();
      expect(result.current.tdsDetails).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('should provide all required functions', () => {
      const wrapper = ({ children }) => <VoucherProvider>{children}</VoucherProvider>;
      const { result } = renderHook(() => useVoucher(), { wrapper });

      expect(typeof result.current.updateVoucher).toBe('function');
      expect(typeof result.current.refreshVoucherData).toBe('function');
      expect(typeof result.current.updateEInvoiceStatus).toBe('function');
      expect(typeof result.current.updateEWayBillStatus).toBe('function');
      expect(typeof result.current.updateTdsDetails).toBe('function');
      expect(typeof result.current.clearVoucherData).toBe('function');
    });
  });

  describe('updateVoucher', () => {
    test('should update voucher with new data', () => {
      const wrapper = ({ children }) => <VoucherProvider>{children}</VoucherProvider>;
      const { result } = renderHook(() => useVoucher(), { wrapper });

      act(() => {
        result.current.updateVoucher({
          id: 'voucher-1',
          type: 'SALES_INVOICE',
          voucherNumber: 'INV-001',
        });
      });

      expect(result.current.voucher).toEqual({
        id: 'voucher-1',
        type: 'SALES_INVOICE',
        voucherNumber: 'INV-001',
      });
    });

    test('should merge new data with existing voucher data', () => {
      const wrapper = ({ children }) => <VoucherProvider>{children}</VoucherProvider>;
      const { result } = renderHook(() => useVoucher(), { wrapper });

      act(() => {
        result.current.updateVoucher({
          id: 'voucher-1',
          type: 'SALES_INVOICE',
          amount: 10000,
        });
      });

      act(() => {
        result.current.updateVoucher({
          netAmount: 9900,
        });
      });

      expect(result.current.voucher).toEqual({
        id: 'voucher-1',
        type: 'SALES_INVOICE',
        amount: 10000,
        netAmount: 9900,
      });
    });
  });

  describe('updateEInvoiceStatus', () => {
    test('should update e-invoice status with new data', () => {
      const wrapper = ({ children }) => <VoucherProvider>{children}</VoucherProvider>;
      const { result } = renderHook(() => useVoucher(), { wrapper });

      act(() => {
        result.current.updateEInvoiceStatus({
          status: 'GENERATED',
          irn: 'TEST-IRN-123',
          ackNo: 'ACK-456',
        });
      });

      expect(result.current.eInvoiceStatus).toEqual({
        status: 'GENERATED',
        irn: 'TEST-IRN-123',
        ackNo: 'ACK-456',
      });
    });
  });

  describe('updateEWayBillStatus', () => {
    test('should update e-way bill status with new data', () => {
      const wrapper = ({ children }) => <VoucherProvider>{children}</VoucherProvider>;
      const { result } = renderHook(() => useVoucher(), { wrapper });

      act(() => {
        result.current.updateEWayBillStatus({
          status: 'GENERATED',
          ewbNumber: 'EWB-123456789012',
          validUntil: new Date('2024-01-20'),
        });
      });

      expect(result.current.eWayBillStatus.status).toBe('GENERATED');
      expect(result.current.eWayBillStatus.ewbNumber).toBe('EWB-123456789012');
    });
  });

  describe('updateTdsDetails', () => {
    test('should update TDS details with new data', () => {
      const wrapper = ({ children }) => <VoucherProvider>{children}</VoucherProvider>;
      const { result } = renderHook(() => useVoucher(), { wrapper });

      act(() => {
        result.current.updateTdsDetails({
          section: '194C',
          rate: 1.0,
          amount: 100,
          deducteeType: 'COMPANY',
        });
      });

      expect(result.current.tdsDetails).toEqual({
        section: '194C',
        rate: 1.0,
        amount: 100,
        deducteeType: 'COMPANY',
      });
    });
  });

  describe('clearVoucherData', () => {
    test('should clear all voucher-related data', () => {
      const wrapper = ({ children }) => <VoucherProvider>{children}</VoucherProvider>;
      const { result } = renderHook(() => useVoucher(), { wrapper });

      act(() => {
        result.current.updateVoucher({ id: 'voucher-1' });
        result.current.updateEInvoiceStatus({ status: 'GENERATED' });
        result.current.updateEWayBillStatus({ status: 'GENERATED' });
        result.current.updateTdsDetails({ section: '194C' });
      });

      act(() => {
        result.current.clearVoucherData();
      });

      expect(result.current.voucher).toBeNull();
      expect(result.current.eInvoiceStatus).toBeNull();
      expect(result.current.eWayBillStatus).toBeNull();
      expect(result.current.tdsDetails).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('refreshVoucherData', () => {
    test('should fetch all voucher-related data successfully', async () => {
      const mockVoucherData = {
        data: {
          id: 'voucher-1',
          type: 'SALES_INVOICE',
          voucherNumber: 'INV-001',
        },
      };

      const mockEInvoiceData = {
        data: {
          status: 'GENERATED',
          irn: 'IRN-123',
        },
      };

      voucherAPI.get.mockResolvedValue(mockVoucherData);
      eInvoiceAPI.getStatus.mockResolvedValue(mockEInvoiceData);
      eWayBillAPI.getStatus.mockRejectedValue({ response: { status: 404 } });
      tdsAPI.getDetails.mockRejectedValue({ response: { status: 404 } });

      const wrapper = ({ children }) => <VoucherProvider>{children}</VoucherProvider>;
      const { result } = renderHook(() => useVoucher(), { wrapper });

      await act(async () => {
        await result.current.refreshVoucherData('voucher-1');
      });

      expect(result.current.voucher).toEqual(mockVoucherData.data);
      expect(result.current.eInvoiceStatus).toEqual(mockEInvoiceData.data);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('should handle missing voucher ID', async () => {
      const wrapper = ({ children }) => <VoucherProvider>{children}</VoucherProvider>;
      const { result } = renderHook(() => useVoucher(), { wrapper });

      await act(async () => {
        await result.current.refreshVoucherData(null);
      });

      expect(result.current.error).toBe('Voucher ID is required');
      expect(voucherAPI.get).not.toHaveBeenCalled();
    });

    test('should handle voucher fetch error', async () => {
      const errorMessage = 'Network error';
      voucherAPI.get.mockRejectedValue(new Error(errorMessage));

      const wrapper = ({ children }) => <VoucherProvider>{children}</VoucherProvider>;
      const { result } = renderHook(() => useVoucher(), { wrapper });

      let thrownError;
      await act(async () => {
        try {
          await result.current.refreshVoucherData('voucher-1');
        } catch (error) {
          thrownError = error;
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
      expect(thrownError).toBeDefined();
    });

    test('should handle 404 errors gracefully', async () => {
      const mockVoucherData = {
        data: { id: 'voucher-1' },
      };

      voucherAPI.get.mockResolvedValue(mockVoucherData);
      eInvoiceAPI.getStatus.mockRejectedValue({ response: { status: 404 } });
      eWayBillAPI.getStatus.mockRejectedValue({ response: { status: 404 } });
      tdsAPI.getDetails.mockRejectedValue({ response: { status: 404 } });

      const wrapper = ({ children }) => <VoucherProvider>{children}</VoucherProvider>;
      const { result } = renderHook(() => useVoucher(), { wrapper });

      await act(async () => {
        await result.current.refreshVoucherData('voucher-1');
      });

      expect(result.current.voucher).toEqual(mockVoucherData.data);
      expect(result.current.eInvoiceStatus).toBeNull();
      expect(result.current.error).toBeNull();
    });

    test('should handle TDS array response', async () => {
      const voucherId = 'voucher-1';
      const mockVoucherData = {
        data: { id: voucherId },
      };

      const mockTdsArrayData = {
        data: [
          { voucher_id: 'other-voucher', section: '194A', amount: 50 },
          { voucher_id: voucherId, section: '194C', amount: 100 },
        ],
      };

      voucherAPI.get.mockResolvedValue(mockVoucherData);
      eInvoiceAPI.getStatus.mockRejectedValue({ response: { status: 404 } });
      eWayBillAPI.getStatus.mockRejectedValue({ response: { status: 404 } });
      tdsAPI.getDetails.mockResolvedValue(mockTdsArrayData);

      const wrapper = ({ children }) => <VoucherProvider>{children}</VoucherProvider>;
      const { result } = renderHook(() => useVoucher(), { wrapper });

      await act(async () => {
        await result.current.refreshVoucherData(voucherId);
      });

      expect(result.current.tdsDetails).toEqual({
        voucher_id: voucherId,
        section: '194C',
        amount: 100,
      });
    });
  });
});
