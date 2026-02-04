# Migration System Guide - Indian Invoice System Backend

## Overview

The Indian Invoice System Backend uses a **multi-tenant architecture** where each tenant (company) has their own separate database. This guide explains how the migration system works and how to use it.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MASTER DATABASE                          │
│  - TenantMaster (list of all tenants)                       │
│  - AccountGroups (shared across all tenants)                │
│  - VoucherTypes (shared across all tenants)                 │
│  - Subscriptions, Users, etc.                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ manages
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   TENANT DATABASES                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Tenant 1 DB │  │  Tenant 2 DB │  │  Tenant 3 DB │     │
│  │              │  │              │  │              │     │
│  │  - Vouchers  │  │  - Vouchers  │  │  - Vouchers  │     │
│  │  - Ledgers   │  │  - Ledgers   │  │  - Ledgers   │     │
│  │  - Invoices  │  │  - Invoices  │  │  - Invoices  │     │
│  │  - etc.      │  │  - etc.      │  │  - etc.      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Migration Files

Migration files are located in `backend/src/migrations/` and follow this naming convention:

```
<sequence>-<description>.js

Examples:
001-admin-master-migration.js    (Master DB only)
001-tenant-migration.js          (Tenant DBs)
002-indian-invoice-system-schema.js (Tenant DBs)
```

### Migration Types

1. **Master Database Migrations** (e.g., `001-admin-master-migration.js`)
   - Run ONCE on the master database
   - Contains shared data like AccountGroups, VoucherTypes
   - Run manually or during initial setup

2. **Tenant Database Migrations** (e.g., `001-tenant-migration.js`, `002-indian-invoice-system-schema.js`)
   - Run on EACH tenant database
   - Contains tenant-specific tables like Vouchers, Ledgers, etc.
   - Run automatically when provisioning new tenants
   - Can be run manually on existing tenants

## How Migrations Work

### Automatic Migration (New Tenants)

When a new tenant is created, the system automatically:

1. Creates a new database for the tenant
2. Runs ALL tenant migration files in order (001, 002, 003, etc.)
3. Seeds default data (admin user, default ledgers, etc.)

**Code Flow:**
```javascript
// backend/src/services/tenantProvisioningService.js

async createTenant(tenantData) {
  // 1. Create tenant record in master DB
  const tenant = await TenantMaster.create({...});
  
  // 2. Provision database (creates DB, grants privileges)
  await this.provisionDatabase(tenant, dbPassword);
  
  // 3. Initialize schema (runs migrations)
  await this.initializeTenantSchema(tenant, plainPassword);
  
  // 4. Seed default data
  await this.seedDefaultData(connection, tenant);
}

async runTenantMigrations(connection) {
  // Get all migration files (001-*, 002-*, etc.)
  const migrationFiles = fs.readdirSync(migrationsPath)
    .filter(file => file.match(/^\d{3}-.*\.js$/) && !file.includes('admin-master'))
    .sort();
  
  // Run each migration in order
  for (const file of migrationFiles) {
    const migration = require(migrationFile);
    await migration.up(queryInterface, Sequelize);
  }
}
```

### Manual Migration (Existing Tenants)

For existing tenants, you need to run migrations manually:

#### Option 1: Using the Provisioning Script

```bash
# Run migrations on a specific tenant
node backend/src/scripts/run-tenant-migration.js <tenant_id>

# Run migrations on all tenants
node backend/src/scripts/run-all-tenant-migrations.js
```

#### Option 2: Using Node.js Script

```javascript
const tenantConnectionManager = require('./src/config/tenantConnectionManager');
const TenantMaster = require('./src/models/TenantMaster');

async function runMigrationOnTenant(tenantId) {
  const tenant = await TenantMaster.findByPk(tenantId);
  const connection = await tenantConnectionManager.getConnection(tenant);
  
  // Run migration
  const migration = require('./src/migrations/002-indian-invoice-system-schema.js');
  const queryInterface = connection.getQueryInterface();
  await migration.up(queryInterface, require('sequelize').Sequelize);
  
  console.log('Migration completed for tenant:', tenantId);
}
```

## Indian Invoice System Migration (002)

The `002-indian-invoice-system-schema.js` migration adds:

### New Tables

1. **numbering_series** - Flexible invoice numbering configuration
   - Supports multiple series per voucher type
   - Configurable format with tokens (PREFIX, YEAR, MONTH, SEQUENCE)
   - Reset frequency (never, monthly, yearly, financial_year)
   - Branch-specific numbering support

2. **numbering_history** - Audit trail for generated numbers
   - Tracks every generated voucher number
   - Links to series and voucher
   - Ensures uniqueness and traceability

### Enhanced Tables

