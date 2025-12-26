# Railway Environment Variables Setup

## ⚠️ CRITICAL: The Error You're Seeing

```
connect ECONNREFUSED ::1:3306
```

This means:
- ❌ `DB_HOST` is not set → defaults to `localhost`
- ❌ Railway doesn't have MySQL on `localhost`
- ✅ You need to add MySQL service and set environment variables

---

## Step 1: Add MySQL Database in Railway

1. Go to your Railway project dashboard
2. Click **"New"** button
3. Select **"Database"** → **"Add MySQL"**
4. Railway will create a MySQL database service
5. **Note the service name** (e.g., "MySQL" or "mysql")

---

## Step 2: Set Environment Variables

Go to your **backend service** → **Variables** tab and add these:

### Database Variables (Use Railway's Variable References)

```env
# Database Connection (from Railway MySQL service)
# Replace "MySQL" with your actual MySQL service name
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}

# Master Database Name (optional, defaults to finvera_master)
MASTER_DB_NAME=finvera_master

# For tenant provisioning (use same MySQL user)
DB_ROOT_USER=${{MySQL.MYSQLUSER}}
DB_ROOT_PASSWORD=${{MySQL.MYSQLPASSWORD}}
```

**Important:** Railway uses `${{ServiceName.VariableName}}` syntax to reference other services.

### Server Variables

```env
NODE_ENV=production
PORT=3000
```

### JWT & Security

```env
JWT_SECRET=<generate-a-random-secret-here>
JWT_EXPIRES_IN=7d
SESSION_SECRET=<generate-a-random-secret-here>
```

### CORS

```env
CORS_ORIGIN=https://your-frontend.vercel.app
```

### File Uploads

```env
UPLOADS_DIR=./uploads
```

### Other Required Variables

Add all other variables from `backend/.env.example` that are required for your app.

---

## Step 3: Verify MySQL Service Name

If your MySQL service has a different name (not "MySQL"), adjust the variable references:

**Example:** If your MySQL service is named "mysql-db":
```env
DB_HOST=${{mysql-db.MYSQLHOST}}
DB_PORT=${{mysql-db.MYSQLPORT}}
DB_USER=${{mysql-db.MYSQLUSER}}
DB_PASSWORD=${{mysql-db.MYSQLPASSWORD}}
DB_NAME=${{mysql-db.MYSQLDATABASE}}
```

---

## Step 4: How to Find MySQL Variables in Railway

1. Click on your **MySQL service** in Railway
2. Go to **"Variables"** tab
3. You'll see variables like:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
4. Use these in the format: `${{ServiceName.VariableName}}`

---

## Step 5: Redeploy

After setting environment variables:
1. Railway will automatically redeploy
2. Or manually trigger deployment
3. Check logs to verify connection

---

## Troubleshooting

### Still getting "ECONNREFUSED ::1:3306"
- ✅ Check that `DB_HOST` is set (not empty)
- ✅ Verify MySQL service is running
- ✅ Check variable reference syntax: `${{MySQL.MYSQLHOST}}`
- ✅ Ensure MySQL service name matches in variable references

### "Access denied" errors
- ✅ Verify `DB_USER` and `DB_PASSWORD` are correct
- ✅ Check that MySQL service variables are accessible

### Variables not resolving
- ✅ Ensure MySQL service is in the same project
- ✅ Check service name spelling (case-sensitive)
- ✅ Use exact format: `${{ServiceName.VARIABLENAME}}`

---

## Quick Checklist

- [ ] MySQL database service added in Railway
- [ ] `DB_HOST` set to `${{MySQL.MYSQLHOST}}`
- [ ] `DB_PORT` set to `${{MySQL.MYSQLPORT}}`
- [ ] `DB_USER` set to `${{MySQL.MYSQLUSER}}`
- [ ] `DB_PASSWORD` set to `${{MySQL.MYSQLPASSWORD}}`
- [ ] `DB_NAME` set to `${{MySQL.MYSQLDATABASE}}`
- [ ] `DB_ROOT_USER` and `DB_ROOT_PASSWORD` set (same as above)
- [ ] All other required environment variables set
- [ ] Service redeployed

---

## Example: Complete Environment Variables List

```env
# Database
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
MASTER_DB_NAME=finvera_master
DB_ROOT_USER=${{MySQL.MYSQLUSER}}
DB_ROOT_PASSWORD=${{MySQL.MYSQLPASSWORD}}

# Server
NODE_ENV=production
PORT=3000

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Session
SESSION_SECRET=your-super-secret-session-key-here

# CORS
CORS_ORIGIN=https://your-frontend.vercel.app

# File Uploads
UPLOADS_DIR=./uploads

# Add other variables from .env.example as needed
```

