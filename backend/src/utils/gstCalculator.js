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
 * Determine GST rate based on HSN/SAC code - DEPRECATED
 * Use Sandbox API for accurate GST rates instead
 * @param {string} hsnSacCode - HSN or SAC code
 * @param {string} itemType - 'goods' or 'services'
 * @returns {number} GST rate percentage (fallback only)
 * @deprecated Use gstApiService.getGSTRate() with Sandbox API instead
 */
function getGSTRateByHSN(hsnSacCode, itemType = 'goods') {
  console.warn('getGSTRateByHSN is deprecated. Use gstApiService.getGSTRate() with Sandbox API for accurate rates.');
  
  // Return default 18% as fallback only
  // In production, always use Sandbox API for accurate rates
  return 18;
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

