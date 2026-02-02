// Business Logic Functions (Copied from Frontend)
// These functions are copied from frontend/lib/ for consistency

// Currency formatting (from frontend/lib/formatters.js)
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

// Date formatting (from frontend/lib/dateUtils.js)
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Number utilities (from frontend/lib/numberUtils.js)
export const formatNumber = (number) => {
  if (!number) return '0';
  return new Intl.NumberFormat('en-IN').format(number);
};

// Validation functions (from frontend/lib/validators.js)
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateGSTIN = (gstin) => {
  if (!gstin) return false;
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
};

export const validatePAN = (pan) => {
  if (!pan) return false;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

// Role configurations (from frontend/lib/roleConfig.js)
export const canAccessClientPortal = (role) => {
  const clientRoles = ['client', 'company_admin', 'branch_admin', 'accountant', 'data_entry'];
  return clientRoles.includes(role);
};

export const getDefaultRedirect = (role, userId) => {
  switch (role) {
    case 'client':
    case 'company_admin':
    case 'branch_admin':
    case 'accountant':
    case 'data_entry':
      return '/client/dashboard';
    default:
      return '/client/dashboard';
  }
};

export const getRoleDisplayName = (role) => {
  const roleNames = {
    client: 'Client',
    company_admin: 'Company Admin',
    branch_admin: 'Branch Admin',
    accountant: 'Accountant',
    data_entry: 'Data Entry',
  };
  return roleNames[role] || 'User';
};

// Color utilities (from frontend/lib/colors.js)
export const getStatusColor = (status) => {
  const statusColors = {
    active: '#10b981',
    inactive: '#6b7280',
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
    draft: '#f59e0b',
    posted: '#10b981',
    cancelled: '#ef4444',
    resolved: '#10b981',
    closed: '#6b7280',
    in_progress: '#f59e0b',
    assigned: '#3b82f6',
    urgent: '#ef4444',
    high: '#f59e0b',
    medium: '#f59e0b',
    low: '#6b7280',
  };
  return statusColors[status] || '#6b7280';
};

// GST calculations (from frontend/lib/gstCalculator.js)
export const calculateGST = (amount, rate) => {
  if (!amount || !rate) return { cgst: 0, sgst: 0, igst: 0, total: amount || 0 };
  
  const gstAmount = (amount * rate) / 100;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const igst = gstAmount;
  const total = amount + gstAmount;
  
  return { cgst, sgst, igst, total };
};

export const calculateGSTFromInclusive = (inclusiveAmount, rate) => {
  if (!inclusiveAmount || !rate) return { amount: inclusiveAmount || 0, gst: 0 };
  
  const amount = inclusiveAmount / (1 + rate / 100);
  const gst = inclusiveAmount - amount;
  
  return { amount, gst };
};

// Encryption utilities (basic implementation for mobile)
export const encryptData = (data) => {
  // Basic implementation - in production, use proper encryption
  return btoa(JSON.stringify(data));
};

export const decryptData = (encryptedData) => {
  try {
    return JSON.parse(atob(encryptedData));
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};