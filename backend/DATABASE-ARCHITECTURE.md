# Database Architecture - Simplified Multi-Tenant

## Overview

Finvera uses a **3-tier database architecture** for optimal organization and performance:

```
┌─────────────────────────────────────────────────────────────┐
│  1. MAIN DATABASE (finvera_db)                              │
│     - Admin users, roles                                     │
│     - Salesmen, Distributors                                 │
│     - Subscription plans                                     │
│     - Referral codes, rewards                                │
│     - Commission calculations                                │
│     - Payouts                                                │
│     - Lead management                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  2. MASTER DATABASE (finvera_master)                        │
│     - tenant_master table ONLY                              │
│     - Tenant metadata & DB connection info                  │
│     - Auto-created on server startup                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  3. TENANT DATABASES (finvera_tenant_xxx)                   │
│     - One per tenant (auto-created)                         │
│     - Tenant-specific accounting data:                      │
│       • Users (tenant users)                                │
│       • Ledgers, Account Groups                             │
│       • Vouchers, Transactions                              │
│       • GSTINs, GST Returns                                 │
│       • TDS Details                                         │
│       • E-Invoices                                          │
│       • Bills, Payments                                     │
│       • Audit Logs                                          │
└─────────────────────────────────────────────────────────────┘
```

## Database Breakdown

### 1. Main Database (`finvera_db`)

**Purpose**: System-wide data that applies across all tenants

**Models** (in `src/models/` - uses main DB connection):
- `User` (admin users only)
- `Salesman`
- `Distributor`
- `SubscriptionPlan`
- `ReferralCode`
- `ReferralReward`
- `Commission`
- `Payout`
- `Lead`
- `LeadActivity`
- `Target`
- `AuditLog` (admin actions)

**When to use**:
- Admin dashboard data
- Platform-wide settings
- Salesman/distributor management
- Subscription and billing
- Cross-tenant analytics

### 2. Master Database (`finvera_master`)

**Purpose**: Tenant metadata and database routing information

**Tables**:
- `tenant_master` - Only this one table!

**Contains**:
- Tenant company info (name, contact, etc.)
- Database connection details (encrypted)
- Subdomain mapping
- Subscription status
- Storage limits
- Referral associations

**Initialization**:
- ✅ Auto-created on server startup
- ✅ No manual setup required
- ✅ Syncs table schema automatically

### 3. Tenant Databases (`finvera_tenant_<subdomain>_<timestamp>`)

**Purpose**: Complete isolation of tenant accounting data

**Models** (in `src/services/tenantModels.js` - uses tenant DB connection):
- `User` (tenant users - accountants, viewers)
- `AccountGroup`
- `Ledger`
- `GSTIN`
- `VoucherType`
- `Voucher`
- `VoucherLedgerEntry`
- `VoucherItem`
- `BillWiseDetail`
- `GSTRReturn`
- `GSTRate`
- `TDSDetail`
- `EInvoice`
- `AuditLog` (tenant actions)

**Initialization**:
- ✅ Auto-created when tenant is created
- ✅ Migrations run automatically
- ✅ Default data seeded

## Server Startup Flow

```
Server Start
    │
    ├─→ 1. Check/Create Master Database
    │      └─→ CREATE DATABASE IF NOT EXISTS finvera_master
    │
    ├─→ 2. Sync Master Table
    │      └─→ tenant_master table
    │
    ├─→ 3. Sync Main Database
    │      └─→ All system-wide models
    │
    └─→ 4. Start Express Server
           └─→ Ready to create tenants!
```

## Request Flow

```
HTTP Request
    │
    ├─→ Extract subdomain/tenant_id
    │
    ├─→ Lookup in tenant_master (Master DB)
    │   └─→ Get tenant DB connection info
    │
    ├─→ Connect to Tenant Database
    │   └─→ Load tenant-specific models
    │
    ├─→ Execute Controller Logic
    │   ├─→ Use req.tenantModels for tenant data
    │   └─→ Use regular models for admin data
    │
    └─→ Return Response
```

## Example Usage

### Creating a Tenant

```javascript
// POST /api/admin/tenants
{
  "company_name": "Acme Corp",
  "subdomain": "acme",
  "email": "admin@acme.com"
}

// System automatically:
// 1. Creates record in tenant_master (Master DB)
// 2. Creates database: finvera_acme_1702459200000
// 3. Runs migrations on tenant DB
// 4. Seeds default data
// 5. Creates admin user
```

### Accessing Tenant Data

```javascript
const { resolveTenant } = require('../middleware/tenant');

// Use resolveTenant middleware
router.get('/ledgers', resolveTenant, async (req, res) => {
  // req.tenant - From Master DB (tenant_master)
  // req.tenantModels - From Tenant DB
  
  const { Ledger } = req.tenantModels;
  const ledgers = await Ledger.findAll();
  
  res.json({ success: true, data: { ledgers } });
});
```

### Accessing Admin Data

```javascript
// Use regular models (from Main DB)
const { Salesman, Distributor } = require('../models');

router.get('/salesmen', async (req, res) => {
  // Direct access to Main DB models
  const salesmen = await Salesman.findAll();
  
  res.json({ success: true, data: { salesmen } });
});
```

## Model Organization

