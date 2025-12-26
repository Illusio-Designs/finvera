# Railway Environment Variables Migration Guide

## 📋 Complete Environment Variables Setup for Railway

This guide shows you how to migrate ALL environment variables from your cPanel setup to Railway.

---

## Step 1: MySQL Database Connection

### Option A: Use MYSQL_URL (Recommended - Easiest)

```env
MYSQL_URL=${{MySQL.MYSQL_URL}}
```

**That's it!** This one variable replaces all individual DB variables.

### Option B: Individual Variables (Alternative)

If you prefer individual variables:

```env
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_ROOT_USER=${{MySQL.MYSQLUSER}}
DB_ROOT_PASSWORD=${{MySQL.MYSQLPASSWORD}}
```

---

## Step 2: Copy All Other Variables from cPanel

Go through your cPanel environment variables and copy them to Railway. Here's a complete checklist:

### Application Configuration

```env
NODE_ENV=production
PORT=3000
APP_NAME=Finvera
LOG_LEVEL=info
```

### Domain Configuration

```env
MAIN_DOMAIN=finvera.solutions
API_DOMAIN=api.finvera.solutions
FRONTEND_URL=https://client.finvera.solutions
CORS_ORIGIN=https://finvera.solutions,https://www.finvera.solutions,https://client.finvera.solutions,https://admin.finvera.solutions
```

### Database Names (if using MYSQL_URL)

```env
MASTER_DB_NAME=finvera_master
DB_NAME=finvera_db
```

### JWT & Authentication

```env
JWT_SECRET=<copy-from-cpanel>
JWT_EXPIRES_IN=7d
SESSION_SECRET=<copy-from-cpanel>
```

### Google OAuth (if using)

```env
GOOGLE_CLIENT_ID=<copy-from-cpanel>
GOOGLE_CLIENT_SECRET=<copy-from-cpanel>
GOOGLE_CALLBACK_URL=https://your-railway-url.railway.app/api/auth/google/callback
```

### Razorpay (if using)

```env
RAZORPAY_KEY_ID=<copy-from-cpanel>
RAZORPAY_KEY_SECRET=<copy-from-cpanel>
RAZORPAY_WEBHOOK_SECRET=<copy-from-cpanel>
```

### Redis (if using - Railway has Redis addon)

```env
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
```

Or if you have external Redis:

```env
REDIS_HOST=<copy-from-cpanel>
REDIS_PORT=6379
REDIS_PASSWORD=<copy-from-cpanel>
```

### File Uploads

```env
UPLOADS_DIR=./uploads
NEXT_PUBLIC_UPLOADS_BASE_URL=https://your-railway-url.railway.app/uploads
```

### Email Configuration (if using)

```env
SMTP_HOST=<copy-from-cpanel>
SMTP_PORT=<copy-from-cpanel>
SMTP_USER=<copy-from-cpanel>
SMTP_PASSWORD=<copy-from-cpanel>
SMTP_FROM=<copy-from-cpanel>
```

### E-Invoice & E-Way Bill (if using)

```env
EINVOICE_USERNAME=<copy-from-cpanel>
EINVOICE_PASSWORD=<copy-from-cpanel>
EINVOICE_API_URL=<copy-from-cpanel>
EWAYBILL_USERNAME=<copy-from-cpanel>
EWAYBILL_PASSWORD=<copy-from-cpanel>
EWAYBILL_API_URL=<copy-from-cpanel>
```

### Other Service URLs

```env
API_BASE_URL=https://your-railway-url.railway.app
FRONTEND_BASE_URL=https://your-frontend.vercel.app
```

---

## Step 3: How to Copy Variables from cPanel

1. **Access cPanel Environment Variables**
   - Log into your cPanel
   - Find where environment variables are stored (usually in application settings or .env file)

2. **For Each Variable:**
   - Copy the variable name
   - Copy the variable value
   - Add it to Railway Variables tab

3. **Important Notes:**
   - ✅ Keep the same variable names
   - ✅ Keep the same values (except for URLs that need to change)
   - ✅ Update URLs to point to Railway/your new domains
   - ✅ Don't copy sensitive values here - use Railway's secure variable storage

---

## Step 4: Railway-Specific Updates

Some variables need to be updated for Railway:

### URLs That Need Updating

