/**
 * Barcode Generation Utility
 * Supports EAN-13, EAN-8, and custom barcode generation
 */

/**
 * Calculate EAN-13 check digit
 * @param {string} code - 12 digit code without check digit
 * @returns {number} - Check digit (0-9)
 */
function calculateEAN13CheckDigit(code) {
  if (code.length !== 12) {
    throw new Error('EAN-13 requires 12 digits before check digit');
  }
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit;
}

/**
 * Generate EAN-13 barcode
 * @param {string} prefix - Country/company prefix (3-9 digits)
 * @param {string} productCode - Product code (fills remaining digits)
 * @returns {string} - Complete 13-digit EAN-13 barcode
 */
function generateEAN13(prefix = '890', productCode = null) {
  // If no product code provided, generate random
  if (!productCode) {
    const randomLength = 12 - prefix.length;
    productCode = Math.floor(Math.random() * Math.pow(10, randomLength))
      .toString()
      .padStart(randomLength, '0');
  }
  
  // Combine and ensure 12 digits
  let code = (prefix + productCode).substring(0, 12).padStart(12, '0');
  
  // Calculate and append check digit
  const checkDigit = calculateEAN13CheckDigit(code);
  return code + checkDigit;
}

/**
 * Calculate EAN-8 check digit
 * @param {string} code - 7 digit code without check digit
 * @returns {number} - Check digit (0-9)
 */
function calculateEAN8CheckDigit(code) {
  if (code.length !== 7) {
    throw new Error('EAN-8 requires 7 digits before check digit');
  }
  
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(code[i]);
    sum += (i % 2 === 0) ? digit * 3 : digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit;
}

/**
 * Generate EAN-8 barcode
 * @param {string} productCode - 7-digit product code
 * @returns {string} - Complete 8-digit EAN-8 barcode
 */
function generateEAN8(productCode = null) {
  // If no product code provided, generate random
  if (!productCode) {
    productCode = Math.floor(Math.random() * 10000000)
      .toString()
      .padStart(7, '0');
  }
  
  // Ensure 7 digits
  let code = productCode.substring(0, 7).padStart(7, '0');
  
  // Calculate and append check digit
  const checkDigit = calculateEAN8CheckDigit(code);
  return code + checkDigit;
}

/**
 * Generate custom sequential barcode
 * @param {string} prefix - Prefix for barcode
 * @param {number} sequence - Sequential number
 * @param {number} length - Total length of barcode
 * @returns {string} - Custom barcode
 */
function generateCustomBarcode(prefix = 'PRD', sequence = 1, length = 13) {
  const seqStr = sequence.toString();
  const prefixLength = prefix.length;
  const seqLength = length - prefixLength;
  
  if (seqLength <= 0) {
    throw new Error('Barcode length must be greater than prefix length');
  }
  
  return prefix + seqStr.padStart(seqLength, '0');
}

/**
 * Validate EAN-13 barcode
 * @param {string} barcode - 13-digit barcode
 * @returns {boolean} - True if valid
 */
function validateEAN13(barcode) {
  if (!barcode || barcode.length !== 13) return false;
  
  try {
    const code = barcode.substring(0, 12);
    const checkDigit = parseInt(barcode[12]);
    return calculateEAN13CheckDigit(code) === checkDigit;
  } catch (error) {
    return false;
  }
}

/**
 * Validate EAN-8 barcode
 * @param {string} barcode - 8-digit barcode
 * @returns {boolean} - True if valid
 */
function validateEAN8(barcode) {
  if (!barcode || barcode.length !== 8) return false;
  
  try {
    const code = barcode.substring(0, 7);
    const checkDigit = parseInt(barcode[7]);
    return calculateEAN8CheckDigit(code) === checkDigit;
  } catch (error) {
    return false;
  }
}

/**
 * Get next available sequence number for custom barcodes
 * @param {Object} tenantModels - Tenant database models
 * @param {string} prefix - Barcode prefix
 * @returns {Promise<number>} - Next sequence number
 */
async function getNextSequence(tenantModels, prefix = 'PRD') {
  const { Op } = require('sequelize');
  
  const lastItem = await tenantModels.InventoryItem.findOne({
    where: {
      barcode: {
        [Op.like]: `${prefix}%`
      }
    },
    order: [['barcode', 'DESC']],
  });
  
  if (!lastItem || !lastItem.barcode) {
    return 1;
  }
  
  // Extract sequence number from barcode
  const seqStr = lastItem.barcode.substring(prefix.length);
  const seq = parseInt(seqStr) || 0;
  return seq + 1;
}

module.exports = {
  generateEAN13,
  generateEAN8,
  generateCustomBarcode,
  validateEAN13,
  validateEAN8,
  calculateEAN13CheckDigit,
  calculateEAN8CheckDigit,
  getNextSequence,
};
