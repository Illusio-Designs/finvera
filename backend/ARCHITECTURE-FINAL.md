# ✅ Final Architecture - Hybrid Multi-Tenant SaaS

## Architecture Summary

```
┌────────────────────────────────────────────────────────┐
│         Main DB (finvera_db)                           │
│         Platform/Admin Data                            │
│  Admin, Salesman, Distributor, Subscriptions, etc.    │
└────────────────────────────────────────────────────────┘
                        │
┌────────────────────────────────────────────────────────┐
│         Master DB (finvera_master) ⚡                  │
│         Shared SaaS Structure + Tenant Metadata        │
│                                                         │
│  • tenant_master (routing)                            │
│  • account_groups (SHARED - same for all)             │
│  • voucher_types (SHARED - same for all)              │
│  • gst_rates (SHARED - same for all)                  │
│  • tds_sections (SHARED - same for all)               │
│  • accounting_years (SHARED - same for all)           │
└────────────────────────────────────────────────────────┘
                        │
            ┌───────────┼───────────┐
            │           │           │
            ▼           ▼           ▼
        ┌───────┐   ┌───────┐   ┌───────┐
        │Tenant │   │Tenant │   │Tenant │
        │  DB   │   │  DB   │   │  DB   │
        │  #1   │   │  #2   │   │  #N   │
        └───────┘   └───────┘   └───────┘
     Transactions  Transactions Transactions
```

## What Goes Where?

### Main Database (finvera_db)
**Purpose**: Platform/System data

✅ Admin users & roles  
✅ Salesmen  
✅ Distributors  
✅ Subscription plans  
✅ Referral codes & rewards  
✅ Commissions  
✅ Payouts  
✅ Leads & activities  
✅ Targets  

### Master Database (finvera_master)
**Purpose**: Tenant routing + Shared accounting structure

**Routing:**  
✅ `tenant_master` - Tenant metadata, subdomain, DB connections

**Shared Accounting Structure (ALL tenants use):**  
✅ `account_groups` - Chart of accounts (Assets, Liabilities, Income, Expenses)  
✅ `voucher_types` - Sales, Purchase, Payment, Receipt, Journal, Contra  
✅ `gst_rates` - 0%, 5%, 12%, 18%, 28%  
✅ `tds_sections` - 194C, 194J, 194I, 194H, etc.  
✅ `accounting_years` - FY 2023-24, 2024-25, etc.  

### Tenant Databases (per tenant)
**Purpose**: Tenant-specific transactions

✅ `users` - Tenant accountants/viewers  
✅ `ledgers` - Their ledgers with balances (references master account_groups)  
✅ `vouchers` - Their transactions (references master voucher_types)  
✅ `voucher_ledger_entries` - Debit/credit entries  
✅ `bill_wise_details` - Bill tracking  
✅ `gstins` - Their GST registrations  
✅ `gstr_returns` - Their GST filings  
✅ `tds_details` - Their TDS deductions  
✅ `e_invoices` - Their e-invoices  
✅ `audit_logs` - Their activity logs  

## Setup (3 Steps!)

```bash
# 1. Configure
cp .env.example .env
# Edit: DB_PASSWORD, ENCRYPTION_KEY

# 2. Install
npm install

# 3. Start (auto-creates everything!)
npm start
```

**Automatic initialization:**
- ✅ Creates master database
- ✅ Creates shared accounting structure
- ✅ Seeds default data (account groups, voucher types, GST rates)
- ✅ Ready to create tenants!

## Usage in Code

### Accessing Shared Structure
```javascript
router.get('/account-groups', resolveTenant, async (req, res) => {
  // req.masterModels - Shared structure (same for all tenants)
  const { AccountGroup } = req.masterModels;
  const groups = await AccountGroup.findAll();
  res.json({ data: groups });
});
```

### Accessing Tenant Data
```javascript
router.get('/ledgers', resolveTenant, async (req, res) => {
  // req.tenantModels - Tenant-specific data
  const { Ledger } = req.tenantModels;
  const ledgers = await Ledger.findAll();
  res.json({ data: ledgers });
});
```

### Creating Ledger (Uses Both)
```javascript
router.post('/ledgers', resolveTenant, async (req, res) => {
  const { name, account_group_id } = req.body;
  
  // Validate account group from master DB
  const { AccountGroup } = req.masterModels;
  const group = await AccountGroup.findByPk(account_group_id);
  
  // Create ledger in tenant DB
  const { Ledger } = req.tenantModels;
  const ledger = await Ledger.create({
    name,
    account_group_id, // References master DB
  });
  
  res.json({ data: ledger });
});
```

## Benefits

### ✅ Standardized Accounting
- All tenants use same chart of accounts
- Consistent structure across platform
- Can't break accounting standards

### ✅ Easy Maintenance
- Update account groups once → All tenants updated
- Add new voucher type → Available to all
- Change GST rates → Applies everywhere

### ✅ Complete Isolation
- Each tenant's transactions separate
- Ledger balances isolated
- Full data privacy

### ✅ Optimal Performance
- Small shared structure in master DB
- Large transactional data distributed
- No query interference

### ✅ Best of Both Worlds
- Standardization (shared structure)
- Isolation (separate transactions)

## Default Master Data

**Auto-seeded on first start:**

**Account Groups (19 groups):**
- Assets: Cash, Bank, Sundry Debtors, Fixed Assets, etc.
- Liabilities: Capital, Sundry Creditors, Loans, etc.
- Income: Sales, Direct Income, Indirect Income
- Expenses: Purchase, Direct Expenses, Indirect Expenses

**Voucher Types (8 types):**
- Sales, Purchase, Payment, Receipt, Journal, Contra, Debit Note, Credit Note

**GST Rates (7 rates):**
- 0%, 0.25%, 3%, 5%, 12%, 18%, 28%

**TDS Sections (7 sections):**
- 194C (Contractors), 194J (Professional), 194I (Rent), etc.

## Key Points

1. **Shared Structure**: Account groups, voucher types in master DB
2. **Separate Data**: Ledgers, vouchers in tenant DBs
3. **Auto-initialization**: Everything created on server start
4. **Two model sets**: `req.masterModels` + `req.tenantModels`
5. **Standardized SaaS**: All tenants follow same accounting structure

## Documentation

- 📖 **Quick Start**: [MULTI-TENANT-QUICKSTART.md](./MULTI-TENANT-QUICKSTART.md)
- 🏗️ **Hybrid Architecture**: [HYBRID-ARCHITECTURE.md](./HYBRID-ARCHITECTURE.md)
- 📚 **Complete Guide**: [MULTI-TENANT-ARCHITECTURE.md](./MULTI-TENANT-ARCHITECTURE.md)
- 🗄️ **Database Layout**: [DATABASE-ARCHITECTURE.md](./DATABASE-ARCHITECTURE.md)

## Status

✅ **Hybrid architecture implemented**  
✅ **Master DB with shared structure**  
✅ **Auto-initialization working**  
✅ **Default data seeded**  
✅ **Ready for production**  

**Perfect for SaaS accounting platform!** 🎉
