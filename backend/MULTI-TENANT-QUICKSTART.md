# Multi-Tenant Quick Start Guide

Get your multi-tenant Finvera application running in **3 minutes**!

## Step 1: Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set these required values:

```bash
# Database credentials
DB_NAME=finvera_db              # Main database (admin, salesman, etc.)
DB_USER=root
DB_PASSWORD=your_password

# Master database (auto-created)
MASTER_DB_NAME=finvera_master   # Tenant metadata only

# Encryption key (must be 32 characters)
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Start Server (Auto-Setup!)

```bash
npm start
```

**That's it!** The server automatically:
- ✅ Creates `finvera_master` database
- ✅ Creates `tenant_master` table
- ✅ Syncs all main database tables
- ✅ Ready to accept requests

Server runs on `http://localhost:3000`

You'll see:
```
🔄 Initializing databases...
📦 Setting up master database for tenant metadata...
📦 Setting up main database for system models...
✅ All databases initialized successfully
🚀 Server running on port 3000
📊 Databases:
   - Main DB: finvera_db (Admin, Salesman, Distributor, etc.)
   - Master DB: finvera_master (Tenant metadata only)
   - Tenant DBs: Created dynamically per tenant
```

## Step 4: Create Your First Tenant

### Using API:

```bash
curl -X POST http://localhost:3000/api/admin/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "company_name": "Acme Corporation",
    "subdomain": "acme",
    "email": "admin@acme.com",
    "phone": "1234567890",
    "subscription_plan": "standard"
  }'
```

### Response:

```json
{
  "success": true,
  "message": "Tenant created successfully",
  "data": {
    "tenant": {
      "id": "uuid-here",
      "company_name": "Acme Corporation",
      "subdomain": "acme",
      "email": "admin@acme.com",
      "db_name": "finvera_acme_1702459200000",
      "is_trial": true,
      "trial_ends_at": "2024-01-12T00:00:00.000Z"
    }
  }
}
```

The system automatically:
1. ✅ Creates tenant record in master DB
2. ✅ Creates dedicated database `finvera_acme_xxx`
3. ✅ Runs migrations on tenant database
4. ✅ Seeds default data (account groups, voucher types)
5. ✅ Creates admin user

## Step 5: Access Tenant

### Via Subdomain (Web):

```
http://acme.localhost:3000
```

### Via API (with JWT):

```bash
# Login to get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "ChangeMe@123",
    "subdomain": "acme"
  }'

# Use token in subsequent requests
curl http://localhost:3000/api/ledgers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Verify Setup

### Check Master Database:

```sql
USE finvera_master;
SELECT id, company_name, subdomain, db_name, db_provisioned 
FROM tenant_master;
```

### Check Tenant Database:

```sql
USE finvera_acme_1702459200000;
SHOW TABLES;
SELECT * FROM users;
```

## Common Operations

### Create Another Tenant:

```bash
curl -X POST http://localhost:3000/api/admin/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "company_name": "TechCorp",
    "subdomain": "techcorp",
    "email": "admin@techcorp.com"
  }'
```

### List All Tenants:

```bash
curl http://localhost:3000/api/admin/tenants \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Get Tenant Stats:

```bash
curl http://localhost:3000/api/admin/tenants/TENANT_ID/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Suspend Tenant:

```bash
curl -X POST http://localhost:3000/api/admin/tenants/TENANT_ID/suspend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"reason": "Non-payment"}'
```

## Testing

### Test Connection Manager:

```javascript
const tenantConnectionManager = require('./src/config/tenantConnectionManager');

// Get stats
console.log(tenantConnectionManager.getStats());

// Output:
// {
//   activeConnections: 2,
//   maxCachedConnections: 50,
//   cachedTenants: ['tenant-1', 'tenant-2']
// }
```

### Test Tenant Resolution:

```javascript
// In your route
router.get('/test', resolveTenant, async (req, res) => {
  console.log('Tenant:', req.tenant.company_name);
  console.log('Database:', req.tenant.db_name);
  console.log('Models:', Object.keys(req.tenantModels));
  
  res.json({ success: true, tenant: req.tenant.company_name });
});
```

## Architecture Overview

```
Request → resolveTenant Middleware
          ↓
          Lookup tenant from master DB
          ↓
          Get/create database connection
          ↓
          Load tenant models
          ↓
          Attach to req.tenantDb, req.tenantModels
          ↓
          Your Controller → Use req.tenantModels
```

## Troubleshooting

### Issue: "Tenant not found"

**Solution:** Check subdomain or tenant_id is correct

```sql
SELECT subdomain FROM tenant_master WHERE is_active = true;
```

### Issue: "Tenant database is being provisioned"

**Solution:** Wait a moment or check provisioning status

```sql
SELECT db_name, db_provisioned FROM tenant_master WHERE id = 'xxx';
```

### Issue: Connection errors

**Solution:** Check database credentials and verify DB exists

```sql
SHOW DATABASES LIKE 'finvera_%';
```

### Issue: Too many connections

**Solution:** Increase `MAX_TENANT_CONNECTIONS` in .env

```bash
MAX_TENANT_CONNECTIONS=100
```

## Next Steps

- ✅ Read [MULTI-TENANT-ARCHITECTURE.md](./MULTI-TENANT-ARCHITECTURE.md) for complete details
- ✅ Set up backups for master and tenant databases
- ✅ Configure monitoring and alerts
- ✅ Implement your business logic using `req.tenantModels`
- ✅ Set up proper admin authentication
- ✅ Configure production database credentials

## Production Checklist

Before going live:

- [ ] Change `ENCRYPTION_KEY` to a strong 32-character key
- [ ] Set `USE_SEPARATE_DB_USERS=true` for better isolation
- [ ] Configure database backups (master + tenants)
- [ ] Set up monitoring for connection pool
- [ ] Implement rate limiting per tenant
- [ ] Configure proper admin authentication
- [ ] Set up SSL for database connections
- [ ] Review security settings
- [ ] Test disaster recovery procedure
- [ ] Document backup/restore process

## Support

- 📖 Full Documentation: [MULTI-TENANT-ARCHITECTURE.md](./MULTI-TENANT-ARCHITECTURE.md)
- 🔧 Check logs: `logs/app.log`
- 📧 Contact: support@finvera.com

Happy coding with separate databases per tenant! 🚀
