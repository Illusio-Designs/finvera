# Disabled Seeders

These seeders are from the old architecture and are no longer compatible with the new multi-tenant database structure.

## Why Disabled?

These seeders reference the `tenants` table which no longer exists in `finvera_db`. The new architecture uses:
- `finvera_master.tenant_master` for tenant metadata
- Separate databases per tenant for tenant-specific data

## Files in This Directory

### 20251209-default-tenant.js
- **Old Purpose**: Create a default "System" tenant in the `tenants` table
- **Why Disabled**: `tenants` table doesn't exist; use `tenant_master` in master DB instead
- **Replacement**: Create tenants via API `/api/tenants/management/provision`

### 20251210-admin-user.js  
- **Old Purpose**: Create an admin user linked to a tenant
- **Why Disabled**: Admin users in `finvera_db` no longer have `tenant_id`
- **Replacement**: Create admin users directly (they're platform-wide, not tenant-specific)

### 20251211-account-groups.js
- **Old Purpose**: Seed account groups for each tenant
- **Why Disabled**: Account groups are now in `finvera_master`, not tenant-specific
- **Replacement**: `masterSeeds.js` automatically seeds account groups in master DB

## New Seeding Approach

### Platform-Wide Data (finvera_db)
- Use seeders in `src/seeders/` directory
- Example: `20251211-subscription-plans.js` ✅

### Master Shared Data (finvera_master)
- Automatically seeded via `src/seeders/masterSeeds.js`
- Called on server startup
- Includes: AccountGroups, VoucherTypes, GSTRates, TDSSections

### Tenant-Specific Data (finvera_tenant_xxx)
- Seeded during tenant provisioning
- Via `tenantProvisioningService.js`
- Creates default admin user, GSTIN, etc.

## If You Need These Features

### Create a Tenant
```bash
POST /api/tenants/management/provision
{
  "company_name": "My Company",
  "subdomain": "mycompany",
  "plan": "STARTER"
}
```

### Create Platform Admin User
```javascript
// Create manually or via new seeder
const User = require('./src/models').User;
const bcrypt = require('bcryptjs');

await User.create({
  email: 'admin@finvera.com',
  password: await bcrypt.hash('password', 10),
  name: 'Admin User',
  role: 'super_admin',
  is_active: true
});
```
