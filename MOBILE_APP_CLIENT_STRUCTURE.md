# Mobile App Client Structure Documentation

## Overview
This document outlines the complete structure for adapting the frontend client portal to the mobile app. The mobile app will mirror the functionality of the frontend client portal with React Native components and mobile-optimized UI/UX, maintaining consistent branding, fonts, and color schemes.

## Design System & UI Consistency

### Brand Colors (From Frontend)
```css
/* Primary Brand Colors */
--finvera-primary: #3e60ab;           /* Main brand blue */
--finvera-primary-dark: #243a75;      /* Secondary darker blue */
--finvera-secondary: #243a75;         /* Secondary color */

/* Gradient Colors */
--finvera-gradient-dark: #2140D7;     /* Dark gradient */
--finvera-gradient-medium: #3665E6;   /* Medium gradient */
--finvera-gradient-light: #4A85EE;    /* Light gradient */
--finvera-tagline: #3D78E0;           /* Tagline color */

/* Neutral Colors */
--finvera-white: #FFFFFF;
--finvera-black: #000000;
```

### Typography
- **Primary Font**: Agency (custom font from `/fonts/agency.otf`)
- **Fallback Fonts**: Arial Black, Arial, sans-serif
- **Font Weight**: Normal (Agency font doesn't support multiple weights)
- **Letter Spacing**: 0.02em for headings

### Color Palette for Mobile App
```javascript
// React Native StyleSheet colors
const colors = {
  primary: {
    50: '#f0f4fc',
    100: '#e1e9f9',
    200: '#c3d3f3',
    300: '#a5bded',
    400: '#87a7e7',
    500: '#3e60ab',  // Main brand color
    600: '#36509a',
    700: '#2d4089',
    800: '#243a75',  // Secondary color
    900: '#1b2d61',
  },
  gradient: {
    dark: '#2140D7',
    medium: '#3665E6',
    light: '#4A85EE',
    tagline: '#3D78E0',
  },
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    }
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  }
};
```

## Current Frontend Client Structure Analysis

### Main Client Pages (54 total screens to implement)
```
frontend/pages/client/
├── dashboard.jsx                    # ✅ Main dashboard with stats and quick actions
├── login.jsx                       # ✅ Client login page (EXISTING)
├── register.jsx                    # Registration
├── profile.jsx                     # User profile management
├── settings.jsx                    # Account settings
├── companies.jsx                   # Company management
├── branches.jsx                    # Branch management
├── ledgers.jsx                     # Ledger management
├── inventory.jsx                   # Inventory management
├── inventory-items-unified.jsx     # Unified inventory items
├── inventory-adjustment.jsx        # Stock adjustments
├── inventory-transfer.jsx          # Stock transfers
├── warehouses.jsx                  # Warehouse management
├── attributes.jsx                  # Product attributes
├── gstins.jsx                      # GSTIN management
├── gst-rates.jsx                   # GST rates
├── einvoice.jsx                    # E-invoice management
├── ewaybill.jsx                    # E-way bill management
├── income-tax.jsx                  # Income tax
├── tds.jsx                         # TDS management
├── tally-import.jsx                # Tally import
├── notifications.jsx               # Notifications
├── notification-preferences.jsx    # Notification settings
├── support.jsx                     # Support tickets
├── referral.jsx                    # Referral program
├── plans.jsx                       # Subscription plans
├── subscribe.jsx                   # Subscription management
├── review.jsx                      # Reviews
├── loan.jsx                        # Loan application
├── forgot-password.jsx             # Password reset
└── reset-password.jsx              # Password reset form
```

### Subdirectories (25 additional screens)
```
├── accounting/
│   └── outstanding.jsx             # Outstanding amounts
├── gst/
│   ├── analytics.jsx               # GST analytics
│   └── returns/                    # GST returns (multiple files)
├── income-tax/
│   └── calculator.jsx              # Tax calculator
├── reports/
│   ├── index.jsx                   # Reports dashboard
│   ├── balance-sheet.jsx           # Balance sheet
│   ├── profit-loss.jsx             # P&L statement
│   ├── trial-balance.jsx           # Trial balance
│   ├── ledger-statement.jsx        # Ledger statements
│   ├── stock-ledger.jsx            # Stock ledger
│   └── stock-summary.jsx           # Stock summary
├── tds/
│   └── analytics.jsx               # TDS analytics
└── vouchers/
    ├── vouchers.jsx                # Voucher list
    ├── [id].jsx                    # Voucher details
    ├── sales-invoice.jsx           # Sales invoice
    ├── purchase-invoice.jsx        # Purchase invoice
    ├── payment.jsx                 # Payment voucher
    ├── receipt.jsx                 # Receipt voucher
    ├── journal.jsx                 # Journal entry
    ├── contra.jsx                  # Contra entry
    ├── debit-note.jsx              # Debit note
    ├── credit-note.jsx             # Credit note
    ├── gst-payment.jsx             # GST payment
    ├── gst-utilization.jsx         # GST utilization
    ├── tds-payment.jsx             # TDS payment
    └── tds-settlement.jsx          # TDS settlement
```

## Complete Mobile App Structure

### Directory Structure (79 total screens)
```
app/src/screens/client/
├── dashboard/
│   └── DashboardScreen.jsx         # ✅ Main dashboard (EXISTING)
├── auth/
│   ├── SplashScreen.jsx            # App splash screen with branding
│   ├── LoginScreen.jsx             # ✅ Login (EXISTING)
│   ├── RegisterScreen.jsx          # Registration
│   ├── ForgotPasswordScreen.jsx    # Password reset
│   └── ResetPasswordScreen.jsx     # Password reset form
├── profile/
│   ├── ProfileScreen.jsx           # User profile
│   ├── SettingsScreen.jsx          # Account settings
│   └── NotificationPreferencesScreen.jsx # Notification settings
├── company/
│   ├── CompaniesScreen.jsx         # Company management
│   ├── BranchesScreen.jsx          # Branch management
│   └── CompanyDetailsScreen.jsx    # Company details
├── accounting/
│   ├── LedgersScreen.jsx           # Ledger management
│   ├── LedgerDetailsScreen.jsx     # Ledger details
│   └── OutstandingScreen.jsx       # Outstanding amounts
├── inventory/
│   ├── InventoryScreen.jsx         # Main inventory
│   ├── InventoryItemsScreen.jsx    # Unified inventory items
│   ├── InventoryAdjustmentScreen.jsx # Stock adjustments
│   ├── InventoryTransferScreen.jsx # Stock transfers
│   ├── WarehousesScreen.jsx        # Warehouse management
│   └── AttributesScreen.jsx        # Product attributes
├── gst/
│   ├── GSTINsScreen.jsx            # GSTIN management
│   ├── GSTRatesScreen.jsx          # GST rates
│   ├── EInvoiceScreen.jsx          # E-invoice management
│   ├── EWayBillScreen.jsx          # E-way bill management
│   ├── GSTAnalyticsScreen.jsx      # GST analytics
│   └── returns/
│       ├── GSTR1Screen.jsx         # GSTR1 returns
│       ├── GSTR3BScreen.jsx        # GSTR3B returns
│       └── GSTReturnsScreen.jsx    # GST returns dashboard
├── tax/
│   ├── IncomeTaxScreen.jsx         # Income tax
│   ├── TaxCalculatorScreen.jsx     # Tax calculator
│   ├── TDSScreen.jsx               # TDS management
│   └── TDSAnalyticsScreen.jsx      # TDS analytics
├── vouchers/
│   ├── VouchersScreen.jsx          # Voucher list
│   ├── VoucherDetailsScreen.jsx    # Voucher details
│   ├── SalesInvoiceScreen.jsx      # Sales invoice
│   ├── PurchaseInvoiceScreen.jsx   # Purchase invoice
│   ├── PaymentScreen.jsx           # Payment voucher
│   ├── ReceiptScreen.jsx           # Receipt voucher
│   ├── JournalScreen.jsx           # Journal entry
│   ├── ContraScreen.jsx            # Contra entry
│   ├── DebitNoteScreen.jsx         # Debit note
│   ├── CreditNoteScreen.jsx        # Credit note
│   ├── GSTPaymentScreen.jsx        # GST payment
│   ├── GSTUtilizationScreen.jsx    # GST utilization
│   ├── TDSPaymentScreen.jsx        # TDS payment
│   └── TDSSettlementScreen.jsx     # TDS settlement
├── reports/
│   ├── ReportsScreen.jsx           # Reports dashboard
│   ├── BalanceSheetScreen.jsx      # Balance sheet
│   ├── ProfitLossScreen.jsx        # P&L statement
│   ├── TrialBalanceScreen.jsx      # Trial balance
│   ├── LedgerStatementScreen.jsx   # Ledger statements
│   ├── StockLedgerScreen.jsx       # Stock ledger
│   └── StockSummaryScreen.jsx      # Stock summary
├── tools/
│   ├── TallyImportScreen.jsx       # Tally import
│   └── NotificationsScreen.jsx     # Notifications
├── business/
│   ├── SupportScreen.jsx           # Support tickets
│   ├── ReferralScreen.jsx          # Referral program
│   ├── PlansScreen.jsx             # Subscription plans
│   ├── SubscribeScreen.jsx         # Subscription management
│   ├── ReviewScreen.jsx            # Reviews
│   └── LoanScreen.jsx              # Loan application
└── vouchers/                       # Voucher screens (already listed above)
```

## Component Library Structure

### Core Components (Mobile-Optimized)
```
app/src/components/
├── ui/
│   ├── Button.jsx                  # Consistent with frontend Button
│   ├── Card.jsx                    # Mobile-optimized Card
│   ├── Input.jsx                   # Form inputs
│   ├── Select.jsx                  # Dropdown selects
│   ├── Modal.jsx                   # Mobile modals
│   ├── LoadingSpinner.jsx          # Loading states
│   ├── Badge.jsx                   # Status badges
│   ├── Alert.jsx                   # Alert messages
│   ├── Tabs.jsx                    # Tab navigation
│   ├── Accordion.jsx               # Collapsible content
│   ├── ProgressBar.jsx             # Progress indicators
│   ├── Avatar.jsx                  # User avatars
│   ├── Checkbox.jsx                # Checkboxes
│   ├── RadioGroup.jsx              # Radio buttons
│   ├── ToggleSwitch.jsx            # Toggle switches
│   ├── Tooltip.jsx                 # Tooltips
│   ├── EmptyState.jsx              # Empty states
│   └── ErrorBoundary.jsx           # Error handling
├── forms/
│   ├── FormInput.jsx               # Form input wrapper
│   ├── FormSelect.jsx              # Form select wrapper
│   ├── FormDatePicker.jsx          # Date picker
│   ├── FormTextarea.jsx            # Textarea
│   ├── FormPasswordInput.jsx       # Password input
│   ├── FormPhoneInput.jsx          # Phone input
│   ├── FileUpload.jsx              # File upload
│   └── FormActions.jsx             # Form action buttons
├── layout/
│   ├── Header.jsx                  # App header
│   ├── TabBar.jsx                  # Bottom tab navigation
│   ├── Sidebar.jsx                 # Drawer navigation
│   ├── SafeAreaView.jsx            # Safe area wrapper
│   └── KeyboardAvoidingView.jsx    # Keyboard handling
├── charts/
│   ├── LineChart.jsx               # Line charts
│   ├── BarChart.jsx                # Bar charts
│   ├── PieChart.jsx                # Pie charts
│   └── DonutChart.jsx              # Donut charts
└── business/
    ├── VoucherCard.jsx             # Voucher display card
    ├── LedgerCard.jsx              # Ledger display card
    ├── StatCard.jsx                # Dashboard stat card
    ├── TransactionList.jsx         # Transaction list
    ├── InvoiceTemplate.jsx         # Invoice template
    └── ReportTable.jsx             # Report table
```

## Implementation Phases

### Phase 1: Foundation & Core Screens (Priority 1)
**Timeline: Week 1-2**
1. ✅ Setup mobile app styling system (colors, fonts, themes)
2. ✅ Create core UI components library
3. ✅ Implement authentication screens
   - SplashScreen.jsx (App launch screen)
   - ✅ LoginScreen.jsx (EXISTING)
   - RegisterScreen.jsx
   - ForgotPasswordScreen.jsx
   - ResetPasswordScreen.jsx
4. ✅ Dashboard implementation
   - ✅ DashboardScreen.jsx (EXISTING)
5. Profile & Settings
   - ProfileScreen.jsx
   - SettingsScreen.jsx
   - NotificationPreferencesScreen.jsx

### Phase 2: Core Business Features (Priority 2)
**Timeline: Week 3-4**
1. Company Management
   - CompaniesScreen.jsx
   - BranchesScreen.jsx
   - CompanyDetailsScreen.jsx
2. Accounting Basics
   - LedgersScreen.jsx
   - LedgerDetailsScreen.jsx
   - OutstandingScreen.jsx
3. Basic Vouchers
   - VouchersScreen.jsx
   - VoucherDetailsScreen.jsx
   - SalesInvoiceScreen.jsx
   - PurchaseInvoiceScreen.jsx

### Phase 3: Advanced Features (Priority 3)
**Timeline: Week 5-6**
1. Inventory Management
   - InventoryScreen.jsx
   - InventoryItemsScreen.jsx
   - InventoryAdjustmentScreen.jsx
   - InventoryTransferScreen.jsx
   - WarehousesScreen.jsx
   - AttributesScreen.jsx
2. GST Management
   - GSTINsScreen.jsx
   - GSTRatesScreen.jsx
   - EInvoiceScreen.jsx
   - EWayBillScreen.jsx
   - GSTAnalyticsScreen.jsx

### Phase 4: Compliance & Reporting (Priority 4)
**Timeline: Week 7-8**
1. Tax Management
   - IncomeTaxScreen.jsx
   - TaxCalculatorScreen.jsx
   - TDSScreen.jsx
   - TDSAnalyticsScreen.jsx
2. Reports
   - ReportsScreen.jsx
   - BalanceSheetScreen.jsx
   - ProfitLossScreen.jsx
   - TrialBalanceScreen.jsx
   - LedgerStatementScreen.jsx
   - StockLedgerScreen.jsx
   - StockSummaryScreen.jsx

### Phase 5: Extended Vouchers & Tools (Priority 5)
**Timeline: Week 9-10**
1. Complete Voucher System
   - PaymentScreen.jsx
   - ReceiptScreen.jsx
   - JournalScreen.jsx
   - ContraScreen.jsx
   - DebitNoteScreen.jsx
   - CreditNoteScreen.jsx
   - GSTPaymentScreen.jsx
   - GSTUtilizationScreen.jsx
   - TDSPaymentScreen.jsx
   - TDSSettlementScreen.jsx
2. Tools & Utilities
   - TallyImportScreen.jsx
   - NotificationsScreen.jsx

### Phase 6: Business Services (Priority 6)
**Timeline: Week 11-12**
1. Support & Services
   - SupportScreen.jsx
   - ReferralScreen.jsx
   - PlansScreen.jsx
   - SubscribeScreen.jsx
   - ReviewScreen.jsx
   - LoanScreen.jsx
2. GST Returns
   - GSTR1Screen.jsx
   - GSTR3BScreen.jsx
   - GSTReturnsScreen.jsx

## Technical Requirements

### Mobile App Configuration Updates Needed

#### 1. Update Tailwind Config
```javascript
// app/tailwind.config.js - NEEDS UPDATE
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    fontFamily: {
      'agency': ['Agency', 'Arial Black', 'Arial', 'sans-serif'],
      'primary': ['Agency', 'Arial Black', 'Arial', 'sans-serif'],
      'sans': ['Agency', 'Arial Black', 'Arial', 'sans-serif'],
    },
    extend: {
      colors: {
        primary: {
          50: '#f0f4fc',
          100: '#e1e9f9',
          200: '#c3d3f3',
          300: '#a5bded',
          400: '#87a7e7',
          500: '#3e60ab',
          600: '#36509a',
          700: '#2d4089',
          800: '#243a75',
          900: '#1b2d61',
        },
        gradient: {
          dark: '#2140D7',
          medium: '#3665E6',
          light: '#4A85EE',
          tagline: '#3D78E0',
        },
      },
    },
  },
  plugins: [],
}
```

#### 2. Update Global CSS
```css
/* app/global.css - NEEDS UPDATE */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Agency Font Integration */
@font-face {
  font-family: 'Agency';
  src: url('../assets/fonts/agency.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@layer base {
  * {
    font-family: 'Agency', 'Arial Black', 'Arial', sans-serif;
  }
}

/* Custom scrollbar for mobile */
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

#### 3. Add Agency Font Asset
- Copy `frontend/public/fonts/agency.otf` to `app/assets/fonts/agency.otf`

#### 4. Update Navigation Structure
```javascript
// app/src/navigation/ - NEEDS EXPANSION
├── AppNavigator.jsx        # Main app navigator
├── AuthNavigator.jsx       # Auth flow navigator  
├── ClientNavigator.jsx     # Client portal navigator
├── TabNavigator.jsx        # Bottom tab navigation
└── DrawerNavigator.jsx     # Drawer/sidebar navigation
```

## API Integration & Business Logic

### API Library Structure
The mobile app will use a comprehensive API integration system that mirrors the frontend implementation:

```javascript
// app/src/lib/api.js - COMPLETE API INTEGRATION
import { apiClient } from './apiClient';

// Authentication APIs
export const authAPI = {
  login: (email, password, portalType, companyId) => apiClient.post('/auth/login', { email, password, portal_type: portalType, company_id: companyId }),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => apiClient.post('/auth/reset-password', { token, password }),
  verifyToken: () => apiClient.get('/auth/verify'),
  refreshToken: () => apiClient.post('/auth/refresh'),
};

// Company Management APIs
export const companyAPI = {
  list: () => apiClient.get('/companies'),
  create: (data) => apiClient.post('/companies', data),
  update: (id, data) => apiClient.put(`/companies/${id}`, data),
  delete: (id) => apiClient.delete(`/companies/${id}`),
  get: (id) => apiClient.get(`/companies/${id}`),
};

// Branch Management APIs
export const branchAPI = {
  list: () => apiClient.get('/branches'),
  create: (data) => apiClient.post('/branches', data),
  update: (id, data) => apiClient.put(`/branches/${id}`, data),
  delete: (id) => apiClient.delete(`/branches/${id}`),
  get: (id) => apiClient.get(`/branches/${id}`),
};

// Accounting APIs
export const accountingAPI = {
  dashboard: () => apiClient.get('/accounting/dashboard'),
  ledgers: {
    list: (params) => apiClient.get('/ledgers', { params }),
    create: (data) => apiClient.post('/ledgers', data),
    update: (id, data) => apiClient.put(`/ledgers/${id}`, data),
    delete: (id) => apiClient.delete(`/ledgers/${id}`),
    get: (id) => apiClient.get(`/ledgers/${id}`),
    statement: (id, params) => apiClient.get(`/ledgers/${id}/statement`, { params }),
  },
  outstanding: (params) => apiClient.get('/accounting/outstanding', { params }),
};

// Voucher APIs
export const voucherAPI = {
  list: (params) => apiClient.get('/vouchers', { params }),
  create: (data) => apiClient.post('/vouchers', data),
  update: (id, data) => apiClient.put(`/vouchers/${id}`, data),
  delete: (id) => apiClient.delete(`/vouchers/${id}`),
  get: (id) => apiClient.get(`/vouchers/${id}`),
  types: () => apiClient.get('/voucher-types'),
  salesInvoice: {
    create: (data) => apiClient.post('/vouchers/sales-invoice', data),
    update: (id, data) => apiClient.put(`/vouchers/sales-invoice/${id}`, data),
  },
  purchaseInvoice: {
    create: (data) => apiClient.post('/vouchers/purchase-invoice', data),
    update: (id, data) => apiClient.put(`/vouchers/purchase-invoice/${id}`, data),
  },
  payment: {
    create: (data) => apiClient.post('/vouchers/payment', data),
    update: (id, data) => apiClient.put(`/vouchers/payment/${id}`, data),
  },
  receipt: {
    create: (data) => apiClient.post('/vouchers/receipt', data),
    update: (id, data) => apiClient.put(`/vouchers/receipt/${id}`, data),
  },
};

// Inventory APIs
export const inventoryAPI = {
  items: {
    list: (params) => apiClient.get('/inventory/items', { params }),
    create: (data) => apiClient.post('/inventory/items', data),
    update: (id, data) => apiClient.put(`/inventory/items/${id}`, data),
    delete: (id) => apiClient.delete(`/inventory/items/${id}`),
    get: (id) => apiClient.get(`/inventory/items/${id}`),
  },
  adjustments: {
    list: (params) => apiClient.get('/inventory/adjustments', { params }),
    create: (data) => apiClient.post('/inventory/adjustments', data),
    get: (id) => apiClient.get(`/inventory/adjustments/${id}`),
  },
  transfers: {
    list: (params) => apiClient.get('/inventory/transfers', { params }),
    create: (data) => apiClient.post('/inventory/transfers', data),
    get: (id) => apiClient.get(`/inventory/transfers/${id}`),
  },
  warehouses: {
    list: () => apiClient.get('/warehouses'),
    create: (data) => apiClient.post('/warehouses', data),
    update: (id, data) => apiClient.put(`/warehouses/${id}`, data),
    delete: (id) => apiClient.delete(`/warehouses/${id}`),
  },
  attributes: {
    list: () => apiClient.get('/attributes'),
    create: (data) => apiClient.post('/attributes', data),
    update: (id, data) => apiClient.put(`/attributes/${id}`, data),
    delete: (id) => apiClient.delete(`/attributes/${id}`),
  },
};

// GST APIs
export const gstAPI = {
  gstins: {
    list: () => apiClient.get('/gst/gstins'),
    create: (data) => apiClient.post('/gst/gstins', data),
    update: (id, data) => apiClient.put(`/gst/gstins/${id}`, data),
    delete: (id) => apiClient.delete(`/gst/gstins/${id}`),
  },
  rates: {
    list: () => apiClient.get('/gst/rates'),
    create: (data) => apiClient.post('/gst/rates', data),
    update: (id, data) => apiClient.put(`/gst/rates/${id}`, data),
  },
  returns: {
    gstr1: (params) => apiClient.get('/gst/returns/gstr1', { params }),
    gstr3b: (params) => apiClient.get('/gst/returns/gstr3b', { params }),
    file: (type, data) => apiClient.post(`/gst/returns/${type}/file`, data),
  },
  einvoice: {
    generate: (data) => apiClient.post('/gst/einvoice/generate', data),
    cancel: (id) => apiClient.post(`/gst/einvoice/${id}/cancel`),
    list: (params) => apiClient.get('/gst/einvoice', { params }),
  },
  ewaybill: {
    generate: (data) => apiClient.post('/gst/ewaybill/generate', data),
    cancel: (id) => apiClient.post(`/gst/ewaybill/${id}/cancel`),
    list: (params) => apiClient.get('/gst/ewaybill', { params }),
  },
  analytics: (params) => apiClient.get('/gst/analytics', { params }),
};

// Tax APIs
export const taxAPI = {
  incomeTax: {
    calculate: (data) => apiClient.post('/tax/income-tax/calculate', data),
    returns: (params) => apiClient.get('/tax/income-tax/returns', { params }),
  },
  tds: {
    list: (params) => apiClient.get('/tax/tds', { params }),
    create: (data) => apiClient.post('/tax/tds', data),
    analytics: (params) => apiClient.get('/tax/tds/analytics', { params }),
    payment: (data) => apiClient.post('/tax/tds/payment', data),
    settlement: (data) => apiClient.post('/tax/tds/settlement', data),
  },
};

// Reports APIs
export const reportsAPI = {
  balanceSheet: (params) => apiClient.get('/reports/balance-sheet', { params }),
  profitLoss: (params) => apiClient.get('/reports/profit-loss', { params }),
  trialBalance: (params) => apiClient.get('/reports/trial-balance', { params }),
  ledgerStatement: (id, params) => apiClient.get(`/reports/ledger-statement/${id}`, { params }),
  stockLedger: (params) => apiClient.get('/reports/stock-ledger', { params }),
  stockSummary: (params) => apiClient.get('/reports/stock-summary', { params }),
};

// Support APIs
export const clientSupportAPI = {
  tickets: {
    list: (params) => apiClient.get('/support/tickets', { params }),
    create: (data) => apiClient.post('/support/tickets', data),
    update: (id, data) => apiClient.put(`/support/tickets/${id}`, data),
    get: (id) => apiClient.get(`/support/tickets/${id}`),
    messages: (id) => apiClient.get(`/support/tickets/${id}/messages`),
    addMessage: (id, data) => apiClient.post(`/support/tickets/${id}/messages`, data),
  },
};

// Notification APIs
export const notificationAPI = {
  list: (params) => apiClient.get('/notifications', { params }),
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
  preferences: {
    get: () => apiClient.get('/notifications/preferences'),
    update: (data) => apiClient.put('/notifications/preferences', data),
  },
};

// Business Services APIs
export const businessAPI = {
  referral: {
    get: () => apiClient.get('/referral'),
    create: (data) => apiClient.post('/referral', data),
    rewards: () => apiClient.get('/referral/rewards'),
  },
  subscription: {
    plans: () => apiClient.get('/subscription/plans'),
    current: () => apiClient.get('/subscription/current'),
    subscribe: (data) => apiClient.post('/subscription/subscribe', data),
    cancel: () => apiClient.post('/subscription/cancel'),
  },
  reviews: {
    list: () => apiClient.get('/reviews'),
    create: (data) => apiClient.post('/reviews', data),
  },
};

// Loan APIs (FinBox Integration)
export const finboxAPI = {
  saveConsent: (data) => apiClient.post('/finbox/consent', data),
  checkEligibility: () => apiClient.get('/finbox/eligibility'),
  applyLoan: (data) => apiClient.post('/finbox/apply', data),
  loanStatus: () => apiClient.get('/finbox/status'),
};

// Tools APIs
export const toolsAPI = {
  tallyImport: {
    upload: (data) => apiClient.post('/tools/tally-import/upload', data),
    status: (id) => apiClient.get(`/tools/tally-import/status/${id}`),
    history: () => apiClient.get('/tools/tally-import/history'),
  },
};
```

### Business Logic Functions (Copied from Frontend)
All business logic functions will be copied directly from the frontend client implementation to ensure consistency:

```javascript
// app/src/utils/businessLogic.js - FUNCTIONS COPIED FROM FRONTEND
// These functions will be copied from frontend/lib/ and frontend/components/

// Currency formatting (from frontend/lib/formatters.js)
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

// GST calculations (from frontend/lib/gstCalculator.js)
export const calculateGST = (amount, rate) => {
  // Function copied from frontend
};

// Number utilities (from frontend/lib/numberUtils.js)
export const formatNumber = (number) => {
  // Function copied from frontend
};

// Validation functions (from frontend/lib/validators.js)
export const validateEmail = (email) => {
  // Function copied from frontend
};

export const validateGSTIN = (gstin) => {
  // Function copied from frontend
};

export const validatePAN = (pan) => {
  // Function copied from frontend
};

// Invoice template logic (from frontend/lib/invoiceTemplates.js)
export const generateInvoiceTemplate = (data, templateType) => {
  // Function copied from frontend
};

// Ledger field configurations (from frontend/lib/ledgerFieldConfig.js)
export const getLedgerFieldConfig = (ledgerType) => {
  // Function copied from frontend
};

// Role configurations (from frontend/lib/roleConfig.js)
export const canAccessClientPortal = (role) => {
  // Function copied from frontend
};

export const getDefaultRedirect = (role, userId) => {
  // Function copied from frontend
};

// Notification configurations (from frontend/lib/notificationConfig.js)
export const getNotificationConfig = () => {
  // Function copied from frontend
};

// Color utilities (from frontend/lib/colors.js)
export const getStatusColor = (status) => {
  // Function copied from frontend
};

// Image utilities (from frontend/lib/imageUtils.js)
export const resizeImage = (imageUri, maxWidth, maxHeight) => {
  // Function adapted for React Native
};

// Encryption utilities (from frontend/lib/encryption.js)
export const encryptData = (data) => {
  // Function copied from frontend
};

export const decryptData = (encryptedData) => {
  // Function copied from frontend
};
```

### API Client Configuration
```javascript
// app/src/lib/apiClient.js - HTTP CLIENT SETUP
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api' 
  : 'https://api.finvera.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      await AsyncStorage.multiRemove(['token', 'user']);
      // Navigate to login screen
    } else if (error.response?.status >= 500) {
      Alert.alert('Server Error', 'Something went wrong. Please try again.');
    } else if (error.code === 'ECONNABORTED') {
      Alert.alert('Timeout', 'Request timed out. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      Alert.alert('Network Error', 'Please check your internet connection.');
    }
    return Promise.reject(error);
  }
);

