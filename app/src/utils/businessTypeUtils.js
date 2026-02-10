import { inventoryAPI } from '../lib/api';

/**
 * Get business type for a company/branch
 * @param {string} companyId - Company ID
 * @param {string} branchId - Branch ID (optional)
 * @returns {Promise<Object>} - Business type info
 */
export const getBusinessType = async (companyId, branchId = null) => {
  try {
    const response = await inventoryAPI.getBusinessType(companyId, branchId);
    return response?.data || { business_type: 'trader', source: 'default' };
  } catch (error) {
    console.error('Error getting business type:', error);
    return { business_type: 'trader', source: 'default' };
  }
};

/**
 * Check if barcode is required based on business type
 * @param {string} businessType - Business type ('trader' or 'retail')
 * @returns {boolean} - True if barcode is required
 */
export const isBarcodeRequired = (businessType) => {
  return businessType === 'retail';
};

/**
 * Check if barcode is optional based on business type
 * @param {string} businessType - Business type ('trader' or 'retail')
 * @returns {boolean} - True if barcode is optional
 */
export const isBarcodeOptional = (businessType) => {
  return businessType === 'trader';
};

/**
 * Get business type display name
 * @param {string} businessType - Business type ('trader' or 'retail')
 * @returns {string} - Display name
 */
export const getBusinessTypeDisplayName = (businessType) => {
  const names = {
    trader: 'Trader (Normal Inventory)',
    retail: 'Retail (Barcode-Based)',
  };
  return names[businessType] || 'Unknown';
};

/**
 * Get business type description
 * @param {string} businessType - Business type ('trader' or 'retail')
 * @returns {string} - Description
 */
export const getBusinessTypeDescription = (businessType) => {
  const descriptions = {
    trader: 'Normal inventory management using item codes and names. Barcode is optional.',
    retail: 'Barcode-based inventory management. Every item must have a unique barcode.',
  };
  return descriptions[businessType] || '';
};

/**
 * Get business type options for dropdown
 * @returns {Array} - Array of business type options
 */
export const getBusinessTypeOptions = () => {
  return [
    {
      value: 'trader',
      label: 'Trader',
      description: 'Normal inventory (item code/name based)',
    },
    {
      value: 'retail',
      label: 'Retail',
      description: 'Barcode-based inventory',
    },
  ];
};

/**
 * Validate inventory item based on business type
 * @param {Object} item - Inventory item data
 * @param {string} businessType - Business type
 * @returns {Object} - Validation result { valid: boolean, errors: Array }
 */
export const validateInventoryItem = (item, businessType) => {
  const errors = [];
  
  if (!item.item_name) {
    errors.push('Item name is required');
  }
  
  if (businessType === 'retail') {
    if (!item.barcode && !item.generate_barcode) {
      errors.push('Barcode is required for retail business type');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};
