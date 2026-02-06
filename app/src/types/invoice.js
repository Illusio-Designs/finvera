/**
 * Type definitions and PropTypes for Invoice System Enhancement
 * 
 * This file contains all data model definitions for:
 * - E-Invoice Status and Operations
 * - E-Way Bill Status and Operations
 * - TDS Details and Calculations
 * - Company Settings
 * - Notifications
 */

import PropTypes from 'prop-types';

// ============================================================================
// Voucher Types
// ============================================================================

export const VoucherType = {
  SALES_INVOICE: 'SALES_INVOICE',
  PURCHASE_INVOICE: 'PURCHASE_INVOICE',
  CREDIT_NOTE: 'CREDIT_NOTE',
  DEBIT_NOTE: 'DEBIT_NOTE',
  PAYMENT: 'PAYMENT',
  RECEIPT: 'RECEIPT',
  JOURNAL: 'JOURNAL',
  CONTRA: 'CONTRA',
};

export const VoucherTypePropType = PropTypes.oneOf(Object.values(VoucherType));

// ============================================================================
// E-Invoice Models
// ============================================================================

export const EInvoiceStatusType = {
  PENDING: 'PENDING',
  GENERATED: 'GENERATED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
};

export const EInvoiceStatusPropType = PropTypes.shape({
  status: PropTypes.oneOf(Object.values(EInvoiceStatusType)).isRequired,
  irn: PropTypes.string,
  ackNo: PropTypes.string,
  ackDate: PropTypes.instanceOf(Date),
  qrCode: PropTypes.string,
  errorMessage: PropTypes.string,
  generatedAt: PropTypes.instanceOf(Date),
  cancelledAt: PropTypes.instanceOf(Date),
  cancellationReason: PropTypes.string,
});

export const EInvoiceGenerateRequestPropType = PropTypes.shape({
  voucherId: PropTypes.string.isRequired,
  voucherType: VoucherTypePropType.isRequired,
});

export const EInvoiceCancelRequestPropType = PropTypes.shape({
  voucherId: PropTypes.string.isRequired,
  irn: PropTypes.string.isRequired,
  reason: PropTypes.string.isRequired,
  reasonCode: PropTypes.string.isRequired,
});

// ============================================================================
// E-Way Bill Models
// ============================================================================

export const EWayBillStatusType = {
  PENDING: 'PENDING',
  GENERATED: 'GENERATED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
};

export const EWayBillStatusPropType = PropTypes.shape({
  status: PropTypes.oneOf(Object.values(EWayBillStatusType)).isRequired,
  ewbNumber: PropTypes.string,
  validUntil: PropTypes.instanceOf(Date),
  vehicleNumber: PropTypes.string,
  transporterId: PropTypes.string,
  errorMessage: PropTypes.string,
  generatedAt: PropTypes.instanceOf(Date),
  cancelledAt: PropTypes.instanceOf(Date),
  cancellationReason: PropTypes.string,
});

export const EWayBillGenerateRequestPropType = PropTypes.shape({
  voucherId: PropTypes.string.isRequired,
  voucherType: VoucherTypePropType.isRequired,
  vehicleNumber: PropTypes.string,
  transporterId: PropTypes.string,
  distance: PropTypes.number,
});

export const EWayBillUpdateVehicleRequestPropType = PropTypes.shape({
  ewbNumber: PropTypes.string.isRequired,
  vehicleNumber: PropTypes.string.isRequired,
  reasonCode: PropTypes.string.isRequired,
  reasonRemark: PropTypes.string.isRequired,
});

export const EWayBillCancelRequestPropType = PropTypes.shape({
  ewbNumber: PropTypes.string.isRequired,
  reason: PropTypes.string.isRequired,
  reasonCode: PropTypes.string.isRequired,
});

// ============================================================================
// TDS Models
// ============================================================================

export const TDSSection = {
  '194C': '194C', // Contractor payments
  '194J': '194J', // Professional services
  '194H': '194H', // Commission
  '194I': '194I', // Rent
  '194A': '194A', // Interest
  '192': '192',   // Salary
  '194D': '194D', // Insurance commission
  '194G': '194G', // Lottery winnings
  OTHER: 'OTHER',
};

