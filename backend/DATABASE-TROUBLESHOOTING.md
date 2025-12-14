# Database Troubleshooting Guide

## Common Issues and Solutions

### ❌ Error: Failed to open the referenced table 'tenants'

**Symptoms:**
```
SequelizeDatabaseError: Failed to open the referenced table 'tenants'
ER_FK_CANNOT_OPEN_PARENT
```

**Cause:**
The database has old schema with foreign key constraints that no longer exist in the new model definitions.

**Solution Options:**

#### Option 1: Fix Only Commissions Table (Recommended - Less Destructive)

This will drop only the `commissions` table and let it be recreated:

```bash
# Run the fix script
npm run db:fix-commissions

# Then start the server
npm start
```

**What it does:**
- Drops the `commissions` table only
- Preserves all other data
- Server will recreate the table with correct schema

#### Option 2: Reset All Databases (Complete Reset)

⚠️ **WARNING: This will delete ALL data including tenant databases!**

```bash
# Run the reset script
npm run db:reset

# Then start the server
npm start
```

**What it does:**
- Drops `finvera_db`, `finvera_master`, and all `finvera_tenant_*` databases
- Recreates `finvera_db` and `finvera_master`
- Server will initialize with fresh schema
- You'll need to create tenants again

#### Option 3: Manual SQL Fix

If you prefer manual control:

```sql
-- Connect to your MySQL database
mysql -u root -p

-- Use the database
USE finvera_db;

-- Drop the problematic table
DROP TABLE IF EXISTS commissions;

-- Exit MySQL
exit;
```

Then start your server and it will recreate the table.

---

## Other Common Issues

### ❌ Error: Database does not exist

**Solution:**
```bash
# The server will auto-create databases on startup
npm start
```

### ❌ Error: Access denied for user

**Solution:**
1. Check your `.env` file:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=finvera_db
MASTER_DB_NAME=finvera_master
```

2. Ensure MySQL is running:
```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql

# Windows
net start mysql
```

### ❌ Error: Too many connections

**Solution:**
Increase `MAX_TENANT_CONNECTIONS` in `.env`:
```env
MAX_TENANT_CONNECTIONS=50
```

### ❌ Tables not creating in correct database

**Symptoms:**
- `finvera_db` has accounting tables
- `finvera_master` missing tables

**Solution:**
1. Check that models are loaded correctly:
```bash
# Verify model organization
ls -la src/models/
ls -la src/models/_old_tenant_models/
```

2. Reset databases:
```bash
npm run db:reset
npm start
```

---

## Database Structure Verification

### Check which tables are in each database:

```sql
-- Show all databases
SHOW DATABASES;

-- Check finvera_db tables (should have 11 tables)
USE finvera_db;
SHOW TABLES;

-- Check finvera_master tables (should have 6 tables)
USE finvera_master;
SHOW TABLES;

-- Check tenant database tables (should have 10 tables)
USE finvera_tenant_xxx;
SHOW TABLES;
```

### Expected Table Distribution:

**finvera_db (11 tables):**
- users
- salesmen
- distributors
- leads
- lead_activities
- commissions
- payouts
- subscription_plans
- referral_codes
- referral_rewards
- targets

**finvera_master (6 tables):**
- tenant_master
- account_groups
- voucher_types
- gst_rates
- tds_sections
- accounting_years

**finvera_tenant_xxx (10 tables per tenant):**
- users
- ledgers
- gstins
- vouchers
- voucher_ledger_entries
- billwise_details
- gstr_returns
- tds_details
- einvoices
- audit_logs

---

## Prevention Tips

### 1. Always pull latest code before starting server
```bash
git pull origin main
npm install
npm start
```

### 2. After model changes, consider resetting database
```bash
npm run db:reset  # If no important data
# OR
npm run db:fix-commissions  # If specific table issue
```

### 3. Use migrations for production
For production environments, use proper migrations instead of sync:
```bash
sequelize migration:create --name update-schema
```

### 4. Backup before major changes
```bash
# Backup all databases
mysqldump -u root -p --all-databases > backup_$(date +%Y%m%d).sql

# Restore if needed
mysql -u root -p < backup_20241214.sql
```

---

## Getting Help

1. Check server logs for detailed error messages
2. Verify `.env` configuration
3. Ensure MySQL is running and accessible
4. Check `DATABASE-TABLES-LIST.md` for expected schema
5. Review `ARCHITECTURE-FINAL.md` for architecture overview

---

## Script Details

### fixCommissionsTable.js
- **Safe**: Only drops commissions table
- **Data Loss**: Commission records only
- **Recovery**: Table auto-recreates with correct schema

### resetDatabase.js
- **Destructive**: Drops all databases
- **Data Loss**: Everything (including tenants)
- **Recovery**: Must create new tenants via API
- **Use When**: Major schema changes or corrupt database

Both scripts have a 3-second countdown allowing you to cancel (Ctrl+C) if needed.
