# Mobile App Client Structure Documentation

## Overview
This document outlines the structure for adapting the frontend client portal to the mobile app. The mobile app will mirror the functionality of the frontend client portal but with React Native components and mobile-optimized UI/UX.

## Current Frontend Client Structure

### Main Client Pages
```
frontend/pages/client/
├── dashboard.jsx                    # Main dashboard with stats and quick actions
├── login.jsx                       # Client login page
├── register.jsx                    # Client registration
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
└── loan.jsx                        # Loan application
```

### Subdirectories
```
├── accounting/
│   └── outstanding.jsx             # Outstanding amounts
├── gst/
│   ├── analytics.jsx               # GST analytics
│   └── returns/                    # GST returns
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

## Proposed Mobile App Structure

### Directory Structure
```
app/src/screens/client/
├── dashboard/
│   └── DashboardScreen.jsx         # Main dashboard
├── auth/
│   ├── LoginScreen.jsx             # Login (already exists)
│   ├── RegisterScreen.jsx          # Registration
│   ├── ForgotPasswordScreen.jsx    # Password reset
│   └── ResetPasswordScreen.jsx     # Password reset form
├── profile/
│   ├── ProfileScreen.jsx           # User profile
│   ├── SettingsScreen.jsx          # Account settings
│   └── NotificationPreferencesScreen.jsx
├── company/
│   ├── CompaniesScreen.jsx         # Company management
│   ├── BranchesScreen.jsx          # Branch management
│   └── CompanyDetailsScreen.jsx    # Company details
├── accounting/
│   ├── LedgersScreen.jsx           # Ledger management
│   ├── LedgerDetailsScreen.jsx     # Ledger details
│   ├── Outstandin