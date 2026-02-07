import AsyncStorage from '@react-native-async-storage/async-storage';
import { tenantAPI } from '../../lib/api';
import { buildStorageKey, STORAGE_CONFIG } from '../../config/env';

/**
 * SettingsService
 * 
 * Manages company settings for invoice features (e-invoice, e-way bill, TDS).
 * Implements caching with expiration to reduce API calls.
 */

const SETTINGS_CACHE_KEY = buildStorageKey('company_settings');
const SETTINGS_CACHE_EXPIRY_KEY = buildStorageKey('company_settings_expiry');
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class SettingsService {
  constructor() {
    this.cachedSettings = null;
    this.cacheExpiry = null;
  }

  /**
   * Get company settings from cache or backend
   * @returns {Promise<Object>} Company settings object
   */
  async getCompanySettings() {
    try {
      // Check if we have valid cached settings
      const cachedSettings = await this._getCachedSettings();
      if (cachedSettings) {
        this.cachedSettings = cachedSettings;
        return cachedSettings;
      }

      // Fetch from backend if cache is invalid or expired
      return await this.refreshSettings();
    } catch (error) {
      console.error('Failed to get company settings:', error.message || error);
      
      // Return cached settings even if expired, as fallback
      if (this.cachedSettings) {
        console.warn('Using expired cached settings as fallback');
        return this.cachedSettings;
      }
      
      throw new Error(`Unable to load company settings: ${error.message || 'Network error'}`);
    }
  }

  /**
   * Refresh settings from backend and update cache
   * @returns {Promise<Object>} Fresh company settings object
   */
  async refreshSettings() {
    try {
      // Fetch tenant profile from backend
      const response = await tenantAPI.getProfile();
      
      if (!response) {
        throw new Error('No response received from server');
      }

      if (!response.data) {
        throw new Error('Server returned empty response');
      }

      if (!response.data.tenant) {
        throw new Error('Tenant information not found in response');
      }

      // Parse settings from tenant profile
      const settings = this._parseSettings(response.data.tenant);
      
      // Cache the settings
      await this._cacheSettings(settings);
      
      // Update in-memory cache
      this.cachedSettings = settings;
      this.cacheExpiry = Date.now() + DEFAULT_CACHE_DURATION;
      
      return settings;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      console.error('Failed to refresh settings:', errorMessage);
      throw new Error(`Settings refresh failed: ${errorMessage}`);
    }
  }

  /**
   * Check if e-invoice feature is enabled
   * @returns {boolean}
   */
  isEInvoiceEnabled() {
    return this.cachedSettings?.eInvoiceEnabled || false;
  }

  /**
   * Check if e-way bill feature is enabled
   * @returns {boolean}
   */
  isEWayBillEnabled() {
    return this.cachedSettings?.eWayBillEnabled || false;
  }

  /**
   * Check if TDS feature is enabled
   * @returns {boolean}
   */
  isTDSEnabled() {
    return this.cachedSettings?.tdsEnabled || false;
  }

  /**
   * Get cached settings if valid and not expired
   * @private
   * @returns {Promise<Object|null>}
   */
  async _getCachedSettings() {
    try {
      // Check in-memory cache first
      if (this.cachedSettings && this.cacheExpiry && Date.now() < this.cacheExpiry) {
        return this.cachedSettings;
      }

      // Check AsyncStorage cache
      const [cachedData, expiryTime] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_CACHE_KEY),
        AsyncStorage.getItem(SETTINGS_CACHE_EXPIRY_KEY)
      ]);

      if (!cachedData || !expiryTime) {
        return null;
      }

      const expiry = parseInt(expiryTime, 10);
      if (Date.now() >= expiry) {
        // Cache expired
        return null;
      }

      // Parse and return cached settings
      const settings = JSON.parse(cachedData);
      
      // Update in-memory cache
      this.cachedSettings = settings;
      this.cacheExpiry = expiry;
      
      return settings;
    } catch (error) {
      console.error('Error reading cached settings:', error);
      return null;
    }
  }

  /**
   * Cache settings to AsyncStorage
   * @private
   * @param {Object} settings - Settings object to cache
   * @returns {Promise<void>}
   */
  async _cacheSettings(settings) {
    try {
      const expiry = Date.now() + DEFAULT_CACHE_DURATION;
      
      await Promise.all([
        AsyncStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings)),
        AsyncStorage.setItem(SETTINGS_CACHE_EXPIRY_KEY, expiry.toString())
      ]);
    } catch (error) {
      console.error('Error caching settings:', error);
      // Don't throw - caching failure shouldn't break the app
    }
  }

  /**
   * Parse settings from tenant profile response
   * @private
   * @param {Object} tenant - Tenant object from API response
   * @returns {Object} Parsed settings object
   */
  _parseSettings(tenant) {
    const settings = tenant.settings || {};
    
    return {
      companyId: tenant.id,
      companyName: tenant.name || '',
      eInvoiceEnabled: settings.eInvoiceEnabled || settings.e_invoice_enabled || false,
      eWayBillEnabled: settings.eWayBillEnabled || settings.e_way_bill_enabled || false,
      tdsEnabled: settings.tdsEnabled || settings.tds_enabled || false,
      eInvoiceThreshold: settings.eInvoiceThreshold || settings.e_invoice_threshold || 0,
      eWayBillThreshold: settings.eWayBillThreshold || settings.e_way_bill_threshold || 50000,
      autoGenerateEInvoice: settings.autoGenerateEInvoice || settings.auto_generate_e_invoice || false,
      autoGenerateEWayBill: settings.autoGenerateEWayBill || settings.auto_generate_e_way_bill || false,
      defaultTDSSection: settings.defaultTDSSection || settings.default_tds_section || null,
    };
  }

  /**
   * Clear cached settings (useful for testing or logout)
   * @returns {Promise<void>}
   */
  async clearCache() {
    try {
      await Promise.all([
        AsyncStorage.removeItem(SETTINGS_CACHE_KEY),
        AsyncStorage.removeItem(SETTINGS_CACHE_EXPIRY_KEY)
      ]);
      
      this.cachedSettings = null;
      this.cacheExpiry = null;
    } catch (error) {
      console.error('Error clearing settings cache:', error);
    }
  }
}

// Export singleton instance
export default new SettingsService();
