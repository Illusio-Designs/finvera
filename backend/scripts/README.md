# Backend Scripts

## Migration Scripts

### run-tenant-migration.js

Run a specific migration on all active tenant databases.

**Usage:**
```bash
node scripts/run-tenant-migration.js <migration-file-name>
```

**Example:**
```bash
# Add credit and bank fields to ledgers table
node scripts/run-tenant-migration.js 002-add-ledger-credit-bank-fields.js
```

**What it does:**
1. Connects to the master database
2. Retrieves all active tenants
3. Runs the specified migration on each tenant database
4. Provides a summary of successful, skipped, and failed migrations

**Notes:**
- The script will skip migrations that have already been applied
- It will continue processing other tenants even if one fails
- Always backup your database before running migrations in production

### cleanup-expired-trials.js

Cleans up expired trial subscriptions.

**Usage:**
```bash
node scripts/cleanup-expired-trials.js
```

### check-tenant-schema.js

Check the schema of a specific table in a tenant database.

**Usage:**
```bash
node scripts/check-tenant-schema.js <database-name> [table-name]
```

**Example:**
```bash
# Check ledgers table schema
node scripts/check-tenant-schema.js finvera_tenant_001 ledgers

# Check vouchers table schema
node scripts/check-tenant-schema.js finvera_tenant_001 vouchers
```

**What it does:**
- Displays all columns in the specified table
- Shows column types, null constraints, and default values
- Useful for verifying migrations have been applied correctly

## Environment Setup

Make sure your `.env` file is properly configured with database credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
```
