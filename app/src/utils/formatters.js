/**
 * Format GSTIN
 */
export const formatGSTIN = (gstin) => {
  if (!gstin) return '';
  // GSTIN format: 15 characters, 2-2-10-3-1
  if (gstin.length === 15) {
    return `${gstin.substring(0, 2)}${gstin.substring(2, 4)}${gstin.substring(4, 14)}${gstin.substring(14, 15)}`;
  }
  return gstin;
};

/**
 * Format PAN
 */
export const formatPAN = (pan) => {
  if (!pan) return '';
  // PAN format: ABCDE1234F
  if (pan.length === 10) {
    return `${pan.substring(0, 5)}${pan.substring(5, 9)}${pan.substring(9, 10)}`;
  }
  return pan;
};

/**
 * Extract PAN number from GSTIN
 * GSTIN format: 24ABKPZ9119Q1ZL (15 characters)
 * Remove first 2 characters and last 3 characters to get PAN (10 characters)
 * Example: 24ABKPZ9119Q1ZL -> ABKPZ9119Q1
 * 
 * GSTIN structure: [State Code (2)] + [PAN (10)] + [Check Digit (1)] + [Entity Number (1)] + [Z (1)]
 * To extract PAN: Remove first 2 (state code) and last 3 (check digit + entity + Z)
 */
export const extractPANFromGSTIN = (gstin) => {
  if (!gstin) return '';
  
  // Remove spaces and convert to uppercase
  const cleaned = gstin.replace(/\s/g, '').toUpperCase();
  
  // GSTIN should be 15 characters
  if (cleaned.length === 15) {
    // Remove first 2 characters (state code) and last 3 characters (check digit + entity + Z)
    // substring(2, 12) gives us characters from index 2 to 11 (10 characters = PAN)
    return cleaned.substring(2, 12);
  }
  
  return '';
};

/**
 * Validate GSTIN format
 * GSTIN should be 15 characters alphanumeric
 */
export const validateGSTIN = (gstin) => {
  if (!gstin) return false;
  const cleaned = gstin.replace(/\s/g, '').toUpperCase();
  return /^[0-9A-Z]{15}$/.test(cleaned);
};

/**
 * Validate PAN format
 * PAN should be 10 characters: 5 letters + 4 digits + 1 letter
 */
export const validatePAN = (pan) => {
  if (!pan) return false;
  const cleaned = pan.replace(/\s/g, '').toUpperCase();
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleaned);
};

/**
 * Format GSTIN with proper spacing (optional display format)
 * Format: XX XX XXXXXXXXX X X
 */
export const formatGSTINDisplay = (gstin) => {
  if (!gstin) return '';
  const cleaned = gstin.replace(/\s/g, '').toUpperCase();
  if (cleaned.length === 15) {
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 14)} ${cleaned.substring(14, 15)}`;
  }
  return cleaned;
};

/**
 * Format currency in Indian format (₹ with lakhs/crores)
 */
export const formatCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₹ 0' : '0';
  }

  const num = parseFloat(amount);
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  let formatted;

  if (absNum >= 10000000) {
    // Crores
    formatted = (absNum / 10000000).toFixed(2) + ' Cr';
  } else if (absNum >= 100000) {
    // Lakhs
    formatted = (absNum / 100000).toFixed(2) + ' L';
  } else if (absNum >= 1000) {
    // Thousands
    formatted = (absNum / 1000).toFixed(2) + ' K';
  } else {
    formatted = absNum.toFixed(2);
  }

  // Add Indian number formatting (lakhs/crores separator)
  formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return showSymbol ? `${sign}₹ ${formatted}` : `${sign}${formatted}`;
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (supports international format)
 */
export const validatePhone = (phone) => {
  if (!phone) return false;
  
  // Remove country code and formatting to get just the digits
  const cleaned = phone.replace(/^\+\d+\s*/, '').replace(/\D/g, '');
  
  // Check if it starts with country code +91 (India)
  if (phone.startsWith('+91')) {
    return cleaned.length === 10 && /^[6-9]/.test(cleaned);
  }
  
  // For other countries, just check if we have a reasonable number of digits
  return cleaned.length >= 7 && cleaned.length <= 15;
};

/**
 * Format phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  // Indian phone format: +91 XXXXX XXXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  }
  return phone;
};