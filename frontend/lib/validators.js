/**
 * Email validation
 */
export const validateEmail = (email) => {
  if (!email) return { valid: false, message: 'Email is required' };
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  return { valid: true };
};

/**
 * Password validation (min 8 chars, at least one uppercase, one lowercase, one number)
 */
export const validatePassword = (password) => {
  if (!password) return { valid: false, message: 'Password is required' };
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
};

/**
 * GSTIN validation (15 characters, alphanumeric)
 */
export const validateGSTIN = (gstin) => {
  if (!gstin) return { valid: false, message: 'GSTIN is required' };
  if (gstin.length !== 15) {
    return { valid: false, message: 'GSTIN must be 15 characters long' };
  }
  if (!/^[0-9A-Z]{15}$/.test(gstin)) {
    return { valid: false, message: 'GSTIN must be alphanumeric' };
  }
  return { valid: true };
};

/**
 * PAN validation (10 characters, format: ABCDE1234F)
 */
export const validatePAN = (pan) => {
  if (!pan) return { valid: false, message: 'PAN is required' };
  if (pan.length !== 10) {
    return { valid: false, message: 'PAN must be 10 characters long' };
  }
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
    return { valid: false, message: 'Invalid PAN format' };
  }
  return { valid: true };
};

/**
 * Phone number validation (10 digits)
 */
export const validatePhone = (phone) => {
  if (!phone) return { valid: false, message: 'Phone number is required' };
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) {
    return { valid: false, message: 'Phone number must be 10 digits' };
  }
  return { valid: true };
};

/**
 * Required field validation
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '') {
    return { valid: false, message: `${fieldName} is required` };
  }
  return { valid: true };
};

/**
 * Number validation
 */
export const validateNumber = (value, min = null, max = null) => {
  if (value === null || value === undefined || value === '') {
    return { valid: false, message: 'Number is required' };
  }
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, message: 'Must be a valid number' };
  }
  if (min !== null && num < min) {
    return { valid: false, message: `Must be at least ${min}` };
  }
  if (max !== null && num > max) {
    return { valid: false, message: `Must be at most ${max}` };
  }
  return { valid: true };
};

/**
 * Date validation
 */
export const validateDate = (date, minDate = null, maxDate = null) => {
  if (!date) return { valid: false, message: 'Date is required' };
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return { valid: false, message: 'Invalid date format' };
  }
  if (minDate && d < new Date(minDate)) {
    return { valid: false, message: `Date must be after ${formatDate(minDate)}` };
  }
  if (maxDate && d > new Date(maxDate)) {
    return { valid: false, message: `Date must be before ${formatDate(maxDate)}` };
  }
  return { valid: true };
};

/**
 * URL validation
 */
export const validateURL = (url) => {
  if (!url) return { valid: false, message: 'URL is required' };
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, message: 'Invalid URL format' };
  }
};

/**
 * HSN/SAC code validation (4-8 digits)
 */
export const validateHSNSAC = (code) => {
  if (!code) return { valid: false, message: 'HSN/SAC code is required' };
  if (!/^\d{4,8}$/.test(code)) {
    return { valid: false, message: 'HSN/SAC must be 4-8 digits' };
  }
  return { valid: true };
};

// Import formatDate for date validation
import { formatDate } from './formatters';

/**
 * Company name validation
 */
export const validateCompanyName = (name) => {
  if (!name) return { valid: false, message: 'Company name is required' };
  if (name.length < 2) {
    return { valid: false, message: 'Company name must be at least 2 characters long' };
  }
  if (name.length > 100) {
    return { valid: false, message: 'Company name must be less than 100 characters' };
  }
  return { valid: true };
};

/**
 * Full name validation
 */
export const validateFullName = (name) => {
  if (!name) return { valid: false, message: 'Full name is required' };
  if (name.length < 2) {
    return { valid: false, message: 'Full name must be at least 2 characters long' };
  }
  if (name.length > 50) {
    return { valid: false, message: 'Full name must be less than 50 characters' };
  }
  if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
    return { valid: false, message: 'Full name can only contain letters, spaces, dots, hyphens, and apostrophes' };
  }
  return { valid: true };
};

/**
 * Amount validation
 */
export const validateAmount = (amount, min = 0, max = null) => {
  if (amount === null || amount === undefined || amount === '') {
    return { valid: false, message: 'Amount is required' };
  }
  const num = parseFloat(amount);
  if (isNaN(num)) {
    return { valid: false, message: 'Must be a valid amount' };
  }
  if (num < min) {
    return { valid: false, message: `Amount must be at least ${min}` };
  }
  if (max !== null && num > max) {
    return { valid: false, message: `Amount must be at most ${max}` };
  }
  return { valid: true };
};

/**
 * Percentage validation
 */
