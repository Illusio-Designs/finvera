# Multi-Tenant Database Architecture

## Overview

Finvera uses a **separate database per tenant** architecture, providing the highest level of data isolation and security. Each tenant gets their own dedicated MySQL database.

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│         Master Database (finvera_master)        │
│                                                  │
│  - Tenant Metadata (company info, subdomain)    │
│  - Database Connection Info (encrypted)         │
│  - Subscription & Billing Data                  │
│  - Admin/Salesman/Distributor Data             │
└─────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Tenant DB 1 │  │  Tenant DB 2 │  │  Tenant DB N │
│              │  │              │  │              │
│ - Users      │  │ - Users      │  │ - Users      │
│ - Ledgers    │  │ - Ledgers    │  │ - Ledgers    │
│ - Vouchers   │  │ - Vouchers   │  │ - Vouchers   │
│ - Invoices   │  │ - Invoices   │  │ - Invoices   │
│ - etc.       │  │ - etc.       │  │ - etc.       │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Benefits

### 1. **Data Isolation**
- Complete physical separation of tenant data
- No risk of cross-tenant data leakage
- Easier to comply with data protection regulations

### 2. **Performance**
- Each tenant has dedicated database resources
- No query interference between tenants
- Can optimize indexes per tenant

### 3. **Scalability**
- Easy to move tenant databases to different servers
- Can allocate resources based on tenant needs
- Horizontal scaling by distributing tenants

### 4. **Security**
- Tenant data breach affects only one tenant
- Can have separate database credentials per tenant
- Easier to implement tenant-specific encryption

### 5. **Backup & Recovery**
- Can backup/restore individual tenants
- Tenant-specific backup schedules
- Point-in-time recovery per tenant

### 6. **Customization**
- Can apply tenant-specific database settings
- Custom schemas for premium tenants
- Easier to handle tenant-specific migrations

## Components

### 1. Master Database (`finvera_master`)

Stores tenant metadata only:
- Tenant information (company name, contact, etc.)
- Database connection details (encrypted)
- Subscription and billing data
- Referral and commission tracking
- Admin/salesman/distributor data

**File:** `src/config/masterDatabase.js`

### 2. Tenant Connection Manager

Manages database connections for all tenants:
- Connection pooling and caching
- Automatic connection cleanup
- Connection health monitoring
- Maximum connection limits

**File:** `src/config/tenantConnectionManager.js`

### 3. Tenant Provisioning Service

Handles tenant lifecycle:
- Creating new tenant databases
- Running migrations
- Seeding default data
- Suspending/deleting tenants

**File:** `src/services/tenantProvisioningService.js`

### 4. Tenant Middleware

Resolves tenant and attaches database connection:
- Extracts tenant from subdomain/JWT
- Validates tenant status
- Attaches tenant database connection to request
- Loads tenant-specific models

**File:** `src/middleware/tenant.js`

### 5. Tenant Models

Dynamic models for each tenant database:
- Users, Ledgers, Vouchers, etc.
- Loaded dynamically per request
- No tenant_id column needed

**File:** `src/services/tenantModels.js`

## Setup Instructions

### 1. Update Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit .env and set:
MASTER_DB_NAME=finvera_master
ENCRYPTION_KEY=your-32-character-encryption-key
USE_SEPARATE_DB_USERS=false  # true for production
MAX_TENANT_CONNECTIONS=50
```

### 2. Initialize Master Database

```bash
# Run initialization script
node src/scripts/initMasterDatabase.js
```

This creates:
- Master database
- `tenant_master` table
- Required indexes

### 3. Start the Server

```bash
npm start
```

### 4. Create Your First Tenant

```bash
curl -X POST http://localhost:3000/api/admin/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "company_name": "Acme Corp",
    "subdomain": "acme",
    "email": "admin@acme.com",
    "phone": "1234567890",
    "subscription_plan": "standard"
  }'