```env
# OLD (cPanel)
API_DOMAIN=api.finvera.solutions
FRONTEND_URL=https://client.finvera.solutions

# NEW (Railway) - Update to your Railway URL
API_DOMAIN=your-app.railway.app
FRONTEND_URL=https://your-frontend.vercel.app

# OAuth Callback URLs
GOOGLE_CALLBACK_URL=https://your-app.railway.app/api/auth/google/callback

# Webhook URLs (if using)
RAZORPAY_WEBHOOK_URL=https://your-app.railway.app/api/webhooks/razorpay
```

### File Upload URLs

```env
# Update to your Railway URL
NEXT_PUBLIC_UPLOADS_BASE_URL=https://your-app.railway.app/uploads
```

---

## Step 5: Complete Variable Checklist

Use this checklist to ensure you've migrated everything:

### Database ✅
- [ ] `MYSQL_URL` OR individual DB variables
- [ ] `MASTER_DB_NAME`
- [ ] `DB_NAME`
- [ ] `DB_ROOT_USER` (if using individual variables)
- [ ] `DB_ROOT_PASSWORD` (if using individual variables)

### Application ✅
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `APP_NAME`
- [ ] `LOG_LEVEL`

### Domains & URLs ✅
- [ ] `MAIN_DOMAIN`
- [ ] `API_DOMAIN` (update to Railway URL)
- [ ] `FRONTEND_URL` (update to your frontend URL)
- [ ] `CORS_ORIGIN`
- [ ] `API_BASE_URL` (update to Railway URL)
- [ ] `FRONTEND_BASE_URL` (update to frontend URL)

### Security ✅
- [ ] `JWT_SECRET`
- [ ] `JWT_EXPIRES_IN`
- [ ] `SESSION_SECRET`

### OAuth ✅
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_CALLBACK_URL` (update to Railway URL)

### Payment Gateway ✅
- [ ] `RAZORPAY_KEY_ID`
- [ ] `RAZORPAY_KEY_SECRET`
- [ ] `RAZORPAY_WEBHOOK_SECRET`
- [ ] `RAZORPAY_WEBHOOK_URL` (update to Railway URL)

### Redis ✅
- [ ] `REDIS_HOST` (use `${{Redis.REDIS_HOST}}` if Railway Redis)
- [ ] `REDIS_PORT`
- [ ] `REDIS_PASSWORD` (use `${{Redis.REDIS_PASSWORD}}` if Railway Redis)

### File Uploads ✅
- [ ] `UPLOADS_DIR=./uploads`
- [ ] `NEXT_PUBLIC_UPLOADS_BASE_URL` (update to Railway URL)

### Email ✅
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASSWORD`
- [ ] `SMTP_FROM`

### E-Invoice & E-Way Bill ✅
- [ ] `EINVOICE_USERNAME`
- [ ] `EINVOICE_PASSWORD`
- [ ] `EINVOICE_API_URL`
- [ ] `EWAYBILL_USERNAME`
- [ ] `EWAYBILL_PASSWORD`
- [ ] `EWAYBILL_API_URL`

### Other Services ✅
- [ ] Any other custom variables from your cPanel

---

## Step 6: Quick Migration Script

1. **Export from cPanel:**
   - Copy all variables from cPanel (usually in `.env` file or environment settings)

2. **Format for Railway:**
   - Each line should be: `VARIABLE_NAME=value`
   - For Railway service references: `VARIABLE_NAME=${{ServiceName.VARIABLENAME}}`

3. **Add to Railway:**
   - Go to Railway project → Backend service → Variables tab
   - Click "New Variable" for each one
   - Or use Railway CLI: `railway variables set KEY=value`

---

## Step 7: Verify After Migration

After setting all variables:

1. ✅ Check Railway logs for any missing variable errors
2. ✅ Test database connection
3. ✅ Test API endpoints
4. ✅ Verify OAuth callbacks work
5. ✅ Check file uploads work
6. ✅ Test payment webhooks (if applicable)

---

## Common Issues

### Variables Not Working
- ✅ Check spelling (case-sensitive)
- ✅ Verify Railway variable reference syntax: `${{ServiceName.Variable}}`
- ✅ Ensure service names match exactly

### URLs Not Updated
- ✅ Update all callback URLs to Railway domain
- ✅ Update webhook URLs to Railway domain
- ✅ Update frontend API URL to Railway domain

### Database Connection Issues
- ✅ Use `MYSQL_URL=${{MySQL.MYSQL_URL}}` (easiest)
- ✅ Or verify all individual DB variables are set correctly

---

## Need Help?

If you're missing a variable:
1. Check your cPanel `.env` file
2. Check Railway logs for error messages
3. Compare with `backend/.env.example` for required variables

