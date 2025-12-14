# Model Organization - Clean Separation

## Overview

Models are now **cleanly separated** across three locations based on which database they belong to:

```
src/models/
├── index.js              ← Loads ONLY admin/system models
├── User.js              ← Main DB
├── Salesman.js          ← Main DB
├── Distributor.js       ← Main DB
├── SubscriptionPlan.js  ← Main DB
├── ReferralCode.js      ← Main DB
├── ReferralReward.js    ← Main DB
├── Commission.js        ← Main DB
├── Payout.js            ← Main DB
├── Lead.js              ← Main DB
├── LeadActivity.js      ← Main DB
├── Target.js            ← Main DB
├── masterModels.js      ← Master DB (all models in one file)
└── TenantMaster.js      ← Master DB (imported by masterModels.js)

src/services/
└── tenantModels.js      ← Tenant DB (all models in one file)
```

## 1. Main Database Models (finvera_db)

**Location**: `src/models/*.js`  
**Loaded by**: `src/models/index.js` (explicitly)  
**Connection**: `sequelize` (from `src/config/database.js`)

### Models:
- ✅ **User** - Admin users
- ✅ **Salesman** - Salesmen
- ✅ **Distributor** - Distributors
- ✅ **SubscriptionPlan** - Subscription plans
- ✅ **ReferralCode** - Referral codes
- ✅ **ReferralReward** - Referral rewards
- ✅ **Commission** - Commission calculations
- ✅ **Payout** - Payout records
- ✅ **Lead** - Lead management
- ✅ **LeadActivity** - Lead activities
- ✅ **Target** - Sales targets

### Usage:
```javascript
const { Salesman, Distributor } = require('../models');

// Direct access to main DB models
const salesmen = await Salesman.findAll();
```

## 2. Master Database Models (finvera_master)

**Location**: `src/models/masterModels.js` (all in one file)  
**Connection**: `masterSequelize` (from `src/config/masterDatabase.js`)

### Models:
- ✅ **TenantMaster** - Tenant metadata & routing
- ✅ **AccountGroup** - Chart of accounts (SHARED)
- ✅ **VoucherType** - Voucher types (SHARED)
- ✅ **GSTRate** - GST rates (SHARED)
- ✅ **TDSSection** - TDS sections (SHARED)
- ✅ **AccountingYear** - Accounting periods (SHARED)

### Usage:
```javascript
const masterModels = require('../models/masterModels');

// Access master models
const groups = await masterModels.AccountGroup.findAll();
const types = await masterModels.VoucherType.findAll();

// Or from middleware
router.get('/account-groups', resolveTenant, async (req, res) => {
  const { AccountGroup } = req.masterModels;
  const groups = await AccountGroup.findAll();
});
```

## 3. Tenant Database Models (per tenant)

**Location**: `src/services/tenantModels.js` (all in one file)  
**Connection**: Dynamic per tenant (from `tenantConnectionManager`)

### Models:
- ✅ **User** - Tenant users (accountants, viewers)
- ✅ **Ledger** - Ledgers with balances
- ✅ **GSTIN** - GST registrations
- ✅ **Voucher** - Vouchers/transactions
- ✅ **VoucherLedgerEntry** - Debit/credit entries
- ✅ **BillWiseDetail** - Bill-wise details
- ✅ **GSTRReturn** - GST returns
- ✅ **TDSDetail** - TDS details
- ✅ **EInvoice** - E-invoices
- ✅ **AuditLog** - Audit logs

### Usage:
```javascript
// From middleware (automatically provided)
router.get('/ledgers', resolveTenant, async (req, res) => {
  const { Ledger } = req.tenantModels;
  const ledgers = await Ledger.findAll();
});
```

## Database-Model Mapping