### Main Database Models (`src/models/`)
```javascript
// Example: src/models/Salesman.js
module.exports = (sequelize, DataTypes) => {
  const Salesman = sequelize.define('Salesman', {
    // Model definition
  });
  return Salesman;
};

// Used as: const { Salesman } = require('../models');
```

### Master Database Model (`src/models/TenantMaster.js`)
```javascript
// Uses masterSequelize connection
const TenantMaster = masterSequelize.define('TenantMaster', {
  // Model definition
});

// Used as: const TenantMaster = require('../models/TenantMaster');
```

### Tenant Database Models (`src/services/tenantModels.js`)
```javascript
// Function that creates models for a tenant connection
module.exports = (sequelize) => {
  const models = {};
  
  models.Ledger = sequelize.define('Ledger', { /* ... */ });
  models.Voucher = sequelize.define('Voucher', { /* ... */ });
  // ... more tenant models
  
  return models;
};

// Used as: const { Ledger } = req.tenantModels;
```

## Connection Management

### Main Database Connection
```javascript
// src/config/database.js
const sequelize = new Sequelize(
  process.env.DB_NAME || 'finvera_db',
  // ...
);
```

### Master Database Connection
```javascript
// src/config/masterDatabase.js
const masterSequelize = new Sequelize(
  process.env.MASTER_DB_NAME || 'finvera_master',
  // ...
);
// Auto-initialized on startup
```

### Tenant Database Connections
```javascript
// src/config/tenantConnectionManager.js
// Manages dynamic connections
// - Connection pooling
// - LRU caching
// - Auto-cleanup
```

## Environment Variables

```bash
# Main Database (system-wide data)
DB_NAME=finvera_db
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306

# Master Database (tenant metadata)
MASTER_DB_NAME=finvera_master
# Uses same DB_USER, DB_PASSWORD, DB_HOST, DB_PORT

# Multi-tenant settings
USE_SEPARATE_DB_USERS=false
MAX_TENANT_CONNECTIONS=50
ENCRYPTION_KEY=your-32-character-encryption-key
```

## Benefits of This Architecture

### ✅ Clear Separation
- **Main DB**: Platform/admin concerns
- **Master DB**: Routing information
- **Tenant DBs**: Customer data

### ✅ Easy Management
- Master DB auto-created on startup
- No manual database setup needed
- Clear model organization

### ✅ Performance
- Main DB not cluttered with tenant data
- Tenant DB optimized per customer
- Efficient connection pooling

### ✅ Scalability
- Add more tenant databases easily
- Move tenants to different servers
- Scale admin/tenant data independently

### ✅ Security
- Complete tenant data isolation
- Separate database per customer
- Encrypted connection info

## Database Sizes

Typical sizes:
- **Main DB**: ~100-500 MB (grows slowly)
- **Master DB**: ~1-10 MB (minimal, just metadata)
- **Tenant DB**: Varies by usage (typically 10-500 MB each)

## Backup Strategy

### Main Database
```bash
# Daily backup (platform data)
mysqldump -u root -p finvera_db > backups/finvera_db_$(date +%Y%m%d).sql
```

### Master Database
```bash
# Daily backup (tenant routing info)
mysqldump -u root -p finvera_master > backups/finvera_master_$(date +%Y%m%d).sql
```

### Tenant Databases
```bash
# Per-tenant backups
for db in $(mysql -u root -p -e "SHOW DATABASES LIKE 'finvera_tenant_%'" -s); do
  mysqldump -u root -p "$db" > "backups/${db}_$(date +%Y%m%d).sql"
done
```

## Migration Strategy

### Main Database
```bash
# Regular Sequelize migrations
npx sequelize-cli db:migrate
```

### Master Database
```bash
# Auto-synced on startup
# Manual: node src/scripts/initMasterDatabase.js
```

### Tenant Databases
```bash
# Auto-applied during tenant creation
# Manual for existing: node src/scripts/migrateTenants.js
```

## Monitoring

```javascript
// Check all databases
GET /api/admin/system/databases

Response:
{
  "main_db": {
    "name": "finvera_db",
    "size_mb": 245,
    "status": "healthy"
  },
  "master_db": {
    "name": "finvera_master",
    "size_mb": 2,
    "tenants_count": 150,
    "status": "healthy"
  },
  "tenant_dbs": {
    "total": 150,
    "total_size_mb": 45678,
    "avg_size_mb": 304
  }
}
```

## Quick Reference

| What | Where | Connection |
|------|-------|------------|
| Admin users | Main DB | `sequelize` |
| Salesmen | Main DB | `sequelize` |
| Distributors | Main DB | `sequelize` |
| Subscription plans | Main DB | `sequelize` |
| Tenant metadata | Master DB | `masterSequelize` |
| Tenant ledgers | Tenant DB | `req.tenantDb` |
| Tenant vouchers | Tenant DB | `req.tenantDb` |
| Tenant invoices | Tenant DB | `req.tenantDb` |

## Summary

This simplified 3-tier architecture provides:
- ✅ **Automatic setup** - Master DB created on startup
- ✅ **Clear organization** - Each DB has distinct purpose
- ✅ **Easy development** - Models clearly organized
- ✅ **Production ready** - Scalable and secure
- ✅ **Best of both worlds** - Shared admin data + isolated tenant data

The server handles all database initialization automatically - just start it up and you're ready to create tenants!
