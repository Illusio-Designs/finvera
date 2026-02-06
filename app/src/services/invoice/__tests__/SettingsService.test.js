/**
 * Unit Tests for SettingsService
 * 
 * Tests specific examples and edge cases for settings management.
 * Validates: Requirements 5.1
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingsService from '../SettingsService';
import { tenantAPI } from '../../../lib/api';

// Mock the API
jest.mock('../../../lib/api', () => ({
  tenantAPI: {
    getProfile: jest.fn(),
  },
}));

describe('SettingsService - Unit Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.removeItem.mockResolvedValue();
    
    // Clear service cache
    SettingsService.cachedSettings = null;
    SettingsService.cacheExpiry = null;
  });

  describe('getCompanySettings', () => {
    test('should fetch settings successfully from API', async () => {
      const mockTenantData = {
        tenant: {
          id: 'company-123',
          name: 'Acme Corp',
          settings: {
            eInvoiceEnabled: true,
            eWayBillEnabled: false,
            tdsEnabled: true,
            eInvoiceThreshold: 1000,
            eWayBillThreshold: 50000,
            autoGenerateEInvoice: true,
            autoGenerateEWayBill: false,
            defaultTDSSection: '194C',
          },
        },
      };

      tenantAPI.getProfile.mockResolvedValueOnce({ data: mockTenantData });

      const settings = await SettingsService.getCompanySettings();

      expect(settings).toBeDefined();
      expect(settings.companyId).toBe('company-123');
      expect(settings.companyName).toBe('Acme Corp');
      expect(settings.eInvoiceEnabled).toBe(true);
      expect(settings.eWayBillEnabled).toBe(false);
      expect(settings.tdsEnabled).toBe(true);
      expect(settings.eInvoiceThreshold).toBe(1000);
      expect(settings.eWayBillThreshold).toBe(50000);
      expect(settings.autoGenerateEInvoice).toBe(true);
      expect(settings.autoGenerateEWayBill).toBe(false);
      expect(settings.defaultTDSSection).toBe('194C');
    });

    test('should handle snake_case settings from backend', async () => {
      const mockTenantData = {
        tenant: {
          id: 'company-456',
          name: 'Test Company',
          settings: {
            e_invoice_enabled: true,
            e_way_bill_enabled: true,
            tds_enabled: false,
            e_invoice_threshold: 5000,
            e_way_bill_threshold: 100000,
            auto_generate_e_invoice: false,
            auto_generate_e_way_bill: true,
            default_tds_section: '194J',
          },
        },
      };

      tenantAPI.getProfile.mockResolvedValueOnce({ data: mockTenantData });

      const settings = await SettingsService.getCompanySettings();

      expect(settings.eInvoiceEnabled).toBe(true);
      expect(settings.eWayBillEnabled).toBe(true);
      expect(settings.tdsEnabled).toBe(false);
      expect(settings.eInvoiceThreshold).toBe(5000);
      expect(settings.eWayBillThreshold).toBe(100000);
      expect(settings.autoGenerateEInvoice).toBe(false);
      expect(settings.autoGenerateEWayBill).toBe(true);
      expect(settings.defaultTDSSection).toBe('194J');
    });

    test('should handle missing settings object with defaults', async () => {
      const mockTenantData = {
        tenant: {
          id: 'company-789',
          name: 'Minimal Company',
          // No settings object
        },
      };

      tenantAPI.getProfile.mockResolvedValueOnce({ data: mockTenantData });

      const settings = await SettingsService.getCompanySettings();

      expect(settings.companyId).toBe('company-789');
      expect(settings.eInvoiceEnabled).toBe(false);
      expect(settings.eWayBillEnabled).toBe(false);
      expect(settings.tdsEnabled).toBe(false);
      expect(settings.eInvoiceThreshold).toBe(0);
      expect(settings.eWayBillThreshold).toBe(50000);
      expect(settings.autoGenerateEInvoice).toBe(false);
      expect(settings.autoGenerateEWayBill).toBe(false);
      expect(settings.defaultTDSSection).toBe(null);
    });

    test('should throw error when API response is invalid', async () => {
      tenantAPI.getProfile.mockResolvedValueOnce({ data: {} });

      await expect(SettingsService.getCompanySettings()).rejects.toThrow(
        'Invalid response from tenant API'
      );
    });

    test('should throw error when API call fails', async () => {
      const apiError = new Error('Network error');
      tenantAPI.getProfile.mockRejectedValueOnce(apiError);

      await expect(SettingsService.getCompanySettings()).rejects.toThrow('Network error');
    });

    test('should return expired cache as fallback when API fails', async () => {
      const expiredSettings = {
        companyId: 'company-fallback',
        eInvoiceEnabled: true,
        eWayBillEnabled: false,
        tdsEnabled: true,
      };

      // Set expired cache in memory
      SettingsService.cachedSettings = expiredSettings;
      SettingsService.cacheExpiry = Date.now() - 1000; // Expired

      // Mock AsyncStorage to return expired cache
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key.includes('company_settings_expiry')) {
          return Promise.resolve((Date.now() - 1000).toString());
        }
        if (key.includes('company_settings')) {
          return Promise.resolve(JSON.stringify(expiredSettings));
        }
        return Promise.resolve(null);
      });

      // API call fails
      tenantAPI.getProfile.mockRejectedValueOnce(new Error('API Error'));

      const settings = await SettingsService.getCompanySettings();

      // Should return expired cache as fallback
      expect(settings).toEqual(expiredSettings);
    });
  });

  describe('Cache hit/miss scenarios', () => {
    test('should use cache when valid (cache hit)', async () => {
      const cachedSettings = {
        companyId: 'cached-company',
        eInvoiceEnabled: true,
        eWayBillEnabled: true,
        tdsEnabled: false,
      };

      const futureExpiry = (Date.now() + 60000).toString(); // 1 minute in future

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key.includes('company_settings_expiry')) {
          return Promise.resolve(futureExpiry);
        }
        if (key.includes('company_settings')) {
          return Promise.resolve(JSON.stringify(cachedSettings));
        }
        return Promise.resolve(null);
      });

      const settings = await SettingsService.getCompanySettings();

      // Should not call API
      expect(tenantAPI.getProfile).not.toHaveBeenCalled();
      
      // Should return cached data
      expect(settings).toEqual(cachedSettings);
    });

    test('should fetch from API when cache is expired (cache miss)', async () => {
      const expiredSettings = {
        companyId: 'expired-company',
        eInvoiceEnabled: false,
      };

      const pastExpiry = (Date.now() - 1000).toString(); // 1 second ago

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key.includes('company_settings_expiry')) {
          return Promise.resolve(pastExpiry);
        }
        if (key.includes('company_settings')) {
          return Promise.resolve(JSON.stringify(expiredSettings));
        }
        return Promise.resolve(null);
      });

      const freshData = {
        tenant: {
          id: 'fresh-company',
          name: 'Fresh Company',
          settings: { eInvoiceEnabled: true },
        },
      };

      tenantAPI.getProfile.mockResolvedValueOnce({ data: freshData });

      const settings = await SettingsService.getCompanySettings();

      // Should call API
      expect(tenantAPI.getProfile).toHaveBeenCalledTimes(1);
      
      // Should return fresh data
      expect(settings.companyId).toBe('fresh-company');
      expect(settings.eInvoiceEnabled).toBe(true);
    });

    test('should fetch from API when cache is empty (cache miss)', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const mockData = {
        tenant: {
          id: 'new-company',
          name: 'New Company',
          settings: { eInvoiceEnabled: true },
        },
      };

      tenantAPI.getProfile.mockResolvedValueOnce({ data: mockData });

      const settings = await SettingsService.getCompanySettings();

      // Should call API
      expect(tenantAPI.getProfile).toHaveBeenCalledTimes(1);
      
      // Should return data
      expect(settings.companyId).toBe('new-company');
    });
  });

  describe('Error handling', () => {
    test('should handle AsyncStorage read errors gracefully', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const mockData = {
        tenant: {
          id: 'company-storage-error',
          name: 'Company',
          settings: { eInvoiceEnabled: true },
        },
      };

      tenantAPI.getProfile.mockResolvedValueOnce({ data: mockData });

      const settings = await SettingsService.getCompanySettings();

      // Should still fetch from API
      expect(tenantAPI.getProfile).toHaveBeenCalledTimes(1);
      expect(settings.companyId).toBe('company-storage-error');
    });

    test('should handle AsyncStorage write errors gracefully', async () => {
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Write error'));

      const mockData = {
        tenant: {
          id: 'company-write-error',
          name: 'Company',
          settings: { eInvoiceEnabled: true },
        },
      };

      tenantAPI.getProfile.mockResolvedValueOnce({ data: mockData });

      // Should not throw error even if caching fails
      const settings = await SettingsService.getCompanySettings();
      
      expect(settings.companyId).toBe('company-write-error');
    });
  });

  describe('Boolean helper methods', () => {
    test('isEInvoiceEnabled should return correct value', async () => {
      const mockData = {
        tenant: {
          id: 'test',
          name: 'Test',
          settings: { eInvoiceEnabled: true },
        },
      };

      tenantAPI.getProfile.mockResolvedValueOnce({ data: mockData });
      await SettingsService.getCompanySettings();

      expect(SettingsService.isEInvoiceEnabled()).toBe(true);
    });

    test('isEWayBillEnabled should return correct value', async () => {
      const mockData = {
        tenant: {
          id: 'test',
          name: 'Test',
          settings: { eWayBillEnabled: false },
        },
      };

      tenantAPI.getProfile.mockResolvedValueOnce({ data: mockData });
      await SettingsService.getCompanySettings();

      expect(SettingsService.isEWayBillEnabled()).toBe(false);
    });

    test('isTDSEnabled should return correct value', async () => {
      const mockData = {
        tenant: {
          id: 'test',
          name: 'Test',
          settings: { tdsEnabled: true },
        },
      };

      tenantAPI.getProfile.mockResolvedValueOnce({ data: mockData });
      await SettingsService.getCompanySettings();

      expect(SettingsService.isTDSEnabled()).toBe(true);
    });

    test('boolean helpers should return false when no cache', () => {
      expect(SettingsService.isEInvoiceEnabled()).toBe(false);
      expect(SettingsService.isEWayBillEnabled()).toBe(false);
      expect(SettingsService.isTDSEnabled()).toBe(false);
    });
  });

  describe('clearCache', () => {
    test('should clear AsyncStorage cache', async () => {
      await SettingsService.clearCache();

      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(2);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        expect.stringContaining('company_settings')
      );
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        expect.stringContaining('company_settings_expiry')
      );
    });

    test('should clear in-memory cache', async () => {
      SettingsService.cachedSettings = { test: 'data' };
      SettingsService.cacheExpiry = Date.now();

      await SettingsService.clearCache();

      expect(SettingsService.cachedSettings).toBe(null);
      expect(SettingsService.cacheExpiry).toBe(null);
    });

    test('should handle AsyncStorage errors gracefully', async () => {
      AsyncStorage.removeItem.mockRejectedValueOnce(new Error('Remove error'));

      // Should not throw
      await expect(SettingsService.clearCache()).resolves.not.toThrow();
    });
  });

  describe('refreshSettings', () => {
    test('should always fetch from API', async () => {
      const mockData = {
        tenant: {
          id: 'refresh-test',
          name: 'Refresh Test',
          settings: { eInvoiceEnabled: true },
        },
      };

      tenantAPI.getProfile.mockResolvedValueOnce({ data: mockData });

      const settings = await SettingsService.refreshSettings();

      expect(tenantAPI.getProfile).toHaveBeenCalledTimes(1);
      expect(settings.companyId).toBe('refresh-test');
    });

    test('should update cache after refresh', async () => {
      const mockData = {
        tenant: {
          id: 'refresh-cache-test',
          name: 'Refresh Cache Test',
          settings: { eInvoiceEnabled: false },
        },
      };

      tenantAPI.getProfile.mockResolvedValueOnce({ data: mockData });

      await SettingsService.refreshSettings();

      // Verify cache was updated
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('company_settings'),
        expect.any(String)
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('company_settings_expiry'),
        expect.any(String)
      );
    });
  });
});
