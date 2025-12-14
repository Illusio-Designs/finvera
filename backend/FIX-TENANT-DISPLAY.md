# Fix: Tenant Not Displaying in Admin

## Issue
- API returns 200 OK
- But no tenants show in admin panel
- **Root Cause:** MySQL connection refused / Database not connected

## Quick Fix

### 1. Start MySQL Server

**macOS:**
```bash
# Start MySQL
brew services start mysql

# Or if installed via DMG:
sudo /usr/local/mysql/support-files/mysql.server start
```

**Linux:**
```bash
sudo systemctl start mysql
# or
sudo service mysql start
```

**Windows:**
```bash
net start MySQL
```

### 2. Verify MySQL is Running

```bash
mysql -u root -p
# Enter password when prompted
# If you can connect, MySQL is running!
```

### 3. Check Database Credentials

Your `.env` file should have:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=finvera_db
MASTER_DB_NAME=finvera_master
```

### 4. Restart Backend Server

```bash
cd backend
npm start
```

**You should see:**
```
✅ Master database initialized: finvera_master
✅ Database initialized: finvera_db
✓ System tenant created in master database
✓ Platform Admin User Created
```

### 5. Test Tenant API

```bash
# In another terminal
curl http://localhost:3000/api/admin/tenants?page=1&limit=20
```

**Expected response:**
```json
{
  "data": [
    {
      "id": "...",
      "company_name": "System",
      "subdomain": "system",
      "email": "system@finvera.com",
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## If Still Not Working

### Check MySQL Status

```bash
# macOS
brew services list | grep mysql

# Linux
sudo systemctl status mysql

# Windows
sc query MySQL
```

### Check MySQL Port

```bash
# See if MySQL is listening on port 3306
netstat -an | grep 3306
# or
lsof -i :3306
```

### Check Database Connection

```bash
cd backend
node test-tenants.js
```

This will show:
- If tenants exist in database
- If API is responding
- Any connection errors

---

## Frontend Display Issue

If backend works but frontend doesn't show tenants:

### Create Tenant List Component

**File:** `frontend/pages/admin/tenants/index.jsx`
```javascript
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/admin/tenants?page=1&limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tenants');
      }

      const result = await response.json();
      setTenants(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading tenants...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  if (tenants.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Tenants</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p>No tenants found</p>
          <p className="text-sm text-gray-600 mt-2">
            Make sure the backend server is running and seeders have executed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tenants</h1>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Subdomain
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Plan
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {tenant.company_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {tenant.subdomain}.finvera.com
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{tenant.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      tenant.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {tenant.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tenant.subscription_plan || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total: {tenants.length} tenant(s)
      </div>
    </div>
  );
}
```

---

## Checklist

- [ ] MySQL server is running
- [ ] Database credentials in `.env` are correct
- [ ] Backend server starts without errors
- [ ] Seeders ran successfully (check logs)
- [ ] API endpoint returns data: `curl http://localhost:3000/api/admin/tenants`
- [ ] Frontend component exists and fetches data
- [ ] Authentication token is valid

---

## Common Errors

### 1. "Connection refused"
- MySQL not running
- **Fix:** Start MySQL server

### 2. "Access denied for user"
- Wrong MySQL credentials
- **Fix:** Update `DB_USER` and `DB_PASSWORD` in `.env`

### 3. "Unknown database"
- Database doesn't exist
- **Fix:** Server will create it on startup (`npm start`)

### 4. "Cannot read properties of undefined"
- Model not loaded properly
- **Fix:** Check imports in `adminController.js`

### 5. "401 Unauthorized"
- Invalid or missing auth token
- **Fix:** Login first to get valid token

---

## Success Indicators

✅ **Backend logs show:**
```
✓ System tenant created in master database
✓ Platform Admin User Created
🚀 Server running on port 3000
```

✅ **API returns:**
```json
{
  "data": [...tenants...],
  "pagination": {...}
}
```

✅ **Frontend shows:**
- Tenant list with System tenant
- Company name, subdomain, email, status

---

## Next Steps

1. Start MySQL
2. Update `.env` with correct credentials
3. Run `npm start` in backend
4. Check API works: `curl http://localhost:3000/api/admin/tenants`
5. Create frontend tenant list page
6. Login and view tenants

Your tenants should now display! 🎉
