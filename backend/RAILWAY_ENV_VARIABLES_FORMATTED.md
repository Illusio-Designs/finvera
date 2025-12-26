# Railway Environment Variables - Ready to Copy

## 📋 Instructions

1. Go to Railway → Your Backend Service → Variables tab
2. Click "New Variable" for each variable below
3. Copy the variable name and value exactly as shown

---

## ✅ Variables to Add (Database variables removed - using MYSQL_URL instead)

### MySQL Connection (REQUIRED - Add this FIRST)

```
MYSQL_URL=${{MySQL.MYSQL_URL}}
```

---

### Application Configuration

```
NODE_ENV=production
PORT=8084
APP_NAME=Finvera
LOG_LEVEL=info
```

---

### Domain Configuration

```
MAIN_DOMAIN=https://finvera.solutions
API_DOMAIN=https://finvera.illusiodesigns.agency
FRONTEND_URL=https://finvera.solutions
```

---

### Database Names (Optional - but recommended)

```
MASTER_DB_NAME=informative_finvera_master
DB_NAME=informative_finvera
```

---

### Encryption & Security

```
ENCRYPTION_KEY=Devils@2609$
PAYLOAD_ENCRYPTION_KEY=Devils@2609$
JWT_SECRET=Devils@2609$
JWT_REFRESH_SECRET=Devils@2609$
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
SESSION_SECRET=Devils@2609$
```

---

### Google OAuth

```
GOOGLE_CLIENT_ID=1065810673450-6mntdfquhqtdjj6hvamkkc6ahekiknng.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://finvera.illusiodesigns.agency/api/auth/google/callback
```

---

### Razorpay (Empty - fill if needed)

```
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

---

### Email Configuration

```
EMAIL_ENABLED=false
EMAIL_FROM=noreply@finvera.solutions
```

---

### Redis Configuration

⚠️ **IMPORTANT:** Your `REDIS_HOST` is set to `6379` which is a PORT, not a hostname!

**Option 1: If using Railway Redis (Recommended)**
```
REDIS_ENABLED=true
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
```

**Option 2: If using external Redis**
```
REDIS_ENABLED=true
REDIS_HOST=your-redis-hostname-here
REDIS_PORT=6379
REDIS_PASSWORD=Devils@2609
```

---

### File Upload Configuration

```
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
MAX_DSC_CERTIFICATE_SIZE=5242880
```

---

### Multi-Tenant Configuration

```
USE_SEPARATE_DB_USERS=false
MAX_TENANT_CONNECTIONS=50
```

---

## ⚠️ Important Notes

1. **MYSQL_URL**: This ONE variable replaces all DB_* variables (DB_HOST, DB_USER, DB_PASSWORD, etc.)

2. **REDIS_HOST**: Your current value `6379` is incorrect (that's a port). Update to:
   - Railway Redis: `${{Redis.REDIS_HOST}}`
   - External Redis: Your actual Redis hostname

3. **URLs**: All URLs are kept as-is from your cPanel. If Railway gives you a different domain, update:
   - `API_DOMAIN` → Your Railway URL
   - `GOOGLE_CALLBACK_URL` → Update callback URL to Railway domain

4. **Empty Razorpay**: If you're not using Razorpay, you can leave these empty or remove them.

---

## 🚀 Quick Setup Steps

1. ✅ Add MySQL service in Railway
2. ✅ Add `MYSQL_URL=${{MySQL.MYSQL_URL}}` variable
3. ✅ Add all other variables from above
4. ✅ Fix `REDIS_HOST` (use Railway Redis or external hostname)
5. ✅ Deploy and test!

