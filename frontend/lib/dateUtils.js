/**
 * Format date to API format (YYYY-MM-DD)
 */
export const formatDateForAPI = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse date from API format (YYYY-MM-DD)
 */
export const parseDateFromAPI = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date;
};

/**
 * Get current date in API format
 */
export const getCurrentDate = () => {
  return formatDateForAPI(new Date());
};

/**
 * Get date N days from today
 */
export const getDateNDaysFromToday = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateForAPI(date);
};

/**
 * Get start of month
 */
export const getStartOfMonth = (date = new Date()) => {
  const d = new Date(date);
  d.setDate(1);
  return formatDateForAPI(d);
};

/**
 * Get end of month
 */
export const getEndOfMonth = (date = new Date()) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return formatDateForAPI(d);
};

/**
 * Get start of year
 */
export const getStartOfYear = (date = new Date()) => {
  const d = new Date(date);
  d.setMonth(0);
  d.setDate(1);
  return formatDateForAPI(d);
};

/**
 * Get end of year
 */
export const getEndOfYear = (date = new Date()) => {
  const d = new Date(date);
  d.setMonth(11);
  d.setDate(31);
  return formatDateForAPI(d);
};

/**
 * Get financial year (April to March)
 */
export const getFinancialYear = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  
  if (month >= 4) {
    // April to December - current FY
    return {
      start: formatDateForAPI(new Date(year, 3, 1)), // April 1
      end: formatDateForAPI(new Date(year + 1, 2, 31)), // March 31
      label: `${year}-${String(year + 1).substring(2)}`,
    };
  } else {
    // January to March - previous FY
    return {
      start: formatDateForAPI(new Date(year - 1, 3, 1)), // April 1
      end: formatDateForAPI(new Date(year, 2, 31)), // March 31
      label: `${year - 1}-${String(year).substring(2)}`,
    };
  }
};

/**
 * Format date for display (DD-MM-YYYY)
 */
export const formatDateForDisplay = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Get month name
 */
export const getMonthName = (monthIndex) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex] || '';
};

/**
 * Get quarter from date
 */
export const getQuarter = (date = new Date()) => {
  const month = date.getMonth() + 1;
  if (month >= 1 && month <= 3) return 'Q1';
  if (month >= 4 && month <= 6) return 'Q2';
  if (month >= 7 && month <= 9) return 'Q3';
  return 'Q4';
};

/**
 * Get GST return period (MM-YYYY format)
 */
export const getGSTPeriod = (date = new Date()) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}-${year}`;
};

