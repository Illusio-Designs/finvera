# Indian Invoice System Database Migration

## Overview

This migration (`002-indian-invoice-system-schema.js`) adds the database schema for the Indian Invoice System Backend, including:

1. **numbering_series** table - Flexible invoice numbering with multiple series support
2. **numbering_history** table - Audit trail for all generated voucher numbers
3. **Enhanced einvoices** table - Added retry_count, last_retry_at, error_message fields
4. **Enhanced eway_bills** table - Added distance, transport_mode, vehicle_no, transporter_name fields
5. **Enhanced tds_details** table - Added deductee_name, certificate_date, taxable_amount fields

## Requirements Validated

- 12.1: numbering_series table with tenant_id, voucher_type, format fields
- 12.2: numbering_history table to track generated voucher numbers
- 12.3: Indexes on tenant_id and voucher_type for numbering_series
- 12.4: Unique constraint on IRN field in e_invoices table
- 12.5: Unique constraint on EWB number field in e_way_bills table
- 12.6: Foreign key constraints linking voucher_id to vouchers table
- 12.7: Indexes on voucher_id for e_invoices, e_way_bills, and tds_details tables
- 12.8: tenant_id field in all tables for multi-tenant isolation
- 12.10: UUID as primary key type for all tables

## How to Run the Migration

### For Multi-Tenant System

This system uses a multi-tenant architecture where each tenant has their own database. The migration needs to be run on each tenant database.

#### Option 1: Using the Tenant Provisioning Service

The migration will automatically run when provisioning a new tenant:

```bash
# Provision a new tenant (migration runs automatically)
node backend/src/scripts/provision-tenant.js
```

#### Option 2: Manual Migration for Existing Tenants

For existing tenants, you need to run the migration on each tenant database:

```javascript
// Example script to run migration on all tenant databases
const { getTenantConnection } = require('./src/config/tenantConnectionManager');
const { Umzug, SequelizeStorage } = require('umzug');

async function migrateAllTenants() {
  // Get list of all tenants from master database
  const tenants = await TenantMaster.findAll({ where: { is_active: true } });
  
  for (const tenant of tenants) {
    console.log(`Migrating tenant: ${tenant.tenant_id}`);
    
    // Get tenant-specific connection
    const tenantSequelize = await getTenantConnection(tenant.tenant_id);
    
    // Run migrations
    const umzug = new Umzug({
      migrations: {
        glob: 'src/migrations/*.js',
      },
      context: tenantSequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize: tenantSequelize }),
      logger: console,
    });
    
    await umzug.up();
    console.log(`✓ Migrated tenant: ${tenant.tenant_id}`);
  }
}

migrateAllTenants().catch(console.error);
```

#### Option 3: Using Sequelize CLI (Development Only)

For development/testing with a single tenant database:

```bash
# Run all pending migrations
cd backend
npm run migrate

# Rollback last migration
npm run migrate:undo
```

## Database Schema Details

### 1. numbering_series Table

Stores configuration for different numbering series per voucher type.

```sql
CREATE TABLE numbering_series (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR NOT NULL,
  branch_id UUID NULL,
  voucher_type VARCHAR NOT NULL,
  series_name VARCHAR NOT NULL,
  prefix VARCHAR(10) NOT NULL,
  format VARCHAR(100) NOT NULL DEFAULT '{PREFIX}{YEAR}{MONTH}{SEQUENCE}',
  separator VARCHAR(5) DEFAULT '-',
  sequence_length INTEGER DEFAULT 4,
  current_sequence INTEGER DEFAULT 0,
  start_number INTEGER DEFAULT 1,
  end_number INTEGER NULL,
  reset_frequency ENUM('never', 'monthly', 'yearly', 'financial_year') DEFAULT 'never',
  last_reset_date DATE NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_numbering_series_tenant_id ON numbering_series(tenant_id);
CREATE INDEX idx_numbering_series_voucher_type ON numbering_series(voucher_type);
CREATE INDEX idx_numbering_series_tenant_voucher_type ON numbering_series(tenant_id, voucher_type);
CREATE INDEX idx_numbering_series_default ON numbering_series(tenant_id, voucher_type, is_default);
```

**Example Data:**
```json
{
  "id": "uuid-1",
  "tenant_id": "tenant-123",
  "voucher_type": "Sales",
  "series_name": "Regular Sales",
  "prefix": "INV",
  "format": "{PREFIX}{YEAR}{MONTH}{SEQUENCE}",
  "separator": "-",
  "sequence_length": 4,
  "current_sequence": 156,
  "start_number": 1,
  "reset_frequency": "yearly",
  "is_default": true,
  "is_active": true
}
```

