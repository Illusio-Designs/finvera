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
 * Format number with Indian number system (lakhs/crores)
 */
export const formatNumber = (num, decimals = 2) => {
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
 * Format date to display format (DD-MM-YYYY)
 */
export const formatDate = (date, format = 'DD-MM-YYYY') => {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  switch (format) {
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MMM DD, YYYY':
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${day}, ${year}`;
    default:
      return `${day}-${month}-${year}`;
  }
};

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

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${parseFloat(value).toFixed(decimals)}%`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