| Database | Models | Location | Connection |
|----------|--------|----------|------------|
| **finvera_db** | 11 admin/system models | `src/models/*.js` | `sequelize` |
| **finvera_master** | 6 master models | `src/models/masterModels.js` | `masterSequelize` |
| **finvera_tenant_xxx** | 10 tenant models | `src/services/tenantModels.js` | `tenantConnection` |

## Why This Organization?

### ✅ Clear Separation
- Each database has its own set of models
- No confusion about where models are defined
- Easy to find and maintain

### ✅ No Duplication
- Master models defined once in `masterModels.js`
- Tenant models defined once in `tenantModels.js`
- Main models explicitly listed in `index.js`

### ✅ Explicit Loading
- Main DB: Explicitly loaded in `index.js`
- Master DB: Loaded and synced in `masterDatabase.js`
- Tenant DB: Dynamically loaded per request

### ✅ Type Safety
- Clear which models belong to which database
- IDE autocomplete works correctly
- Less chance of using wrong model

## Model Loading Flow

### Server Startup
```
1. Load Main DB Models
   └─→ src/models/index.js
       └─→ Explicitly loads 11 admin models

2. Initialize Master DB
   └─→ src/config/masterDatabase.js
       └─→ Requires src/models/masterModels.js
           └─→ Syncs 6 master models
           └─→ Seeds default data

3. Main DB Sync
   └─→ src/utils/dbSync.js
       └─→ Syncs all main DB models
```

### Per Request
```
1. Request arrives
   └─→ resolveTenant middleware
       └─→ Looks up tenant in master DB
       └─→ Gets tenant DB connection
       └─→ Loads tenant models dynamically
       └─→ Attaches:
           • req.masterModels (shared structure)
           • req.tenantModels (tenant data)
```

## Verifying Clean Separation

### Check Main DB Tables
```sql
USE finvera_db;
SHOW TABLES;

-- Should only show:
-- users, salesmen, distributors, subscription_plans,
-- referral_codes, referral_rewards, commissions, payouts,
-- leads, lead_activities, targets
```

### Check Master DB Tables
```sql
USE finvera_master;
SHOW TABLES;

-- Should only show:
-- tenant_master, account_groups, voucher_types,
-- gst_rates, tds_sections, accounting_years
```

### Check Tenant DB Tables
```sql
USE finvera_acme_1702459200000;
SHOW TABLES;

-- Should only show:
-- users, ledgers, gstins, vouchers, voucher_ledger_entries,
-- bill_wise_details, gstr_returns, tds_details, e_invoices, audit_logs
```

## Migration Strategy

### Adding New Admin Model
1. Create file in `src/models/NewModel.js`
2. Add to `adminModels` array in `src/models/index.js`
3. Run: `npm start` (auto-syncs)

### Adding New Master Model
1. Add to `src/models/masterModels.js`
2. Add sync call in `syncMasterModels()` function
3. Run: `npm start` (auto-syncs)

### Adding New Tenant Model
1. Add to `src/services/tenantModels.js`
2. Will auto-create in all tenant databases on next request
3. For existing tenants: Run migration script

## Common Mistakes to Avoid

❌ **Don't** create separate files in `src/models/` for master models  
✅ **Do** add them to `src/models/masterModels.js`

❌ **Don't** create separate files in `src/models/` for tenant models  
✅ **Do** add them to `src/services/tenantModels.js`

❌ **Don't** use `require('../models')` for master/tenant models  
✅ **Do** use `req.masterModels` or `req.tenantModels` from middleware

❌ **Don't** auto-load all files in models directory  
✅ **Do** explicitly list admin models in `index.js`

## Summary

✅ **Main DB**: 11 explicit models in separate files  
✅ **Master DB**: 6 models in one file (`masterModels.js`)  
✅ **Tenant DB**: 10 models in one file (`tenantModels.js`)  
✅ **Clean separation**: No confusion, no duplication  
✅ **Easy maintenance**: Clear where each model belongs  

Perfect organization for a multi-tenant SaaS! 🎉
