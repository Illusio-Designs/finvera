/**
 * GST Calculation Utilities for Indian Tax System
 */

/**
 * Calculate GST based on place of supply and GSTIN
 * @param {number} taxableAmount - Taxable amount
 * @param {number} gstRate - GST rate (e.g., 18 for 18%)
 * @param {string} supplierState - Supplier's state
 * @param {string} placeOfSupply - Place of supply state
 * @param {boolean} isInterstate - Whether transaction is interstate
 * @returns {Object} GST breakdown
 */
function calculateGST(taxableAmount, gstRate, supplierState, placeOfSupply, isInterstate = null) {
  const amount = parseFloat(taxableAmount);
  const rate = parseFloat(gstRate) / 100;

  // Determine if interstate
  if (isInterstate === null) {
    isInterstate = supplierState !== placeOfSupply;
  }

  if (isInterstate) {
    // Interstate: IGST
    const igst = amount * rate;
    return {
      cgst: 0,
      sgst: 0,
      igst: parseFloat(igst.toFixed(2)),
      cess: 0,
      totalTax: parseFloat(igst.toFixed(2)),
    };
  } else {
    // Intrastate: CGST + SGST
    const halfRate = rate / 2;
    const cgst = amount * halfRate;
    const sgst = amount * halfRate;
    return {
      cgst: parseFloat(cgst.toFixed(2)),
      sgst: parseFloat(sgst.toFixed(2)),
      igst: 0,
      cess: 0,
      totalTax: parseFloat((cgst + sgst).toFixed(2)),
    };
  }
}

/**
 * Calculate GST with Cess
 * @param {number} taxableAmount - Taxable amount
 * @param {number} gstRate - GST rate
 * @param {number} cessRate - Cess rate (optional)
 * @param {string} supplierState - Supplier's state
 * @param {string} placeOfSupply - Place of supply state
 * @returns {Object} GST breakdown with cess
 */
function calculateGSTWithCess(taxableAmount, gstRate, cessRate, supplierState, placeOfSupply) {
  const gst = calculateGST(taxableAmount, gstRate, supplierState, placeOfSupply);
  const cess = cessRate ? (parseFloat(taxableAmount) * parseFloat(cessRate) / 100) : 0;

  return {
    ...gst,
    cess: parseFloat(cess.toFixed(2)),
    totalTax: parseFloat((gst.totalTax + cess).toFixed(2)),
  };
}

/**
 * Determine GST rate based on HSN/SAC code
 * Common GST rates in India: 0%, 0.25%, 3%, 5%, 12%, 18%, 28%
 * @param {string} hsnSacCode - HSN or SAC code
 * @param {string} itemType - 'goods' or 'services'
 * @returns {number} GST rate percentage
 */
function getGSTRateByHSN(hsnSacCode, itemType = 'goods') {
  // Simplified mapping - in production, use a comprehensive HSN/SAC database
  const hsnPrefix = hsnSacCode ? hsnSacCode.substring(0, 2) : '';

  // Common rates mapping (simplified)
  const rateMap = {
    '00': 0, // Nil rated
    '01': 0.25, // Precious metals
    '02': 3, // Gold
    '03': 5, // Common items
    '04': 12, // Standard items
    '05': 18, // Most common
    '06': 28, // Luxury items
  };

  return rateMap[hsnPrefix] || 18; // Default 18%
}

/**
 * Calculate reverse charge GST
 * @param {number} taxableAmount - Taxable amount
 * @param {number} gstRate - GST rate
 * @param {string} supplierState - Supplier's state
 * @param {string} placeOfSupply - Place of supply state
 * @returns {Object} Reverse charge GST breakdown
 */
function calculateReverseChargeGST(taxableAmount, gstRate, supplierState, placeOfSupply) {
  // Reverse charge: Recipient pays GST
  return calculateGST(taxableAmount, gstRate, supplierState, placeOfSupply);
}

/**
 * Round off amount to nearest rupee
 * @param {number} amount - Amount to round
 * @returns {number} Rounded amount
 */
function roundOff(amount) {
  return Math.round(parseFloat(amount));
}

module.exports = {
  calculateGST,
  calculateGSTWithCess,
  getGSTRateByHSN,
  calculateReverseChargeGST,
  roundOff,
};