export { apiClient };
```

### Authentication Context
- Extend existing `app/src/contexts/AuthContext.jsx`
- Maintain session consistency with web app
- Implement biometric authentication (optional)

## Testing Strategy

### Unit Testing
- Test all UI components
- Test business logic functions
- Test API integration

### Integration Testing  
- Test navigation flows
- Test form submissions
- Test data persistence

### User Acceptance Testing
- Test on multiple device sizes
- Test offline functionality
- Test performance on low-end devices

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Implement lazy loading for screens
2. **Image Optimization**: Optimize images and icons
3. **Bundle Splitting**: Split code by feature
4. **Caching**: Implement proper caching strategies
5. **Memory Management**: Optimize memory usage

### Monitoring
- Implement crash reporting
- Monitor app performance
- Track user engagement metrics

## Accessibility

### Requirements
- Screen reader support
- High contrast mode support
- Font scaling support
- Touch target sizing (minimum 44px)
- Keyboard navigation support

## Security

### Implementation
- Secure token storage
- API request encryption
- Biometric authentication
- App transport security
- Certificate pinning

---

## Summary

**Total Screens to Implement: 80**
- ✅ **Completed: 2** (LoginScreen, DashboardScreen)
- 🔄 **Remaining: 78** (including SplashScreen)

**Implementation Timeline: 12 weeks**
- Phase 1 (Foundation): 2 weeks
- Phase 2 (Core Business): 2 weeks  
- Phase 3 (Advanced Features): 2 weeks
- Phase 4 (Compliance & Reporting): 2 weeks
- Phase 5 (Extended Vouchers): 2 weeks
- Phase 6 (Business Services): 2 weeks

**Key Requirements:**
1. ✅ Maintain exact UI consistency with frontend
2. ✅ Use Agency font throughout the app
3. ✅ Implement Finvera brand colors and gradients
4. ✅ Ensure responsive design for all screen sizes
5. ✅ Maintain API compatibility with existing backend
6. ✅ Copy all business logic functions from frontend for consistency

This documentation provides a complete roadmap for implementing the mobile app client portal with full feature parity to the web application while maintaining consistent branding and user experience.