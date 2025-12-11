module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    ACCOUNTANT: 'accountant',
    USER: 'user',
    DISTRIBUTOR: 'distributor',
    SALESMAN: 'salesman',
  },
  VOUCHER_TYPES: {
    SALES: 'sales',
    PURCHASE: 'purchase',
    PAYMENT: 'payment',
    RECEIPT: 'receipt',
    JOURNAL: 'journal',
    CONTRA: 'contra',
  },
  VOUCHER_STATUS: {
    DRAFT: 'draft',
    POSTED: 'posted',
    CANCELLED: 'cancelled',
  },
  COMMISSION_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    PAID: 'paid',
    CANCELLED: 'cancelled',
  },
  PAYOUT_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },
  LEAD_STATUS: {
    NEW: 'new',
    CONTACTED: 'contacted',
    QUALIFIED: 'qualified',
    CONVERTED: 'converted',
    LOST: 'lost',
  },
  GSTR_RETURN_TYPES: {
    GSTR1: 'GSTR1',
    GSTR3B: 'GSTR3B',
    GSTR9: 'GSTR9',
  },
  E_INVOICE_STATUS: {
    PENDING: 'pending',
    GENERATED: 'generated',
    CANCELLED: 'cancelled',
    FAILED: 'failed',
  },
};
