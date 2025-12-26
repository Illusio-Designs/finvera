# Railway MySQL URL Setup (Recommended)

## ✅ Easy Method: Use MYSQL_URL

Railway provides a `MYSQL_URL` connection string that makes setup much easier!

---

## Step 1: Add MySQL Database

1. In Railway project, click **"New"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway creates MySQL service automatically

---

## Step 2: Set Environment Variable

Go to your **backend service** → **Variables** tab:

### Add this ONE variable:

```env
MYSQL_URL=${{MySQL.MYSQL_URL}}
```

That's it! The code will automatically:
- Parse the connection string
- Use the correct database names
- Handle all connection details

---

## How It Works

Railway's `MYSQL_URL` format:
```
mysql://user:password@host:port/database
```

The code automatically:
1. Parses the URL
2. Replaces the database name with the correct one:
   - Main DB: `finvera_db` (or `DB_NAME` env var)
   - Master DB: `finvera_master` (or `MASTER_DB_NAME` env var)
3. Connects to MySQL

---

## Other Required Variables

You still need these (but NOT the individual DB_* variables):

```env
# MySQL Connection (ONE variable!)
MYSQL_URL=${{MySQL.MYSQL_URL}}

# Database Names (optional - has defaults)
DB_NAME=finvera_db
MASTER_DB_NAME=finvera_master

# Server
NODE_ENV=production
PORT=3000

# JWT & Security
JWT_SECRET=<your-secret>
JWT_EXPIRES_IN=7d
SESSION_SECRET=<your-secret>

# CORS
CORS_ORIGIN=https://your-frontend.vercel.app

# File Uploads
UPLOADS_DIR=./uploads

# Other variables from .env.example
```

---

## Benefits of MYSQL_URL

✅ **Simpler**: One variable instead of 5  
✅ **Less error-prone**: Railway handles the connection string  
✅ **Automatic**: No need to manually set host, port, user, password  
✅ **Railway's recommended method**

---

## Troubleshooting

### Still getting "ECONNREFUSED ::1:3306"
- ✅ Check that `MYSQL_URL` is set (not empty)
- ✅ Verify MySQL service is running
- ✅ Check variable reference: `${{MySQL.MYSQL_URL}}`
- ✅ Ensure MySQL service name matches (case-sensitive)

### Variables not resolving
- ✅ Ensure MySQL service is in the same project
- ✅ Check service name spelling: `MySQL` (capital M, capital SQL)
- ✅ Use exact format: `${{MySQL.MYSQL_URL}}`

---

## Alternative: Individual Variables (if MYSQL_URL doesn't work)

If for some reason `MYSQL_URL` doesn't work, you can still use individual variables:

```env
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
```

But `MYSQL_URL` is recommended and simpler!

