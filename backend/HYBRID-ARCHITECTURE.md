# Hybrid Multi-Tenant Architecture

## Overview

Finvera uses an **optimized hybrid multi-tenant architecture** that combines the best of both shared and separate database approaches:

```
┌─────────────────────────────────────────────────────────────┐
│  1. MAIN DATABASE (finvera_db)                              │
│     System-wide admin and platform data                     │
│     - Admin users, roles                                     │
│     - Salesmen, Distributors                                 │
│     - Subscription plans, Payouts                            │
│     - Lead management, Commissions                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  2. MASTER DATABASE (finvera_master) ⚡ AUTO-CREATED        │
│     Shared SaaS accounting structure + tenant metadata      │
│     - tenant_master (routing info)                          │
│     - account_groups (SHARED chart of accounts)            │
│     - voucher_types (SHARED voucher types)                 │
│     - gst_rates (SHARED GST rates)                         │
│     - tds_sections (SHARED TDS sections)                   │
│     - accounting_years (SHARED periods)                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  3. TENANT DATABASES (finvera_tenant_xxx)                   │
│     Tenant-specific transactional data ONLY                 │
│     - users (tenant accountants/viewers)                    │
│     - ledgers (with balances)                               │
│     - vouchers, invoices, bills                             │
│     - gstins, gstr_returns                                  │
│     - tds_details                                           │
│     - e_invoices                                            │
│     - audit_logs                                            │
└─────────────────────────────────────────────────────────────┘
```

## Why This Architecture?

### ✅ Standardized Chart of Accounts
- All tenants use the **same account groups** from master DB
- Consistent accounting structure across platform
- Easy to update accounting structure for all tenants
- Tenants can't break accounting standards

### ✅ Simplified Management
- Update voucher types once, applies to all tenants
- GST rates managed centrally
- TDS sections updated in one place

### ✅ Complete Data Isolation
- Each tenant's **transactions** in separate database
- Ledger balances completely isolated
- Invoices, bills, payments separate per tenant

### ✅ Optimal Performance
- Shared structure data (small) in master DB
- Transactional data (large) distributed across tenant DBs
- No query interference between tenants

## Database Breakdown

### Main Database (`finvera_db`)

**Purpose**: Platform/admin data

**Tables**:
- `users` (admin users)
- `salesmen`
- `distributors`
- `subscription_plans`
- `referral_codes`
- `referral_rewards`
- `commissions`
- `payouts`
- `leads`
- `lead_activities`
- `targets`
- `audit_logs` (admin actions)

### Master Database (`finvera_master`)

**Purpose**: Tenant metadata + Shared accounting structure

**Tables**:

**Routing & Metadata:**
- `tenant_master` - Tenant info & DB connections

**Shared Accounting Structure** (SAME for ALL tenants):
- `account_groups` - Chart of accounts (Assets, Liabilities, Income, Expenses)
- `voucher_types` - Sales, Purchase, Payment, Receipt, Journal, Contra, etc.
- `gst_rates` - 0%, 5%, 12%, 18%, 28% GST rates
- `tds_sections` - 194C, 194J, 194I, etc.
- `accounting_years` - FY periods (2023-24, 2024-25, etc.)

### Tenant Databases (`finvera_tenant_<subdomain>_<timestamp>`)

**Purpose**: Tenant-specific transactions ONLY

**Tables**:
- `users` - Tenant users (accountants, viewers)
- `ledgers` - Their ledgers with balances
  - References `account_group_id` from master DB
- `vouchers` - Their vouchers/transactions
  - References `voucher_type_id` from master DB
- `voucher_ledger_entries` - Debit/credit entries
- `voucher_items` - Line items
- `bill_wise_details` - Bill tracking
- `gstins` - Their GST numbers
- `gstr_returns` - Their GST return filings
- `tds_details` - Their TDS deductions
- `e_invoices` - Their e-invoices
- `audit_logs` - Their activity logs

## Usage Examples

### Accessing Shared Structure (Master DB)

