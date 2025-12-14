# Import Your Old 200+ Account Groups

You mentioned you have 200+ account groups in your old system. Here's how to import them all.

## Quick Method: Direct Database Import

If your old database is still accessible:

### 1. Add Old Database Info to `.env`

```env
# Your current database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=finvera_db
MASTER_DB_NAME=finvera_master

# Your old database
OLD_DB_HOST=localhost
OLD_DB_PORT=3306
OLD_DB_USER=root
OLD_DB_PASSWORD=yourpassword
OLD_DB_NAME=old_finvera_db
```

### 2. Run Import Script

```bash
cd backend
node scripts/importOldAccountGroups.js --from-old-db
```

This will:
- ✅ Connect to your old database
- ✅ Fetch all account groups
- ✅ Import them into `finvera_master.account_groups`
- ✅ Preserve all data (codes, names, parent_id, nature, etc.)

---

## Alternative Methods

### Method 1: Export from Old DB, Then Import

```bash
# 1. Export old account groups to SQL
mysqldump -u root -p old_finvera_db account_groups > account_groups.sql

# 2. Import into new master database
node scripts/importOldAccountGroups.js --sql account_groups.sql
```

### Method 2: Export to JSON

```bash
# 1. Export to JSON
mysql -u root -p -e "SELECT * FROM old_finvera_db.account_groups" --batch --skip-column-names | \
  awk '{print "{\"code\":\""$2"\",\"name\":\""$3"\",\"nature\":\""$4"\"}"}' > account_groups.json

# 2. Import JSON
node scripts/importOldAccountGroups.js --json account_groups.json
```

### Method 3: Export to CSV

```bash
# 1. Export to CSV
mysql -u root -p -e "
  SELECT 
    code,
    name,
    parent_id,
    group_type as nature,
    affects_gross_profit,
    is_system
  FROM old_finvera_db.account_groups
  INTO OUTFILE '/tmp/account_groups.csv'
  FIELDS TERMINATED BY ','
  ENCLOSED BY '\"'
  LINES TERMINATED BY '\n';
"

# 2. Import CSV
node scripts/importOldAccountGroups.js --csv /tmp/account_groups.csv
```

---

## Manual Export from MySQL

If you want to manually export your data:

```sql
-- Connect to old database
mysql -u root -p

-- Select old database
USE old_finvera_db;

-- Export all account groups
SELECT 
  id,
  code,
  name,
  parent_id,
  group_type,
  affects_gross_profit,
  is_system,
  createdAt,
  updatedAt
FROM account_groups
ORDER BY code;

-- Save this output to a file
```

Then provide me with this data and I'll help you import it.

---

## What Gets Imported

The import script will preserve:
- ✅ `code` → `group_code` (e.g., 'BANK', 'CASH', etc.)
- ✅ `name` → `name` (e.g., 'Bank Accounts')
- ✅ `parent_id` → `parent_id` (for hierarchical groups)
- ✅ `group_type` → `nature` ('asset', 'liability', 'income', 'expense')
- ✅ `affects_gross_profit` → `affects_gross_profit` (boolean)
- ✅ `is_system` → `is_system` (boolean)

---

## After Import

Verify the import:

```bash
# Count imported groups
mysql -u root -p -e "SELECT COUNT(*) as total FROM finvera_master.account_groups"

# View first 20 groups
mysql -u root -p -e "SELECT group_code, name, nature FROM finvera_master.account_groups LIMIT 20"

# Group by nature
mysql -u root -p -e "
  SELECT 
    nature, 
    COUNT(*) as count 
  FROM finvera_master.account_groups 
  GROUP BY nature
"
```

---

## Need Help?

If you're having trouble, you can:

1. **Send me a SQL dump** of your old `account_groups` table
2. **Provide the data in JSON/CSV** format
3. **Give me access details** to your old database (in .env)

I'll help you get all 200+ groups imported! 

---

## Example: Quick Copy-Paste Import

If your old data is in the same MySQL server:

```sql
-- Run this directly in MySQL
INSERT INTO finvera_master.account_groups 
  (id, group_code, name, parent_id, nature, affects_gross_profit, is_system, createdAt, updatedAt)
SELECT 
  UUID() as id,
  code as group_code,
  name,
  parent_id,
  LOWER(group_type) as nature,
  affects_gross_profit = '1' as affects_gross_profit,
  TRUE as is_system,
  NOW() as createdAt,
  NOW() as updatedAt
FROM old_finvera_db.account_groups
WHERE code NOT IN (SELECT group_code FROM finvera_master.account_groups);
```

This will copy all account groups from your old database to the new master database in one go!
