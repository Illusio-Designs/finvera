# Quick Fix Steps - Database FK Error

## The Issue
Your local code is outdated and the database has old schema with FK constraints.

## Steps to Fix (Run these in order)

### 1. Pull Latest Code
```bash
cd /Users/rishisoni/Documents/GitHub/finvera
git pull origin main
```

### 2. Install Dependencies (in case any changed)
```bash
cd backend
npm install
```

### 3. Fix the Database

**Option A: Quick Fix (Recommended)**
```bash
npm run db:fix-commissions
# Wait for it to complete (3 second countdown + execution)
```

**Option B: If Option A doesn't work, use complete reset**
```bash
npm run db:reset
# ⚠️ This deletes ALL data
```

**Option C: Manual SQL Fix**
```bash
# Open MySQL
mysql -u root -p

# Run these commands
USE finvera_db;
DROP TABLE IF EXISTS commissions;
exit;
```

### 4. Start the Server
```bash
npm start
# OR for development
npm run dev
```

## Expected Result

You should see:
```
✅ Master database initialized: finvera_master
✅ Database initialized: finvera_db  
✅ Server running on port 5000
```

## If Still Not Working

### Check your Commission.js file locally:
```bash
cat src/models/Commission.js | grep -A 5 "tenant_id"
```

**Should show:**
```javascript
tenant_id: {
  type: DataTypes.UUID,
  allowNull: false,
  comment: 'Logical reference to master.tenant_master.id (no FK constraint)',
},
```

**Should NOT show:**
```javascript
references: {
  model: 'tenants',
  key: 'id',
}
```

### If the file still has `references`:
Your git pull didn't work. Try:
```bash
cd /Users/rishisoni/Documents/GitHub/finvera
git fetch origin
git reset --hard origin/main
cd backend
npm install
npm run db:fix-commissions
npm start
```

## Verification

After server starts successfully, verify tables:
```bash
mysql -u root -p -e "USE finvera_db; SHOW TABLES;"
mysql -u root -p -e "USE finvera_master; SHOW TABLES;"
```

Should see:
- **finvera_db**: 11 tables including commissions (no FK to tenants)
- **finvera_master**: 6 tables including tenant_master

---

## Still Stuck?

1. Check if you have any uncommitted local changes:
   ```bash
   git status
   ```

2. Stash them if needed:
   ```bash
   git stash
   git pull origin main
   ```

3. Show me the output of:
   ```bash
   cat backend/src/models/Commission.js
   ```