export const TDSSectionPropType = PropTypes.oneOf(Object.values(TDSSection));

export const DeducteeType = {
  INDIVIDUAL: 'INDIVIDUAL',
  COMPANY: 'COMPANY',
  FIRM: 'FIRM',
};

export const TDSDetailsPropType = PropTypes.shape({
  section: TDSSectionPropType.isRequired,
  rate: PropTypes.number.isRequired,
  amount: PropTypes.number.isRequired,
  deducteeType: PropTypes.oneOf(Object.values(DeducteeType)).isRequired,
  panNumber: PropTypes.string,
  calculatedAt: PropTypes.instanceOf(Date).isRequired,
});

export const TDSCalculateRequestPropType = PropTypes.shape({
  voucherId: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  section: TDSSectionPropType.isRequired,
  deducteeType: PropTypes.string.isRequired,
  panNumber: PropTypes.string,
});

// ============================================================================
// Company Settings
// ============================================================================

export const CompanySettingsPropType = PropTypes.shape({
  companyId: PropTypes.string.isRequired,
  eInvoiceEnabled: PropTypes.bool.isRequired,
  eWayBillEnabled: PropTypes.bool.isRequired,
  tdsEnabled: PropTypes.bool.isRequired,
  eInvoiceThreshold: PropTypes.number.isRequired,
  eWayBillThreshold: PropTypes.number.isRequired,
  autoGenerateEInvoice: PropTypes.bool.isRequired,
  autoGenerateEWayBill: PropTypes.bool.isRequired,
  defaultTDSSection: TDSSectionPropType,
});

// ============================================================================
// Notification Models
// ============================================================================

export const NotificationType = {
  E_INVOICE: 'E_INVOICE',
  E_WAY_BILL: 'E_WAY_BILL',
  TDS: 'TDS',
  STATUS_CHANGE: 'STATUS_CHANGE',
};

export const NotificationPayloadPropType = PropTypes.shape({
  type: PropTypes.oneOf(Object.values(NotificationType)).isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  voucherId: PropTypes.string.isRequired,
  voucherNumber: PropTypes.string.isRequired,
  timestamp: PropTypes.instanceOf(Date).isRequired,
  data: PropTypes.object,
});

// ============================================================================
// Voucher Model
// ============================================================================

export const VoucherStatusType = {
  DRAFT: 'DRAFT',
  SAVED: 'SAVED',
  POSTED: 'POSTED',
};

export const LineItemPropType = PropTypes.shape({
  id: PropTypes.string,
  itemName: PropTypes.string.isRequired,
  quantity: PropTypes.number.isRequired,
  rate: PropTypes.number.isRequired,
  amount: PropTypes.number.isRequired,
});

export const VoucherPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  type: VoucherTypePropType.isRequired,
  voucherNumber: PropTypes.string.isRequired,
  date: PropTypes.instanceOf(Date).isRequired,
  partyName: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  netAmount: PropTypes.number.isRequired,
  lineItems: PropTypes.arrayOf(LineItemPropType),
  status: PropTypes.oneOf(Object.values(VoucherStatusType)).isRequired,
});

// ============================================================================
// API Response Models
// ============================================================================

export const APIErrorPropType = PropTypes.shape({
  code: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  details: PropTypes.object,
});

export const APIResponsePropType = PropTypes.shape({
  success: PropTypes.bool.isRequired,
  data: PropTypes.any,
  error: APIErrorPropType,
  timestamp: PropTypes.instanceOf(Date).isRequired,
});

// ============================================================================
// Offline Operation Models
// ============================================================================

export const OfflineOperationType = {
  E_INVOICE_GENERATE: 'E_INVOICE_GENERATE',
  E_WAY_BILL_GENERATE: 'E_WAY_BILL_GENERATE',
  TDS_CALCULATE: 'TDS_CALCULATE',
  CANCEL_DOCUMENT: 'CANCEL_DOCUMENT',
};

