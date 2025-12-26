# Railway Environment Variables - Cleanup Guide

## ✅ Variables to KEEP (You have all of these - Good!)

### Required Variables:
- `MYSQL_URL` ✅ (This replaces DB_HOST, DB_USER, DB_PASSWORD, DB_PORT)
- `DB_NAME` ✅ (Still needed - database name)
- `MASTER_DB_NAME` ✅ (Still needed - master database name)
- `NODE_ENV` ✅
- `PORT` ✅

### Application:
- `APP_NAME` ✅
- `LOG_LEVEL` ✅

### Domains:
- `MAIN_DOMAIN` ✅
- `API_DOMAIN` ✅
- `FRONTEND_URL` ✅
- `CORS_ORIGIN` ✅

### Security:
- `ENCRYPTION_KEY` ✅
- `PAYLOAD_ENCRYPTION_KEY` ✅
- `JWT_SECRET` ✅
- `JWT_REFRESH_SECRET` ✅
- `JWT_EXPIRES_IN` ✅
- `JWT_REFRESH_EXPIRES_IN` ✅
- `SESSION_SECRET` ✅

### OAuth:
- `GOOGLE_CLIENT_ID` ✅
- `GOOGLE_CLIENT_SECRET` ✅
- `GOOGLE_CALLBACK_URL` ✅

### Payment:
- `RAZORPAY_KEY_ID` ✅
- `RAZORPAY_KEY_SECRET` ✅
- `RAZORPAY_WEBHOOK_SECRET` ✅

### Email:
- `EMAIL_ENABLED` ✅
- `EMAIL_FROM` ✅

### Redis:
- `REDIS_ENABLED` ✅
- `REDIS_HOST` ⚠️ (Check if this is `${{Redis.REDIS_HOST}}` or actual hostname)
- `REDIS_PORT` ✅
- `REDIS_PASSWORD` ✅

### File Uploads:
- `UPLOAD_DIR` ✅
- `MAX_FILE_SIZE` ✅
- `MAX_DSC_CERTIFICATE_SIZE` ✅

### Multi-Tenant:
- `USE_SEPARATE_DB_USERS` ✅
- `MAX_TENANT_CONNECTIONS` ✅

---

## ❌ Variables to REMOVE (Redundant - MYSQL_URL replaces these)

Since you have `MYSQL_URL` set, these are **NOT NEEDED** and can cause confusion:

- `DB_HOST` ❌ Remove (MYSQL_URL contains host)
- `DB_USER` ❌ Remove (MYSQL_URL contains user)
- `DB_PASSWORD` ❌ Remove (MYSQL_URL contains password)
- `DB_PORT` ❌ Remove (MYSQL_URL contains port)
- `DB_ROOT_USER` ❌ Remove (Use same user from MYSQL_URL)
- `DB_ROOT_PASSWORD` ❌ Remove (Use same password from MYSQL_URL)

---

## ⚠️ Important Check: REDIS_HOST

If you're using Railway Redis service, make sure:
```
REDIS_HOST=${{Redis.REDIS_HOST}}
```

If you're using external Redis, keep the actual hostname.

---

## Summary

**You have everything set correctly!** 

Just remove the redundant DB variables:
- DB_HOST
- DB_USER  
- DB_PASSWORD
- DB_PORT
- DB_ROOT_USER
- DB_ROOT_PASSWORD

The code will use `MYSQL_URL` for all database connections.