```javascript
const { resolveTenant } = require('../middleware/tenant');

router.get('/account-groups', resolveTenant, async (req, res) => {
  // req.masterModels - Shared accounting structure
  const { AccountGroup } = req.masterModels;
  
  // All tenants see the SAME account groups
  const groups = await AccountGroup.findAll();
  
  res.json({ success: true, data: { groups } });
});
```

### Accessing Tenant Transactions

```javascript
router.get('/ledgers', resolveTenant, async (req, res) => {
  // req.tenantModels - Tenant-specific data
  const { Ledger } = req.tenantModels;
  
  // Each tenant has their own ledgers
  const ledgers = await Ledger.findAll();
  
  res.json({ success: true, data: { ledgers } });
});
```

### Creating a Ledger (Uses Both)

```javascript
router.post('/ledgers', resolveTenant, async (req, res) => {
  const { name, account_group_id, opening_balance } = req.body;
  
  // Validate account_group_id exists in master DB
  const { AccountGroup } = req.masterModels;
  const group = await AccountGroup.findByPk(account_group_id);
  
  if (!group) {
    return res.status(400).json({ error: 'Invalid account group' });
  }
  
  // Create ledger in tenant DB
  const { Ledger } = req.tenantModels;
  const ledger = await Ledger.create({
    name,
    account_group_id, // References master DB
    opening_balance,
    current_balance: opening_balance,
  });
  
  res.json({ success: true, data: { ledger } });
});
```

### Creating a Voucher (Uses Both)

```javascript
router.post('/vouchers', resolveTenant, async (req, res) => {
  const { voucher_type_id, entries } = req.body;
  
  // Validate voucher_type_id from master DB
  const { VoucherType } = req.masterModels;
  const voucherType = await VoucherType.findByPk(voucher_type_id);
  
  if (!voucherType) {
    return res.status(400).json({ error: 'Invalid voucher type' });
  }
  
  // Create voucher in tenant DB
  const { Voucher, VoucherLedgerEntry } = req.tenantModels;
  const voucher = await Voucher.create({
    voucher_type_id, // References master DB
    voucher_date: new Date(),
    // ... other fields
  });
  
  // Create entries
  for (const entry of entries) {
    await VoucherLedgerEntry.create({
      voucher_id: voucher.id,
      ledger_id: entry.ledger_id,
      debit: entry.debit,
      credit: entry.credit,
    });
  }
  
  res.json({ success: true, data: { voucher } });
});
```

## Server Startup

```
npm start
    │
    ├─→ 1. Initialize Master Database
    │      - Create finvera_master
    │      - Sync tenant_master table
    │      - Sync account_groups table
    │      - Sync voucher_types table
    │      - Sync gst_rates table
    │      - Sync tds_sections table
    │      - Seed default data if empty
    │      ✅ All tenants use this structure
    │
    ├─→ 2. Initialize Main Database
    │      - Connect to finvera_db
    │      - Sync admin/system models
    │      ✅ Platform ready
    │
    └─→ 3. Start Express Server
           ✅ Ready to create tenants!
```

## Tenant Creation Flow

```
POST /api/admin/tenants
    │
    ├─→ 1. Save to tenant_master (Master DB)
    │      Company info, subdomain, DB connection
    │
    ├─→ 2. Create Tenant Database
    │      CREATE DATABASE finvera_acme_1702459200000
    │
    ├─→ 3. Run Migrations (Tenant DB)
    │      Create: users, ledgers, vouchers, etc.
    │      (NO account_groups, voucher_types - in master!)
    │
    ├─→ 4. Seed Tenant Data
    │      - Create admin user
    │      - Create primary GSTIN if provided
    │      (Account groups already in master DB)
    │
    └─→ 5. Ready!
           Tenant uses master structure + own data
```

## Request Flow

