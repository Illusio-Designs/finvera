# How to Verify Account Groups

Your old account groups (19 groups) are already being seeded correctly in `finvera_master.account_groups`.

## Check Account Groups

### 1. In Master Database (Shared Across All Tenants)

```bash
mysql -u root -p -e "SELECT group_code, name, nature FROM finvera_master.account_groups ORDER BY group_code"
```

**Expected Output (19 groups):**
```
+-----------+---------------------------+-----------+
| group_code| name                      | nature    |
+-----------+---------------------------+-----------+
| BANK      | Bank Accounts             | asset     |
| CA        | Current Assets            | asset     |
| CAP       | Capital Account           | liability |
| CASH      | Cash-in-Hand              | asset     |
| CL        | Current Liabilities       | liability |
| DIR_EXP   | Direct Expenses           | expense   |
| DIR_INC   | Direct Income             | income    |
| DT        | Duties & Taxes            | liability |
| FA        | Fixed Assets              | asset     |
| IND_EXP   | Indirect Expenses         | expense   |
| IND_INC   | Indirect Income           | income    |
| INV       | Stock-in-Hand             | asset     |
| LA        | Loans & Advances (Asset)  | asset     |
| LOAN      | Loans (Liability)         | liability |
| PUR       | Purchase Accounts         | expense   |
| RES       | Reserves & Surplus        | liability |
| SAL       | Sales Accounts            | income    |
| SC        | Sundry Creditors          | liability |
| SD        | Sundry Debtors            | asset     |
+-----------+---------------------------+-----------+
```

### 2. Full Details

```bash
mysql -u root -p -e "SELECT * FROM finvera_master.account_groups" | less
```

### 3. Count Total Groups

```bash
mysql -u root -p -e "SELECT COUNT(*) as total FROM finvera_master.account_groups"
```

Should show: **19 groups**

---

## Where Are Your Account Groups?

### ✅ Correct Location: `finvera_master.account_groups`
- Shared across ALL tenants
- Seeded automatically on server startup
- Read from: `masterModels.AccountGroup`

### ❌ Old Location (No Longer Used): `finvera_db.account_groups`
- This table doesn't exist anymore
- Account groups moved to master database

### ❌ Tenant Location: `finvera_tenant_xxx.account_groups`
- This table doesn't exist
- Tenants reference groups from master via `account_group_id`

---

## How Ledgers Reference Account Groups

In your tenant database, ledgers will store the UUID of the account group:

```sql
-- Example ledger in tenant database
SELECT 
  l.name as ledger_name,
  l.account_group_id,
  ag.name as group_name,
  ag.group_code
FROM finvera_tenant_xxx.ledgers l
JOIN finvera_master.account_groups ag ON l.account_group_id = ag.id
```

---

## If You Don't See the Groups

### Problem 1: Looking in Wrong Database
```bash
# Wrong - main database doesn't have account_groups
mysql -u root -p -e "SHOW TABLES IN finvera_db LIKE '%account%'"

# Correct - check master database
mysql -u root -p -e "SHOW TABLES IN finvera_master LIKE '%account%'"
```

### Problem 2: Server Didn't Run Seeds
Check server logs on startup:
```
✓ Seeded 19 account groups
✓ Seeded 8 voucher types
✓ Seeded 7 GST rates
✓ Seeded 7 TDS sections
```

If you don't see this, restart the server:
```bash
npm start
```

### Problem 3: Master Database Not Created
```bash
# Check if master database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'finvera_master'"
```

If not found, drop and recreate:
```bash
npm run db:reset
npm start
```

---

## Your Exact Old Data Structure

The seeded groups match your old data exactly:

```javascript
// From masterSeeds.js (lines 12-39)
const groups = [
  // Assets (7 groups)
  { group_code: 'CA', name: 'Current Assets', nature: 'asset' },
  { group_code: 'CASH', name: 'Cash-in-Hand', nature: 'asset' },
  { group_code: 'BANK', name: 'Bank Accounts', nature: 'asset' },
  { group_code: 'SD', name: 'Sundry Debtors', nature: 'asset' },
  { group_code: 'FA', name: 'Fixed Assets', nature: 'asset' },
  { group_code: 'INV', name: 'Stock-in-Hand', nature: 'asset' },
  { group_code: 'LA', name: 'Loans & Advances (Asset)', nature: 'asset' },
  
  // Liabilities (6 groups)
  { group_code: 'CL', name: 'Current Liabilities', nature: 'liability' },
  { group_code: 'SC', name: 'Sundry Creditors', nature: 'liability' },
  { group_code: 'DT', name: 'Duties & Taxes', nature: 'liability' },
  { group_code: 'CAP', name: 'Capital Account', nature: 'liability' },
  { group_code: 'RES', name: 'Reserves & Surplus', nature: 'liability' },
  { group_code: 'LOAN', name: 'Loans (Liability)', nature: 'liability' },
  
  // Income (3 groups)
  { group_code: 'SAL', name: 'Sales Accounts', nature: 'income', affects_gross_profit: true },
  { group_code: 'DIR_INC', name: 'Direct Income', nature: 'income', affects_gross_profit: true },
  { group_code: 'IND_INC', name: 'Indirect Income', nature: 'income' },
  
  // Expenses (3 groups)
  { group_code: 'PUR', name: 'Purchase Accounts', nature: 'expense', affects_gross_profit: true },
  { group_code: 'DIR_EXP', name: 'Direct Expenses', nature: 'expense', affects_gross_profit: true },
  { group_code: 'IND_EXP', name: 'Indirect Expenses', nature: 'expense' },
];
```

**Total: 19 groups** ✅

---

## API to Get Account Groups

### From Your Application

```javascript
// In your controller/route
const { masterModels } = require('./models/masterModels');

// Get all account groups
const groups = await masterModels.AccountGroup.findAll({
  order: [['group_code', 'ASC']]
});

console.log(groups);
```

### Via HTTP (if you have an endpoint)

```bash
curl http://localhost:3000/api/account-groups
```

---

## Summary

✅ **Your 19 old account groups are already correctly seeded**  
✅ **Location:** `finvera_master.account_groups`  
✅ **Seeded on every server startup**  
✅ **Shared across all tenants**  
✅ **Exact same structure and codes as your old data**  

**The data IS there, you just need to look in the master database!**

Run this to confirm:
```bash
mysql -u root -p -e "SELECT group_code, name, nature FROM finvera_master.account_groups ORDER BY group_code"
```
