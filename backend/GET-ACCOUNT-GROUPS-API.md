# Your Account Groups - Complete List

## What You Have (19 Groups)

### Assets (7 groups)
| Code | Name | Affects P&L |
|------|------|-------------|
| `CA` | Current Assets | No |
| `CASH` | Cash-in-Hand | No |
| `BANK` | Bank Accounts | No |
| `SD` | Sundry Debtors | No |
| `FA` | Fixed Assets | No |
| `INV` | Stock-in-Hand | No |
| `LA` | Loans & Advances (Asset) | No |

### Liabilities (6 groups)
| Code | Name | Affects P&L |
|------|------|-------------|
| `CL` | Current Liabilities | No |
| `SC` | Sundry Creditors | No |
| `DT` | Duties & Taxes | No |
| `CAP` | Capital Account | No |
| `RES` | Reserves & Surplus | No |
| `LOAN` | Loans (Liability) | No |

### Income (3 groups)
| Code | Name | Affects Gross Profit |
|------|------|---------------------|
| `SAL` | Sales Accounts | ✅ Yes |
| `DIR_INC` | Direct Income | ✅ Yes |
| `IND_INC` | Indirect Income | No |

### Expenses (3 groups)
| Code | Name | Affects Gross Profit |
|------|------|---------------------|
| `PUR` | Purchase Accounts | ✅ Yes |
| `DIR_EXP` | Direct Expenses | ✅ Yes |
| `IND_EXP` | Indirect Expenses | No |

---

## Database Query

### Simple List
```sql
SELECT group_code, name, nature, affects_gross_profit 
FROM finvera_master.account_groups 
ORDER BY 
  CASE nature 
    WHEN 'asset' THEN 1 
    WHEN 'liability' THEN 2 
    WHEN 'income' THEN 3 
    WHEN 'expense' THEN 4 
  END,
  group_code;
```

### Full Details
```sql
SELECT * FROM finvera_master.account_groups;
```

### By Type
```sql
-- Get all asset groups
SELECT group_code, name FROM finvera_master.account_groups WHERE nature = 'asset';

-- Get all liability groups
SELECT group_code, name FROM finvera_master.account_groups WHERE nature = 'liability';

-- Get all income groups
SELECT group_code, name FROM finvera_master.account_groups WHERE nature = 'income';

-- Get all expense groups
SELECT group_code, name FROM finvera_master.account_groups WHERE nature = 'expense';
```

---

## How to Use in Your Application

### Backend (Node.js)

Create an API endpoint to fetch account groups:

**File:** `backend/src/routes/accountGroupRoutes.js`
```javascript
const express = require('express');
const router = express.Router();
const masterModels = require('../models/masterModels');

// Get all account groups
router.get('/account-groups', async (req, res) => {
  try {
    const groups = await masterModels.AccountGroup.findAll({
      order: [
        ['nature', 'ASC'],
        ['group_code', 'ASC']
      ],
      attributes: ['id', 'group_code', 'name', 'nature', 'affects_gross_profit']
    });

    // Group by nature for easier frontend use
    const grouped = {
      asset: groups.filter(g => g.nature === 'asset'),
      liability: groups.filter(g => g.nature === 'liability'),
      income: groups.filter(g => g.nature === 'income'),
      expense: groups.filter(g => g.nature === 'expense'),
    };

    res.json({
      success: true,
      data: {
        all: groups,
        grouped: grouped,
        total: groups.length
      }
    });
  } catch (error) {
    console.error('Error fetching account groups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account groups'
    });
  }
});

// Get account groups by nature
router.get('/account-groups/:nature', async (req, res) => {
  try {
    const { nature } = req.params;
    
    const groups = await masterModels.AccountGroup.findAll({
      where: { nature },
      order: [['group_code', 'ASC']],
      attributes: ['id', 'group_code', 'name', 'nature', 'affects_gross_profit']
    });

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account groups'
    });
  }
});

module.exports = router;
```

**Register the route in `server.js`:**
```javascript
const accountGroupRoutes = require('./src/routes/accountGroupRoutes');
app.use('/api', accountGroupRoutes);
```

---

### Frontend (React/Next.js)

