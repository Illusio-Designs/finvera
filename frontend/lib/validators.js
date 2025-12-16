/**
 * Email validation
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
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

