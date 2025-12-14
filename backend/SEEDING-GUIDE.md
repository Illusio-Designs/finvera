# Database Seeding Guide

## Overview

The application uses a 3-tier database architecture with different seeding strategies for each tier.

## Seeding Order

Seeders run automatically on server startup in this order:

### 1. Master Database Seeds (Auto)
**Database:** `finvera_master`  
**When:** Every server startup  
**File:** `src/seeders/masterSeeds.js`

Seeds shared data:
- ✅ Account Groups (chart of accounts)
- ✅ Voucher Types (transaction types)
- ✅ GST Rates
- ✅ TDS Sections
- ✅ Accounting Years

### 2. Main Database Seeds (Manual)
**Database:** `finvera_db`  
**When:** Run manually or on first startup  
**Files:** `src/seeders/*.js` (numbered)

Run in order:
1. **20251209-default-tenant.js** - Creates System tenant in master
2. **20251210-admin-user.js** - Creates Rishi admin user
3. **20251211-subscription-plans.js** - Seeds FREE and STARTER plans
4. **20251215-provision-system-tenant.js** - Creates System tenant database

### 3. Tenant Database Seeds (Auto)
**Database:** `finvera_tenant_xxx`  
**When:** During tenant provisioning  
**Service:** `tenantProvisioningService.js`

Seeds for each new tenant:
- ✅ Default admin user
- ✅ Primary GSTIN
- ✅ All tenant tables structure

---

## Your Current Setup

After seeding, you'll have:

### Platform Admin (Super Admin)
```
Email: Rishi@finvera.com
Password: Rishi@1995
Role: super_admin
Database: finvera_db.users
Access: Full platform control
```

### System Tenant
```
Company: System
Subdomain: system.finvera.com
Database: finvera_tenant_[uuid]
Status: Active
Plan: STARTER
```

### Tenant Admin (same user, tenant context)
```
Email: Rishi@finvera.com
Password: Rishi@1995
Role: admin
Database: finvera_tenant_[uuid].users
Access: System tenant only
```

---

## Running Seeds

### Automatic (Recommended)
Seeds run automatically when you start the server:

```bash
npm start
```

Output will show:
```
✓ Default tenant created in master database
✓ Platform Admin User Created
✓ Subscription plans: FREE, STARTER
✓ System tenant fully provisioned!
```

### Manual (If needed)
To re-run specific seeders:

```bash
# Reset database first
npm run db:reset

# Start server (runs all seeds)
npm start
```

---

## Seeder Details

### 20251209-default-tenant.js
**Creates:** System tenant in `finvera_master.tenant_master`

```javascript
{
  company_name: 'System',
  subdomain: 'system',
  plan: 'STARTER',
  db_name: 'finvera_tenant_[uuid]',
  is_active: true
}
```

**Note:** Only creates the tenant metadata, not the actual database yet.

### 20251210-admin-user.js
**Creates:** 
1. Platform admin in `finvera_db.users`
2. Tenant admin in `finvera_tenant_xxx.users` (if tenant DB exists)

```javascript
{
  email: 'Rishi@finvera.com',
  password: 'Rishi@1995', // hashed with bcrypt
  name: 'Rishi Kumar',
  role: 'super_admin', // or 'admin' for tenant
  is_active: true
}
```

**Important:** This creates TWO users:
- One in main DB (platform access)
- One in tenant DB (tenant access)

### 20251211-subscription-plans.js
**Creates:** Subscription plans in `finvera_db.subscription_plans`

```javascript
[
  { name: 'FREE', price: 0, max_users: 1, max_invoices: 50 },
  { name: 'STARTER', price: 999, max_users: 5, max_invoices: 500 }
]
```

### 20251215-provision-system-tenant.js
**Creates:** Actual tenant database and tables

Steps:
1. Creates `finvera_tenant_[uuid]` database
2. Creates all tenant tables (users, ledgers, vouchers, etc.)
3. Seeds default GSTIN
4. Links everything together

---

## Verifying Seeds

### Check Platform Admin
```bash
mysql -u root -p -e "SELECT email, name, role FROM finvera_db.users WHERE email='Rishi@finvera.com'"
```

### Check System Tenant
```bash
mysql -u root -p -e "SELECT company_name, subdomain, db_name, is_active FROM finvera_master.tenant_master WHERE subdomain='system'"
```

### Check Tenant Database
```bash
# Get tenant DB name first
TENANT_DB=$(mysql -u root -p -N -e "SELECT db_name FROM finvera_master.tenant_master WHERE subdomain='system' LIMIT 1")

# Check tenant admin
mysql -u root -p -e "SELECT email, name, role FROM $TENANT_DB.users WHERE email='Rishi@finvera.com'"

# Check GSTIN
mysql -u root -p -e "SELECT gstin, legal_name, is_primary FROM $TENANT_DB.gstins"
```

---

## Troubleshooting

### Seeder Already Ran
Each seeder checks if data exists before inserting. Safe to run multiple times.

### Tenant Database Not Created
If `20251215-provision-system-tenant.js` fails:
```bash
# Check if tenant exists in master
mysql -u root -p -e "SELECT * FROM finvera_master.tenant_master WHERE subdomain='system'"

# Manually run provisioning
curl -X POST http://localhost:3000/api/tenants/management/provision \
  -H "Content-Type: application/json" \
  -d '{"company_name":"System","subdomain":"system","plan":"STARTER"}'
```

### Password Not Working
Passwords are hashed with bcrypt. Default passwords:
- Platform: `Rishi@1995`
- All new tenants: Set during provisioning

### Account Groups Missing
Account groups are seeded automatically in master DB on every startup via `masterSeeds.js`.

Check:
```bash
mysql -u root -p -e "SELECT COUNT(*) as total FROM finvera_master.account_groups"
```

Should show ~200+ account groups.

---

## Adding New Seeds

### For Platform Data (finvera_db)
1. Create file: `src/seeders/YYYYMMDD-description.js`
2. Use standard Sequelize seeder format
3. Add checks to prevent duplicates
4. Seeds run on server startup

### For Master Data (finvera_master)
1. Add to `src/seeders/masterSeeds.js`
2. Use upsert logic to prevent duplicates
3. Runs automatically on every startup

### For Tenant Data (tenant databases)
1. Modify `tenantProvisioningService.js`
2. Add to `provisionTenantDatabase()` function
3. Runs when tenant is created

---

## Best Practices

1. **Always check existence** before inserting to prevent duplicates
2. **Use UUIDs** for IDs (generated via `uuid.v4()`)
3. **Hash passwords** with bcrypt (cost factor: 10)
4. **Timestamp everything** with createdAt/updatedAt
5. **Add console logs** for visibility
6. **Handle errors gracefully** - don't crash if data exists

---

## Reset Everything

To start fresh:

```bash
# Drop and recreate all databases
npm run db:reset

# Start server (runs all seeds)
npm start
```

This will:
1. Drop finvera_db, finvera_master, and all tenant databases
2. Recreate empty databases
3. Run all seeders
4. Give you a fresh start with System tenant and Rishi admin

---

## Summary

- ✅ Master seeds run automatically
- ✅ Platform seeds run on startup
- ✅ Your original data (System tenant + Rishi user) is preserved
- ✅ One user, two contexts (platform + tenant)
- ✅ Safe to run multiple times
- ✅ Account groups already in master DB
- ✅ Ready for production use