### 2. numbering_history Table

Maintains audit trail of all generated voucher numbers.

```sql
CREATE TABLE numbering_history (
  id UUID PRIMARY KEY,
  series_id UUID NOT NULL REFERENCES numbering_series(id) ON DELETE CASCADE,
  voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  generated_number VARCHAR NOT NULL,
  sequence_used INTEGER NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tenant_id VARCHAR NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_numbering_history_series_id ON numbering_history(series_id);
CREATE UNIQUE INDEX idx_numbering_history_voucher_id ON numbering_history(voucher_id);
CREATE INDEX idx_numbering_history_tenant_id ON numbering_history(tenant_id);
CREATE UNIQUE INDEX idx_numbering_history_number_tenant ON numbering_history(generated_number, tenant_id);
```

**Example Data:**
```json
{
  "id": "uuid-2",
  "series_id": "uuid-1",
  "voucher_id": "voucher-uuid",
  "generated_number": "INV202502156",
  "sequence_used": 156,
  "generated_at": "2025-02-03T10:30:00Z",
  "tenant_id": "tenant-123"
}
```

### 3. Enhanced einvoices Table

Added fields for retry mechanism and error tracking.

**New Columns:**
- `retry_count` INTEGER DEFAULT 0 - Number of retry attempts
- `last_retry_at` TIMESTAMP NULL - Last retry timestamp
- `error_message` TEXT NULL - Error message from failed generation
- `status` ENUM updated to include 'pending' and 'failed'

**New Indexes:**
- `idx_einvoices_status` on status field
- `idx_einvoices_irn_unique` unique constraint on IRN

### 4. Enhanced eway_bills Table

Added fields for transport details and validity calculation.

**New Columns:**
- `distance` INTEGER NULL - Distance in kilometers
- `transport_mode` ENUM('road', 'rail', 'air', 'ship') NULL
- `vehicle_no` VARCHAR NULL - Vehicle number
- `transporter_name` VARCHAR NULL - Transporter name
- `status` ENUM updated to include 'active'

**New Indexes:**
- `idx_eway_bills_status` on status field
- `idx_eway_bills_ewb_number_unique` unique constraint on EWB number

### 5. Enhanced tds_details Table

Added fields for deductee information and certificate tracking.

**New Columns:**
- `deductee_name` VARCHAR NULL - Name of deductee
- `certificate_date` DATE NULL - TDS certificate date
- `taxable_amount` DECIMAL(15,2) DEFAULT 0 - Taxable amount
- `section_code` VARCHAR - Renamed from tds_section

**New Indexes:**
- `idx_tds_details_voucher_id_fk` on voucher_id

## Verification

After running the migration, verify the schema:

```sql
-- Check numbering_series table
SHOW CREATE TABLE numbering_series;
SELECT * FROM numbering_series LIMIT 5;

-- Check numbering_history table
SHOW CREATE TABLE numbering_history;
SELECT * FROM numbering_history LIMIT 5;

-- Check enhanced einvoices table
DESCRIBE einvoices;
SHOW INDEX FROM einvoices;

-- Check enhanced eway_bills table
DESCRIBE eway_bills;
SHOW INDEX FROM eway_bills;

-- Check enhanced tds_details table
DESCRIBE tds_details;
SHOW INDEX FROM tds_details;
```

## Rollback

To rollback this migration:

```bash
# Rollback last migration
npm run migrate:undo
```

Or programmatically:

```javascript
const umzug = new Umzug({
  migrations: {
    glob: 'src/migrations/*.js',
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

await umzug.down({ to: '001-tenant-migration.js' });
```

## Notes

1. **Multi-Tenant Isolation**: All tables include `tenant_id` field for data isolation
2. **Foreign Keys**: All foreign key constraints use CASCADE on delete
3. **Indexes**: Performance indexes added on frequently queried columns
4. **UUID Primary Keys**: All tables use UUID for primary keys
5. **Timestamps**: All tables include createdAt and updatedAt timestamps
6. **Idempotent**: Migration can be run multiple times safely (checks for existing tables/columns)

## Next Steps

After running the migration:

1. Create Sequelize models for new tables (NumberingSeries, NumberingHistory)
2. Implement NumberingService for voucher number generation
3. Update VoucherService to use NumberingService
4. Add API endpoints for numbering series management
5. Write unit tests and property-based tests for numbering logic

## Support

For issues or questions:
- Check the main documentation: `backend/INDIAN_INVOICE_SYSTEM.md`
- Review the design document: `.kiro/specs/indian-invoice-system-backend/design.md`
- Check the requirements: `.kiro/specs/indian-invoice-system-backend/requirements.md`
