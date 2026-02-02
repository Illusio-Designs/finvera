import { tenantAPI } from '../lib/api';

/**
 * Check if barcode functionality is enabled for the current tenant
 * @returns {Promise<boolean>} - True if barcode is enabled, false otherwise
 */
export const isBarcodeEnabled = async () => {
  try {
    const response = await tenantAPI.getProfile();
    const tenant = response?.data?.data || response?.data;
    return tenant?.settings?.barcode_enabled === true;
  } catch (error) {
    console.error('Error checking barcode setting:', error);
    return false; // Default to disabled on error
  }
};

/**
 * Get default barcode settings for the current tenant
 * @returns {Promise<Object>} - Default barcode settings
 */
export const getDefaultBarcodeSettings = async () => {
  try {
    const response = await tenantAPI.getProfile();
    const tenant = response?.data?.data || response?.data;
    const settings = tenant?.settings || {};
    
    return {
      enabled: settings.barcode_enabled === true,
      defaultType: settings.default_barcode_type || 'EAN13',
      defaultPrefix: settings.default_barcode_prefix || 'PRD',
    };
  } catch (error) {
    console.error('Error getting barcode settings:', error);
    return {
      enabled: false,
      defaultType: 'EAN13',
      defaultPrefix: 'PRD',
    };
  }
};

/**
 * Show barcode disabled message
 * @param {Function} showNotification - Notification function
 */
export const showBarcodeDisabledMessage = (showNotification) => {
  showNotification({
    type: 'error',
    title: 'Barcode Disabled',
    message: 'Barcode functionality is disabled. Please enable it in settings.'
  });
};