```
HTTP Request (acme.finvera.com/api/ledgers)
    │
    ├─→ 1. resolveTenant Middleware
    │      - Extract subdomain: "acme"
    │      - Lookup in tenant_master (Master DB)
    │      - Get tenant DB connection info
    │
    ├─→ 2. Connect to Databases
    │      - Tenant DB: finvera_acme_xxx
    │      - Master DB: finvera_master
    │
    ├─→ 3. Load Models
    │      - req.tenantModels (from Tenant DB)
    │      - req.masterModels (from Master DB)
    │
    ├─→ 4. Execute Controller
    │      - Use masterModels for structure
    │      - Use tenantModels for data
    │
    └─→ 5. Return Response
```

## Data Distribution

### What's in Master DB (Shared):
✅ Chart of accounts structure  
✅ Voucher type definitions  
✅ GST rate slabs  
✅ TDS section codes  
✅ Accounting year periods  

### What's in Tenant DB (Isolated):
✅ Actual ledgers with balances  
✅ Vouchers/transactions  
✅ Invoices, bills, payments  
✅ GST return filings  
✅ TDS deductions  
✅ E-invoice records  
✅ Tenant users  

## Benefits

### 1. Standardization
- ✅ All tenants follow same accounting structure
- ✅ Consistent chart of accounts
- ✅ Same voucher types
- ✅ Uniform GST handling

### 2. Easy Updates
- ✅ Add new account group → Available to all tenants
- ✅ Update GST rates → All tenants updated
- ✅ Add voucher type → All tenants can use

### 3. Data Isolation
- ✅ Each tenant's transactions separate
- ✅ Complete privacy
- ✅ No cross-tenant queries

### 4. Performance
- ✅ Small shared data in master
- ✅ Large transactional data distributed
- ✅ Efficient queries

### 5. Maintenance
- ✅ Update accounting structure once
- ✅ No per-tenant schema changes
- ✅ Easy to add features

## Managing Shared Structure

### Add New Account Group
```javascript
// Affects ALL tenants
const { AccountGroup } = require('../models/masterModels');

await AccountGroup.create({
  group_code: 'NEW',
  name: 'New Group',
  nature: 'asset',
  is_system: true,
});

// Now all tenants can create ledgers under this group
```

### Update Voucher Type
```javascript
const { VoucherType } = require('../models/masterModels');

await VoucherType.update(
  { numbering_prefix: 'SI' },
  { where: { name: 'Sales' } }
);

// All tenant vouchers will use new prefix
```

### Add GST Rate
```javascript
const { GSTRate } = require('../models/masterModels');

await GSTRate.create({
  rate_name: 'GST 15%',
  cgst_rate: 7.5,
  sgst_rate: 7.5,
  igst_rate: 15,
  is_active: true,
});

// Available to all tenants immediately
```

## Migration Strategy

### Master DB Changes
```bash
# Affects shared structure
# Add new columns, tables to master models
# Run on master database only
```

### Tenant DB Changes
```bash
# Affects transactional data
# Must run on ALL tenant databases
node src/scripts/migrateTenants.js
```

## Quick Reference

| What | Where | Shared? |
|------|-------|---------|
| Admin users | Main DB | Platform-wide |
| Salesmen | Main DB | Platform-wide |
| Account groups | **Master DB** | **Shared by all tenants** |
| Voucher types | **Master DB** | **Shared by all tenants** |
| GST rates | **Master DB** | **Shared by all tenants** |
| Tenant ledgers | Tenant DB | Separate per tenant |
| Tenant vouchers | Tenant DB | Separate per tenant |
| Tenant invoices | Tenant DB | Separate per tenant |

## Summary

This **hybrid architecture** provides:

✅ **Standardized accounting** - All tenants use same structure  
✅ **Complete isolation** - Transactions separate per tenant  
✅ **Easy maintenance** - Update structure once  
✅ **Better performance** - Small shared data + distributed transactions  
✅ **Flexibility** - Can customize per-tenant if needed  

The master database serves as the **"accounting template"** that all tenants follow, while each tenant gets their own database for their actual business transactions.

Best of both worlds! 🎉