export const OfflineOperationPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  type: PropTypes.oneOf(Object.values(OfflineOperationType)).isRequired,
  payload: PropTypes.any.isRequired,
  voucherId: PropTypes.string.isRequired,
  createdAt: PropTypes.instanceOf(Date).isRequired,
  retryCount: PropTypes.number.isRequired,
  maxRetries: PropTypes.number.isRequired,
});

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  SETTINGS: '@app/settings',
  OFFLINE_QUEUE: '@app/offline_queue',
  NOTIFICATION_HISTORY: '@app/notifications',
  USER_PREFERENCES: '@app/preferences',
};

// ============================================================================
// Helper Functions for Type Conversion
// ============================================================================

/**
 * Convert API date string to Date object
 */
export const parseDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString);
};

/**
 * Convert Date object to API date string
 */
export const formatDate = (date) => {
  if (!date) return null;
  return date.toISOString();
};

/**
 * Parse E-Invoice status from API response
 */
export const parseEInvoiceStatus = (apiData) => {
  if (!apiData) return null;
  return {
    status: apiData.status,
    irn: apiData.irn || null,
    ackNo: apiData.ack_no || apiData.ackNo || null,
    ackDate: parseDate(apiData.ack_date || apiData.ackDate),
    qrCode: apiData.qr_code || apiData.qrCode || null,
    errorMessage: apiData.error_message || apiData.errorMessage || null,
    generatedAt: parseDate(apiData.generated_at || apiData.generatedAt),
    cancelledAt: parseDate(apiData.cancelled_at || apiData.cancelledAt),
    cancellationReason: apiData.cancellation_reason || apiData.cancellationReason || null,
  };
};

/**
 * Parse E-Way Bill status from API response
 */
export const parseEWayBillStatus = (apiData) => {
  if (!apiData) return null;
  return {
    status: apiData.status,
    ewbNumber: apiData.ewb_number || apiData.ewbNumber || null,
    validUntil: parseDate(apiData.valid_until || apiData.validUntil),
    vehicleNumber: apiData.vehicle_number || apiData.vehicleNumber || null,
    transporterId: apiData.transporter_id || apiData.transporterId || null,
    errorMessage: apiData.error_message || apiData.errorMessage || null,
    generatedAt: parseDate(apiData.generated_at || apiData.generatedAt),
    cancelledAt: parseDate(apiData.cancelled_at || apiData.cancelledAt),
    cancellationReason: apiData.cancellation_reason || apiData.cancellationReason || null,
  };
};

/**
 * Parse TDS details from API response
 */
export const parseTDSDetails = (apiData) => {
  if (!apiData) return null;
  return {
    section: apiData.section,
    rate: apiData.rate,
    amount: apiData.amount,
    deducteeType: apiData.deductee_type || apiData.deducteeType,
    panNumber: apiData.pan_number || apiData.panNumber || null,
    calculatedAt: parseDate(apiData.calculated_at || apiData.calculatedAt),
  };
};

/**
 * Parse company settings from API response
 */
export const parseCompanySettings = (apiData) => {
  if (!apiData) return null;
  return {
    companyId: apiData.company_id || apiData.companyId,
    eInvoiceEnabled: apiData.e_invoice_enabled || apiData.eInvoiceEnabled || false,
    eWayBillEnabled: apiData.e_way_bill_enabled || apiData.eWayBillEnabled || false,
    tdsEnabled: apiData.tds_enabled || apiData.tdsEnabled || false,
    eInvoiceThreshold: apiData.e_invoice_threshold || apiData.eInvoiceThreshold || 0,
    eWayBillThreshold: apiData.e_way_bill_threshold || apiData.eWayBillThreshold || 50000,
    autoGenerateEInvoice: apiData.auto_generate_e_invoice || apiData.autoGenerateEInvoice || false,
    autoGenerateEWayBill: apiData.auto_generate_e_way_bill || apiData.autoGenerateEWayBill || false,
    defaultTDSSection: apiData.default_tds_section || apiData.defaultTDSSection || null,
  };
};