export const validatePercentage = (value, min = 0, max = 100) => {
  if (value === null || value === undefined || value === '') {
    return { valid: false, message: 'Percentage is required' };
  }
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, message: 'Must be a valid percentage' };
  }
  if (num < min) {
    return { valid: false, message: `Percentage must be at least ${min}%` };
  }
  if (num > max) {
    return { valid: false, message: `Percentage must be at most ${max}%` };
  }
  return { valid: true };
};

/**
 * Ledger name validation
 */
export const validateLedgerName = (name) => {
  if (!name) return { valid: false, message: 'Ledger name is required' };
  if (name.length < 2) {
    return { valid: false, message: 'Ledger name must be at least 2 characters long' };
  }
  if (name.length > 100) {
    return { valid: false, message: 'Ledger name must be less than 100 characters' };
  }
  return { valid: true };
};

/**
 * Voucher number validation
 */
export const validateVoucherNumber = (number) => {
  if (!number) return { valid: false, message: 'Voucher number is required' };
  if (number.length < 1) {
    return { valid: false, message: 'Voucher number is required' };
  }
  if (number.length > 50) {
    return { valid: false, message: 'Voucher number must be less than 50 characters' };
  }
  return { valid: true };
};

/**
 * Item name validation
 */
export const validateItemName = (name) => {
  if (!name) return { valid: false, message: 'Item name is required' };
  if (name.length < 2) {
    return { valid: false, message: 'Item name must be at least 2 characters long' };
  }
  if (name.length > 100) {
    return { valid: false, message: 'Item name must be less than 100 characters' };
  }
  return { valid: true };
};

/**
 * Quantity validation
 */
export const validateQuantity = (quantity, min = 0) => {
  if (quantity === null || quantity === undefined || quantity === '') {
    return { valid: false, message: 'Quantity is required' };
  }
  const num = parseFloat(quantity);
  if (isNaN(num)) {
    return { valid: false, message: 'Must be a valid quantity' };
  }
  if (num <= min) {
    return { valid: false, message: `Quantity must be greater than ${min}` };
  }
  return { valid: true };
};

/**
 * Rate validation
 */
export const validateRate = (rate, min = 0) => {
  if (rate === null || rate === undefined || rate === '') {
    return { valid: false, message: 'Rate is required' };
  }
  const num = parseFloat(rate);
  if (isNaN(num)) {
    return { valid: false, message: 'Must be a valid rate' };
  }
  if (num < min) {
    return { valid: false, message: `Rate must be at least ${min}` };
  }
  return { valid: true };
};

/**
 * Address validation
 */
export const validateAddress = (address) => {
  if (!address) return { valid: false, message: 'Address is required' };
  if (address.length < 10) {
    return { valid: false, message: 'Address must be at least 10 characters long' };
  }
  if (address.length > 200) {
    return { valid: false, message: 'Address must be less than 200 characters' };
  }
  return { valid: true };
};

/**
 * Pincode validation (6 digits)
 */
export const validatePincode = (pincode) => {
  if (!pincode) return { valid: false, message: 'Pincode is required' };
  if (!/^\d{6}$/.test(pincode)) {
    return { valid: false, message: 'Pincode must be 6 digits' };
  }
  return { valid: true };
};

/**
 * State validation
 */
export const validateState = (state) => {
  if (!state) return { valid: false, message: 'State is required' };
  if (state.length < 2) {
    return { valid: false, message: 'State name must be at least 2 characters long' };
  }
  return { valid: true };
};

/**
 * City validation
 */
export const validateCity = (city) => {
  if (!city) return { valid: false, message: 'City is required' };
  if (city.length < 2) {
    return { valid: false, message: 'City name must be at least 2 characters long' };
  }
  return { valid: true };
};

/**
 * Bank account number validation
 */
export const validateBankAccount = (accountNumber) => {
  if (!accountNumber) return { valid: false, message: 'Bank account number is required' };
  if (!/^\d{9,18}$/.test(accountNumber)) {
    return { valid: false, message: 'Bank account number must be 9-18 digits' };
  }
  return { valid: true };
};

/**
 * IFSC code validation
 */
export const validateIFSC = (ifsc) => {
  if (!ifsc) return { valid: false, message: 'IFSC code is required' };
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
    return { valid: false, message: 'Invalid IFSC code format' };
  }
  return { valid: true };
};

/**
 * Form validation helper
 */
export const validateForm = (data, validationRules) => {
  const errors = {};
  let isValid = true;

  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = data[field];

    for (const rule of rules) {
      const result = rule(value);
      if (!result.valid) {
        errors[field] = result.message;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  });

  return { isValid, errors };
};

/**
 * Real-time field validation
 */
export const validateField = (value, validators) => {
  for (const validator of validators) {
    const result = validator(value);
    if (!result.valid) {
      return result;
    }
  }
  return { valid: true };
};