3. **einvoices** - Added retry mechanism
   - `retry_count` - Number of retry attempts
   - `last_retry_at` - Last retry timestamp
   - `error_message` - Error details from failed generation
   - Updated status enum (pending, generated, cancelled, failed)

4. **eway_bills** - Added transport details
   - `distance` - Distance in KM for validity calculation
   - `transport_mode` - ENUM(road, rail, air, ship)
   - `vehicle_no` - Vehicle number
   - `transporter_name` - Transporter name
   - Updated status enum (active, generated, cancelled, expired)

5. **tds_details** - Added deductee information
   - `deductee_name` - Name of deductee
   - `certificate_date` - TDS certificate date
   - `taxable_amount` - Taxable amount for TDS calculation

### Indexes Added

- Performance indexes on `tenant_id`, `voucher_type`, `status` fields
- Unique constraints on `IRN` and `EWB number` fields
- Foreign key indexes for better query performance

## Testing Migrations

Before running migrations on production, test them:

```bash
# Test the migration on a test database
node backend/test-migration-002.js
```

This script will:
1. Create a test database
2. Run the migration
3. Verify all tables and columns were created
4. Check indexes and constraints
5. Clean up the test database

## Migration Best Practices

### 1. Idempotent Migrations

All migrations should be idempotent (safe to run multiple times):

```javascript
// ✅ GOOD - Checks if table exists
const [table] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'my_table'");
if (table.length === 0) {
  await queryInterface.createTable('my_table', {...});
}

// ✅ GOOD - Checks if column exists
const tableDescription = await queryInterface.describeTable('my_table');
if (!tableDescription['my_column']) {
  await queryInterface.addColumn('my_table', 'my_column', {...});
}

// ❌ BAD - Will fail if table already exists
await queryInterface.createTable('my_table', {...});
```

### 2. Error Handling

Handle errors gracefully:

```javascript
try {
  await queryInterface.addColumn('my_table', 'my_column', {...});
} catch (error) {
  if (error.message.includes('Duplicate column name')) {
    console.log('Column already exists, skipping');
  } else {
    throw error; // Re-throw unexpected errors
  }
}
```

### 3. Foreign Keys

Always check if referenced tables exist:

```javascript
// Check if vouchers table exists before adding foreign key
const [vouchersTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'vouchers'");
if (vouchersTable.length > 0) {
  await queryInterface.addColumn('my_table', 'voucher_id', {
    type: Sequelize.UUID,
    references: { model: 'vouchers', key: 'id' },
    onDelete: 'CASCADE',
  });
}
```

### 4. Rollback Support

Always implement the `down` method:

```javascript
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create tables, add columns, etc.
  },
  
  async down(queryInterface, Sequelize) {
    // Reverse the changes
    await queryInterface.dropTable('my_table');
  }
};
```

## Troubleshooting

### Migration Fails on Existing Tenant

**Problem:** Migration fails because tables already exist

**Solution:** The migration is idempotent and should handle existing tables. Check the error message:

```bash
# If error is "Table already exists" - this is normal, migration will skip
# If error is something else - check the migration code
```

### Foreign Key Constraint Fails

**Problem:** Cannot add foreign key because referenced table doesn't exist

**Solution:** Ensure migrations run in correct order:
1. `001-tenant-migration.js` creates base tables (vouchers, ledgers, etc.)
2. `002-indian-invoice-system-schema.js` adds new tables with foreign keys

### Too Many Indexes Error

**Problem:** MySQL has a limit of 64 indexes per table

**Solution:** The migration handles this gracefully and skips index creation if limit is reached. Prioritize the most important indexes.

## Next Steps

After running the migration:

1. ✅ **Verify Schema** - Check that all tables and columns exist
2. ✅ **Create Models** - Create Sequelize models for new tables (NumberingSeries, NumberingHistory)
3. ✅ **Implement Services** - Create NumberingService for voucher number generation
4. ✅ **Add API Endpoints** - Create REST API endpoints for numbering series management
5. ✅ **Write Tests** - Unit tests and property-based tests for numbering logic

## Support

For issues or questions:
- Check the migration README: `backend/src/migrations/README-INDIAN-INVOICE-SYSTEM.md`
- Review the design document: `.kiro/specs/indian-invoice-system-backend/design.md`
- Check the requirements: `.kiro/specs/indian-invoice-system-backend/requirements.md`

## Summary

The migration system is designed to:
- ✅ Work with multi-tenant architecture
- ✅ Run automatically for new tenants
- ✅ Be safe to run multiple times (idempotent)
- ✅ Handle errors gracefully
- ✅ Support rollback if needed
- ✅ Maintain data integrity with foreign keys and indexes

The `002-indian-invoice-system-schema.js` migration is now integrated into the tenant provisioning system and will automatically run when creating new tenants!