```

The system will automatically:
1. Create tenant record in master database
2. Create dedicated database for tenant
3. Run migrations on tenant database
4. Seed default data
5. Create admin user

## API Usage

### Tenant Resolution

The system automatically resolves tenants in three ways:

#### 1. Subdomain-based (Recommended for Web)

```javascript
// Request to: acme.finvera.com
// Middleware automatically:
// - Extracts subdomain "acme"
// - Looks up tenant in master database
// - Connects to tenant's database
// - Attaches to req.tenantDb and req.tenantModels
```

#### 2. JWT-based (Recommended for API)

```javascript
// JWT payload includes tenant_id
// Middleware:
// - Extracts tenant_id from JWT
// - Looks up tenant
// - Connects to tenant's database
```

#### 3. Explicit tenant_id (Admin operations)

```javascript
// Request with ?tenant_id=xxx or body.tenant_id
// Used for admin operations across tenants
```

### Using Tenant Models

```javascript
const { resolveTenant } = require('../middleware/tenant');

router.get('/ledgers', resolveTenant, async (req, res) => {
  try {
    // req.tenantModels contains all models for this tenant
    const { Ledger } = req.tenantModels;
    
    // Query tenant's database
    const ledgers = await Ledger.findAll();
    
    res.json({ success: true, data: { ledgers } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Tenant Management API

```javascript
// Create tenant
POST /api/admin/tenants
{
  "company_name": "Company Name",
  "subdomain": "subdomain",
  "email": "email@company.com",
  "phone": "1234567890",
  "subscription_plan": "standard"
}

// List all tenants
GET /api/admin/tenants?page=1&limit=50&search=query

// Get tenant details
GET /api/admin/tenants/:id

// Update tenant
PUT /api/admin/tenants/:id
{
  "company_name": "New Name",
  "subscription_plan": "premium"
}

// Suspend tenant
POST /api/admin/tenants/:id/suspend
{
  "reason": "Non-payment"
}

// Reactivate tenant
POST /api/admin/tenants/:id/reactivate

// Get tenant stats
GET /api/admin/tenants/:id/stats

// Delete tenant (with confirmation)
DELETE /api/admin/tenants/:id
{
  "confirm": "DELETE"
}
```

## Database Naming Convention

Tenant databases follow this pattern:

```
finvera_<subdomain>_<timestamp>
```

Examples:
- `finvera_acme_1702459200000`
- `finvera_techcorp_1702459300000`
- `finvera_retail123_1702459400000`

## Security Considerations

### 1. Database Password Encryption

Tenant database passwords are encrypted using AES-256-CBC:

```javascript
// Encryption key in .env
ENCRYPTION_KEY=your-32-character-encryption-key-here

// Passwords are encrypted before storage
// Decrypted only when creating connections
```

### 2. Separate Database Users (Production)

```bash
# In production, enable separate DB users per tenant
USE_SEPARATE_DB_USERS=true

# Each tenant gets:
# - Unique database user
# - Unique password
# - Access only to their database
```

### 3. Connection Pooling

```javascript
// Each tenant connection has its own pool
pool: {
  max: 5,       // Maximum connections per tenant
  min: 0,       // Minimum idle connections
  acquire: 30000, // Maximum time to get connection (ms)
  idle: 10000,    // Maximum idle time before release (ms)
}

// Overall limit on cached connections
MAX_TENANT_CONNECTIONS=50  // Adjust based on server capacity
```

### 4. Tenant Validation

Every request validates:
- Tenant exists
- Tenant is active
- Tenant is not suspended
- Database is provisioned

## Performance Optimization

### 1. Connection Caching

- Recent tenant connections are cached
- LRU eviction when cache is full
- Automatic cleanup of inactive connections

### 2. Connection Cleanup

```javascript
// Connections inactive for 5 minutes are closed
// Cleanup runs every minute
// Removes oldest 20% when cache is full
```

### 3. Monitoring

```javascript
// Get connection statistics
const tenantConnectionManager = require('./config/tenantConnectionManager');
const stats = tenantConnectionManager.getStats();

console.log(stats);
// {
//   activeConnections: 12,
//   maxCachedConnections: 50,
//   cachedTenants: ['tenant-id-1', 'tenant-id-2', ...]
// }
```

## Migration Strategy

### Master Database Migrations

```bash
# Migrations for master database go in:
src/migrations/20251213-create-master-database.js

# Run with Sequelize CLI or:
node src/scripts/initMasterDatabase.js
```

### Tenant Database Migrations

```javascript
// Tenant migrations are applied automatically during:
// 1. New tenant creation
// 2. Tenant database initialization

// Models are synced from: src/services/tenantModels.js

// For production, use proper migration files:
src/migrations/tenant/20251213-create-tenant-tables.js
```

## Backup Strategy

### Master Database Backup

```bash
# Backup master database (contains all tenant metadata)
mysqldump -u root -p finvera_master > master_backup.sql

# Restore
mysql -u root -p finvera_master < master_backup.sql
```

### Tenant Database Backups

```bash
# Backup single tenant
mysqldump -u root -p finvera_acme_1702459200000 > tenant_acme_backup.sql

# Backup all tenant databases
for db in $(mysql -u root -p -e "SHOW DATABASES LIKE 'finvera_%'" -s --skip-column-names); do
  mysqldump -u root -p "$db" > "backup_${db}.sql"
done

# Automated backup script (recommended)
node src/scripts/backupTenants.js
```

## Scaling Strategies

### Horizontal Scaling

```
┌─────────────────┐
│ Master Database │
│ (Single Source  │
│  of Truth)      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│Server 1│ │Server 2│
│        │ │        │
│Tenants:│ │Tenants:│
│ A, B   │ │ C, D   │
└────────┘ └────────┘
```

1. Multiple database servers
2. Distribute tenants across servers
3. Update `db_host` in tenant_master
4. Connection manager handles multiple hosts

### Vertical Scaling

```
┌──────────────────────┐
│  Premium Tenants     │
│  (Dedicated Server)  │
└──────────────────────┘

┌──────────────────────┐
│  Standard Tenants    │
│  (Shared Server)     │
└──────────────────────┘

┌──────────────────────┐
│  Free/Trial Tenants  │
│  (Shared Server)     │
└──────────────────────┘
```

## Monitoring & Maintenance

### Health Checks

```javascript
// Monitor tenant database health
GET /api/admin/tenants/:id/health

// Returns:
{
  "database_accessible": true,
  "connection_pool_status": "healthy",
  "last_query_time_ms": 45,
  "storage_used_mb": 125,
  "storage_limit_mb": 1024
}
```

### Storage Management

```javascript
// Check storage usage
GET /api/admin/tenants/:id/stats

// Alert when tenant reaches 80% storage
// Automatically suspend at 100%
```

### Cleanup Tasks

```javascript
// Close unused connections
tenantConnectionManager.cleanupOldConnections();

// Update storage statistics
node src/scripts/updateStorageStats.js

// Archive inactive tenants
node src/scripts/archiveInactiveTenants.js
```

## Troubleshooting

### Connection Issues

```bash
# Check active connections
SELECT * FROM information_schema.processlist 
WHERE db LIKE 'finvera_%';

# Check connection cache
const stats = tenantConnectionManager.getStats();
console.log(stats);
```

### Database Not Found

```bash
# Verify database exists
SHOW DATABASES LIKE 'finvera_%';

# Check tenant provisioning status
SELECT id, subdomain, db_name, db_provisioned 
FROM tenant_master 
WHERE db_provisioned = false;
```

### Performance Issues

```bash
# Check slow queries per tenant
SELECT * FROM mysql.slow_log 
WHERE db = 'finvera_tenant_xxx';

# Analyze tenant database
ANALYZE TABLE ledgers;
ANALYZE TABLE vouchers;
```

## Best Practices

1. **Always use `resolveTenant` middleware** for tenant-specific routes
2. **Never store tenant_id** in tenant databases
3. **Encrypt database passwords** in master database
4. **Monitor storage usage** per tenant
5. **Regular backups** of both master and tenant databases
6. **Connection pooling** to limit resource usage
7. **Implement rate limiting** per tenant
8. **Log all tenant operations** for audit trail
9. **Test migrations** before applying to production tenants
10. **Have rollback plan** for each tenant

## Future Enhancements

- [ ] Read replicas for tenant databases
- [ ] Automated backup scheduling per tenant
- [ ] Database sharding for very large tenants
- [ ] Multi-region support
- [ ] Tenant database migration tools
- [ ] Real-time storage monitoring
- [ ] Auto-scaling based on tenant load
- [ ] Tenant data export/import utilities

## Support

For issues or questions:
- Check logs: `logs/app.log`
- Review tenant status: `SELECT * FROM tenant_master WHERE id = 'xxx'`
- Test connection: `tenantConnectionManager.getConnection(...)`
- Contact: admin@finvera.com
