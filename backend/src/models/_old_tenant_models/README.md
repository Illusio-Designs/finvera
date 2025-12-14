# Old Model Files (Not Used)

These model files are **NOT loaded** into any database.

## Why are they here?

These were the original model files when we had a single shared database approach. Now we use a hybrid architecture:

### Current Architecture:

1. **Main DB Models** (`src/models/*.js`)
   - Only admin/system models
   - Loaded explicitly in `src/models/index.js`

2. **Master DB Models** (`src/models/masterModels.js`)
   - Shared accounting structure
   - Defined in one file

3. **Tenant DB Models** (`src/services/tenantModels.js`)
   - Tenant-specific transactional data
   - Defined in one file

## Files in this directory:

**Master DB models** (now in `masterModels.js`):
- AccountGroup.js
- VoucherType.js
- GSTRate.js

**Tenant DB models** (now in `tenantModels.js`):
- Ledger.js
- Voucher.js
- VoucherItem.js
- VoucherLedgerEntry.js
- BillWiseDetail.js
- GSTIN.js
- GSTRReturn.js
- TDSDetail.js
- EInvoice.js
- AuditLog.js
- BillAllocation.js

**Deprecated:**
- Tenant.js (replaced by TenantMaster.js in master DB)

## Can I delete these?

Yes, these files are kept for reference only. You can safely delete this directory.

The actual models are now in:
- `src/models/masterModels.js` - Master DB
- `src/services/tenantModels.js` - Tenant DB
