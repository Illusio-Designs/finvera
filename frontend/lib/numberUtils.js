/**
 * Convert number to Indian number format (with commas)
 */
export const formatIndianNumber = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  const number = parseFloat(num);
  return number.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Convert number to words (Indian format - lakhs, crores)
 */
export const numberToWords = (num) => {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  const convertHundreds = (n) => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      return result;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result;
  };
  
  const convert = (n) => {
    if (n === 0) return '';
    if (n >= 10000000) {
      return convert(Math.floor(n / 10000000)) + 'Crore ' + convert(n % 10000000);
    }
    if (n >= 100000) {
      return convert(Math.floor(n / 100000)) + 'Lakh ' + convert(n % 100000);
    }
    if (n >= 1000) {
      return convert(Math.floor(n / 1000)) + 'Thousand ' + convert(n % 1000);
    }
    return convertHundreds(n);
  };
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? 'Minus ' : '';
  return sign + convert(absNum).trim();
};

/**
 * Parse Indian number format (remove commas, etc.)
 */
export const parseIndianNumber = (str) => {
  if (!str) return 0;
  const cleaned = String(str).replace(/,/g, '').replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

/**
 * Round to specified decimal places
 */
export const roundTo = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return 0;
  return parseFloat(parseFloat(num).toFixed(decimals));
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (part, total) => {
  if (!total || total === 0) return 0;
  return (part / total) * 100;
};

/**
 * Format GST rate (with %)
 */
export const formatGSTRate = (rate) => {
  if (rate === null || rate === undefined || isNaN(rate)) return '0%';
  return `${parseFloat(rate).toFixed(2)}%`;
};

/**
 * Calculate GST amount
 */
export const calculateGST = (amount, rate) => {
  if (!amount || !rate) return 0;
  return (parseFloat(amount) * parseFloat(rate)) / 100;
};

/**
 * Calculate total with GST
 */
export const calculateTotalWithGST = (amount, rate) => {
  if (!amount) return 0;
  const gstAmount = calculateGST(amount, rate);
  return parseFloat(amount) + gstAmount;
};

/**
 * Calculate CGST and SGST (half of GST rate each)
 */
export const calculateCGSTSGST = (amount, gstRate) => {
  const gstAmount = calculateGST(amount, gstRate);
  return {
    cgst: roundTo(gstAmount / 2, 2),
    sgst: roundTo(gstAmount / 2, 2),
    total: roundTo(gstAmount, 2),
  };
};

/**
 * Calculate IGST (full GST rate)
 */
export const calculateIGST = (amount, gstRate) => {
  return {
    igst: roundTo(calculateGST(amount, gstRate), 2),
    total: roundTo(calculateGST(amount, gstRate), 2),
  };
};

/**
 * Validate if number is positive
 */
export const isPositive = (num) => {
  return num !== null && num !== undefined && !isNaN(num) && parseFloat(num) > 0;
};

/**
 * Validate if number is non-negative
 */
export const isNonNegative = (num) => {
  return num !== null && num !== undefined && !isNaN(num) && parseFloat(num) >= 0;
};