**API Service:** `frontend/lib/api.js`
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const accountGroupAPI = {
  // Get all account groups
  getAll: async () => {
    const response = await fetch(`${API_URL}/account-groups`);
    if (!response.ok) throw new Error('Failed to fetch account groups');
    return response.json();
  },

  // Get account groups by nature
  getByNature: async (nature) => {
    const response = await fetch(`${API_URL}/account-groups/${nature}`);
    if (!response.ok) throw new Error('Failed to fetch account groups');
    return response.json();
  },
};
```

**React Component Example:**
```javascript
import { useState, useEffect } from 'react';
import { accountGroupAPI } from '@/lib/api';

export default function AccountGroupSelector({ onChange, value, nature }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const result = nature 
          ? await accountGroupAPI.getByNature(nature)
          : await accountGroupAPI.getAll();
        
        setGroups(nature ? result.data : result.data.all);
      } catch (error) {
        console.error('Error fetching account groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [nature]);

  if (loading) return <div>Loading groups...</div>;

  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="form-select"
    >
      <option value="">Select Account Group</option>
      {groups.map((group) => (
        <option key={group.id} value={group.id}>
          {group.group_code} - {group.name}
        </option>
      ))}
    </select>
  );
}

// Usage in a form:
// <AccountGroupSelector 
//   nature="asset" 
//   value={formData.account_group_id}
//   onChange={(value) => setFormData({...formData, account_group_id: value})}
// />
```

---

## Test the Data

### Via MySQL
```bash
mysql -u root -p
```

```sql
USE finvera_master;

-- Count total groups
SELECT COUNT(*) as total FROM account_groups;
-- Should show: 19

-- View all groups
SELECT 
  group_code,
  name,
  nature,
  affects_gross_profit,
  is_system
FROM account_groups
ORDER BY 
  FIELD(nature, 'asset', 'liability', 'income', 'expense'),
  group_code;

-- Group by nature
SELECT 
  nature,
  COUNT(*) as count,
  GROUP_CONCAT(group_code ORDER BY group_code SEPARATOR ', ') as codes
FROM account_groups
GROUP BY nature;
```

### Via curl (after creating the API endpoint)
```bash
# Get all groups
curl http://localhost:3000/api/account-groups

# Get only asset groups
curl http://localhost:3000/api/account-groups/asset

# Get only income groups
curl http://localhost:3000/api/account-groups/income
```

---

## Expected JSON Response

```json
{
  "success": true,
  "data": {
    "all": [
      {
        "id": "uuid-here",
        "group_code": "BANK",
        "name": "Bank Accounts",
        "nature": "asset",
        "affects_gross_profit": false
      },
      {
        "id": "uuid-here",
        "group_code": "SAL",
        "name": "Sales Accounts",
        "nature": "income",
        "affects_gross_profit": true
      },
      // ... more groups
    ],
    "grouped": {
      "asset": [ /* 7 asset groups */ ],
      "liability": [ /* 6 liability groups */ ],
      "income": [ /* 3 income groups */ ],
      "expense": [ /* 3 expense groups */ ]
    },
    "total": 19
  }
}
```

---

## Usage in Ledger Creation

When creating a ledger, you'll reference the account group:

```javascript
// Frontend - Create Ledger Form
const createLedger = async (formData) => {
  const response = await fetch(`${API_URL}/ledgers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'HDFC Bank',
      account_group_id: 'uuid-of-bank-accounts-group', // References master.account_groups
      opening_balance: 50000,
      // ... other fields
    })
  });
};
```

```javascript
// Backend - Ledger Model (in tenant DB)
Ledger.create({
  name: 'HDFC Bank',
  account_group_id: 'uuid-from-master', // Stored as UUID, references finvera_master.account_groups
  opening_balance: 50000,
  // ... other fields
});
```

---

## Benefits of This Structure

✅ **Shared Across Tenants** - All tenants use the same standardized groups  
✅ **No Duplication** - One source of truth in master database  
✅ **Easy Updates** - Add new groups once, available to all tenants  
✅ **Consistent Reporting** - Same group structure across all tenants  
✅ **Your Old Data Preserved** - Exact same 19 groups with same codes  

---

## Summary

You now have:
- ✅ **19 account groups** (your old data)
- ✅ Located in `finvera_master.account_groups`
- ✅ Accessible via SQL queries
- ✅ Ready for API endpoints
- ✅ Can be used in ledger creation
- ✅ Shared across all tenants

Run this to see them:
```bash
mysql -u root -p -e "SELECT group_code, name, nature FROM finvera_master.account_groups ORDER BY group_code"
```
