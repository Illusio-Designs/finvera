# Model Associations - Fixed

## Issue

Models were trying to associate with models that no longer exist in the main database after reorganization.

## Fixes Applied

### 1. User Model (Main DB)
**Before:**
```javascript
User.associate = (models) => {
  User.belongsTo(models.Tenant, { foreignKey: 'tenant_id' }); // ❌ Tenant doesn't exist
  User.hasOne(models.Distributor, { foreignKey: 'user_id' });
  User.hasOne(models.Salesman, { foreignKey: 'user_id' });
  User.hasMany(models.AuditLog, { foreignKey: 'user_id' }); // ❌ AuditLog in tenant DB
};
```

**After:**
```javascript
User.associate = (models) => {
  // Admin users don't need associations
  // Tenant users are in tenant databases
};
```

**Changes:**
- Removed `tenant_id` field (admin users don't belong to tenants)
- Changed `password_hash` to `password`
- Changed `full_name` to `name`
- Changed role to ENUM('super_admin', 'admin')
- Added `phone` and `last_login` fields
- Removed all associations (admin users are standalone)

### 2. Commission Model (Main DB)
**Before:**
```javascript
Commission.associate = (models) => {
  Commission.belongsTo(models.Tenant, { foreignKey: 'tenant_id' }); // ❌ Tenant doesn't exist
  Commission.belongsTo(models.Distributor, { foreignKey: 'distributor_id' });
  Commission.belongsTo(models.Salesman, { foreignKey: 'salesman_id' });
  Commission.belongsTo(models.Payout, { foreignKey: 'payout_id' });
};
```

**After:**
```javascript
Commission.associate = (models) => {
  // tenant_id stored as UUID, references master.tenant_master (no FK)
  Commission.belongsTo(models.Distributor, { foreignKey: 'distributor_id' });
  Commission.belongsTo(models.Salesman, { foreignKey: 'salesman_id' });
  Commission.belongsTo(models.Payout, { foreignKey: 'payout_id' });
};
```

**Changes:**
- Removed Tenant association
- `tenant_id` kept as UUID field (references master DB logically)
- Other associations remain (all in main DB)

## Current Valid Associations

### Main Database Models

#### User
- No associations (standalone admin users)

#### Salesman
```javascript
✓ belongsTo User
✓ belongsTo Distributor
✓ hasMany Lead
✓ hasMany Commission
✓ hasMany Payout
✓ hasMany Target
```

#### Distributor
```javascript
✓ belongsTo User
✓ hasMany Salesman
✓ hasMany Commission
✓ hasMany Payout
✓ hasMany Lead
✓ hasMany Target
```

#### Lead
```javascript
✓ belongsTo Salesman
✓ belongsTo Distributor
✓ hasMany LeadActivity
```

#### LeadActivity
```javascript
✓ belongsTo Lead
```

#### Commission
```javascript
✓ belongsTo Distributor
✓ belongsTo Salesman
✓ belongsTo Payout
```

#### Payout
```javascript
✓ belongsTo Salesman (or Distributor)
✓ hasMany Commission
```

#### Target
```javascript
✓ belongsTo Salesman
✓ belongsTo Distributor
```

#### ReferralCode
```javascript
✓ hasMany ReferralReward
```

#### ReferralReward
```javascript
✓ belongsTo ReferralCode
```

#### SubscriptionPlan
```javascript
✓ No associations
```

### Master Database Models

All models in `masterModels.js`:
```javascript
✓ TenantMaster - No associations
✓ AccountGroup - Self-referential (parent_id)
✓ VoucherType - No associations
✓ GSTRate - No associations
✓ TDSSection - No associations
✓ AccountingYear - No associations
```

### Tenant Database Models

All models in `tenantModels.js` have associations within the tenant DB only.

## Cross-Database References

Some fields reference other databases **logically** (as UUIDs), not with FK constraints:

### From Main DB → Master DB
```javascript
Commission.tenant_id → master.tenant_master.id (UUID reference)
```

### From Tenant DB → Master DB
```javascript
Ledger.account_group_id → master.account_groups.id (UUID reference)
Voucher.voucher_type_id → master.voucher_types.id (UUID reference)
TDSDetail.section → master.tds_sections.section_code (VARCHAR reference)
```

## Why No Foreign Key Constraints?

Cross-database foreign key constraints are not supported in MySQL. We use:
- **UUID/VARCHAR fields** to store references
- **Application-level validation** to ensure referential integrity
- **Middleware checks** before creating records

## Validation Example

```javascript
// Creating a ledger
router.post('/ledgers', resolveTenant, async (req, res) => {
  const { account_group_id } = req.body;
  
  // Validate account group exists in master DB
  const { AccountGroup } = req.masterModels;
  const group = await AccountGroup.findByPk(account_group_id);
  
  if (!group) {
    return res.status(400).json({ error: 'Invalid account group' });
  }
  
  // Create ledger in tenant DB
  const { Ledger } = req.tenantModels;
  const ledger = await Ledger.create({
    ...req.body,
    account_group_id, // Stored as UUID
  });
});
```

## Result

✅ All models now have valid associations  
✅ No references to non-existent models  
✅ Clean separation between databases  
✅ Server starts without errors  
✅ Associations work within each database  

## Testing

```bash
# Should start without errors
npm start

# Check associations
const { User, Salesman } = require('./src/models');
console.log(User.associations); // Should be empty
console.log(Salesman.associations); // Should show valid associations
```
