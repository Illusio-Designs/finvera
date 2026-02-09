# 🚂 Railway Deployment Guide

Complete step-by-step guide to deploy your Finvera backend to Railway.app

---

## 📋 Prerequisites

- [ ] GitHub account
- [ ] Railway account (sign up at https://railway.app)
- [ ] Your code pushed to GitHub
- [ ] Frontend already deployed (you mentioned it's live)

---

## 🚀 Step 1: Create Railway Project

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Choose **"Deploy from GitHub repo"**
4. Select your repository: `your-username/finvera` (or your repo name)
5. Select the **backend** folder as the root directory
   - Click **"Configure"** → **"Root Directory"** → Enter: `backend`

---

## 🗄️ Step 2: Add MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway will automatically:
   - Create a MySQL instance
   - Generate credentials
   - Set environment variables:
     - `MYSQLHOST`
     - `MYSQLPORT`
     - `MYSQLUSER`
     - `MYSQLPASSWORD`
     - `MYSQLDATABASE`
     - `MYSQL_URL`

**✅ MySQL is now ready!**

---

## 🔴 Step 3: Add Redis (Optional but Recommended)

1. Click **"+ New"** again
2. Select **"Database"** → **"Add Redis"**
3. Railway will automatically set:
   - `REDIS_HOST`
   - `REDIS_PORT`
   - `REDIS_PASSWORD`
   - `REDIS_URL`

**✅ Redis is now ready!**

---

## ⚙️ Step 4: Configure Environment Variables

1. Click on your **backend service** (not the database)
2. Go to **"Variables"** tab
3. Click **"RAW Editor"**
4. Copy and paste these variables:

```bash
# Node Environment
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration (Railway auto-provides MYSQL vars)
DB_HOST=${{MYSQLHOST}}
DB_PORT=${{MYSQLPORT}}
DB_USER=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}
DB_NAME=finvera_main
MASTER_DB_NAME=finvera_master
DATABASE_URL=${{MYSQL_URL}}

# IMPORTANT: Generate these secrets!
# Run in terminal: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=REPLACE_WITH_GENERATED_SECRET_MIN_64_CHARS
ENCRYPTION_KEY=REPLACE_WITH_GENERATED_SECRET_MIN_32_CHARS

# Redis Configuration (if you added Redis)
REDIS_ENABLED=true
REDIS_HOST=${{REDIS.REDIS_HOST}}
REDIS_PORT=${{REDIS.REDIS_PORT}}
REDIS_PASSWORD=${{REDIS.REDIS_PASSWORD}}

# Tenant Connection Pool (Railway free tier limit)
MAX_TENANT_CONNECTIONS=30
USE_SEPARATE_DB_USERS=false

# CORS - IMPORTANT: Replace with your actual frontend domain!
CORS_ORIGIN=https://your-frontend-domain.com,https://www.your-frontend-domain.com
MAIN_DOMAIN=your-domain.com
FRONTEND_URL=https://your-frontend-domain.com
NEXT_PUBLIC_MAIN_DOMAIN=your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Session
SESSION_SECRET=REPLACE_WITH_RANDOM_SECRET

# Logging
LOG_LEVEL=info

# Optional: Payment Gateway (Razorpay)
# RAZORPAY_KEY_ID=your_key_id
# RAZORPAY_KEY_SECRET=your_key_secret
# RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Optional: GST API (Sandbox)
# SANDBOX_API_BASE_URL=https://api.sandbox.co.in
# SANDBOX_API_KEY=your_api_key

# Optional: E-Invoice
# IRP_BASE_URL=https://gsp.adaequare.com
# IRP_CLIENT_ID=your_client_id
# IRP_CLIENT_SECRET=your_client_secret

# Optional: E-Way Bill
# EWAY_BASE_URL=https://api.mastergst.com/ewaybillapi/v1.03
# EWAY_USERNAME=your_username
# EWAY_PASSWORD=your_password
```

5. Click **"Save"**

---

## 🔐 Step 5: Generate Secrets

**CRITICAL: Generate strong secrets!**

Run these commands in your local terminal:

```bash
# Generate JWT Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Encryption Key (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Session Secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated values and replace in Railway variables:
- `JWT_SECRET` → paste first generated value
- `ENCRYPTION_KEY` → paste second generated value
- `SESSION_SECRET` → paste third generated value

---

## 🌐 Step 6: Update CORS Origins

In Railway variables, update these with your **actual frontend domain**:

```bash
CORS_ORIGIN=https://your-actual-frontend.com,https://www.your-actual-frontend.com
MAIN_DOMAIN=your-actual-domain.com
FRONTEND_URL=https://your-actual-frontend.com
```

**Example:**
```bash
CORS_ORIGIN=https://finvera.vercel.app,https://www.finvera.com
MAIN_DOMAIN=finvera.com
FRONTEND_URL=https://finvera.vercel.app
```

---

## 🚀 Step 7: Deploy!

1. Railway will automatically deploy after you save variables
2. Watch the deployment logs in the **"Deployments"** tab
3. Wait for the build to complete (2-5 minutes)

**Look for these success messages:**
```
✓ Database connection established
✓ Master database ready
✓ Server running on 0.0.0.0:3000
✓ Health: http://localhost:3000/health
```

---

## 🔗 Step 8: Get Your Backend URL

1. Go to **"Settings"** tab in your backend service
2. Scroll to **"Domains"**
3. Click **"Generate Domain"**
4. Railway will give you a URL like: `https://finvera-backend-production.up.railway.app`

**✅ Copy this URL - you'll need it for your frontend!**

---

## 🧪 Step 9: Test Your Deployment

Test the health endpoint:

```bash
curl https://your-backend-url.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-02-08T..."
}
```

Test the API:
```bash
curl https://your-backend-url.railway.app/api
```

---

## 🔄 Step 10: Run Database Migrations

Railway doesn't automatically run migrations. You have two options:

### Option A: One-Time Command (Recommended)

1. In Railway dashboard, click your backend service
2. Go to **"Settings"** → **"Deploy"**
3. Scroll to **"Custom Start Command"**
4. Temporarily change to: `npm run migrate && npm start`
5. Wait for deployment
6. Change back to: `npm start`

### Option B: Railway CLI (Advanced)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npm run migrate

# Run seeders
railway run npm run seed
```

---

## 📱 Step 11: Update Frontend Configuration

Update your frontend to use the new Railway backend URL:

**In your frontend `.env` or config:**
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
# or
REACT_APP_API_URL=https://your-backend-url.railway.app/api
```

---

## 🎉 Step 12: Verify Everything Works

Test these endpoints:

1. **Health Check:**
   ```
   GET https://your-backend-url.railway.app/health
   ```

2. **API Root:**
   ```
   GET https://your-backend-url.railway.app/api
   ```

3. **Login (if you have test user):**
   ```
   POST https://your-backend-url.railway.app/api/auth/login
   Body: { "email": "rishi@finvera.com", "password": "Rishi@1995" }
   ```

---

## 📊 Step 13: Monitor Your Deployment

### Check Logs
1. Go to **"Deployments"** tab
2. Click on the latest deployment
3. View real-time logs

### Check Metrics
1. Go to **"Metrics"** tab
2. Monitor:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request count

### Check Database
1. Click on your MySQL service
2. Go to **"Metrics"** tab
3. Monitor storage usage (free tier = 1GB)

---

## ⚠️ Important Notes

### Storage Monitoring
Railway free tier includes **1GB MySQL storage**. Monitor usage:

1. In Railway, click MySQL service
2. Check **"Metrics"** → **"Disk Usage"**
3. Set up alerts when approaching 800MB

**When to upgrade:**
- Storage > 800MB
- More than 30-50 tenants
- High traffic (>10K requests/day)

### Connection Limits
Railway MySQL free tier: **100 concurrent connections**

Your configuration:
- Main DB pool: 3 connections
- Tenant pools: 30 cached connections
- Total: ~33 connections (well within limit)

### Memory Limits
Railway free tier: **512MB RAM**

Your configuration:
- Node.js: `--max-old-space-size=512`
- Optimized for Railway's limits

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to database"
**Solution:**
1. Check MySQL service is running
2. Verify environment variables are set
3. Check `DB_HOST=${{MYSQLHOST}}` syntax is correct

### Issue: "Port already in use"
**Solution:**
- Railway automatically assigns PORT
- Make sure your code uses `process.env.PORT`
- Check `server.js` has: `const PORT = process.env.PORT || 3000`

### Issue: "CORS error from frontend"
**Solution:**
1. Update `CORS_ORIGIN` in Railway variables
2. Include both `https://` and `http://` versions
3. Include `www` and non-`www` versions

### Issue: "Out of memory"
**Solution:**
1. Reduce `MAX_TENANT_CONNECTIONS` to 20
2. Check for memory leaks in logs
3. Consider upgrading Railway plan

### Issue: "Database migrations not running"
**Solution:**
- Use Option A from Step 10
- Or use Railway CLI to run manually

---

## 💰 Cost Monitoring

### Free Tier Limits
- **$5 credit/month** (~500 hours)
- **1GB MySQL storage**
- **100GB bandwidth**

### Usage Estimation
- **Small usage** (0-10 tenants): $0-2/month
- **Medium usage** (10-30 tenants): $2-5/month
- **High usage** (30-50 tenants): $5-10/month

### When to Upgrade
- Storage > 900MB
- Credit runs out
- Need more than 512MB RAM
- Need custom domains

---

## 🔄 Continuous Deployment

Railway automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main

# Railway automatically:
# 1. Detects the push
# 2. Builds your app
# 3. Runs tests (if configured)
# 4. Deploys to production
# 5. Shows logs in dashboard
```

---

## 🎯 Next Steps

1. ✅ Set up custom domain (Railway Settings → Domains)
2. ✅ Configure SSL certificate (automatic with custom domain)
3. ✅ Set up monitoring alerts
4. ✅ Configure backup strategy
5. ✅ Test all API endpoints
6. ✅ Load test with expected traffic
7. ✅ Document API for frontend team

---

## 📞 Support

### Railway Support
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

### Common Commands
```bash
# View logs
railway logs

# Run command in Railway environment
railway run <command>

# Open Railway dashboard
railway open

# Check service status
railway status
```

---

## 🎉 Congratulations!

Your backend is now live on Railway! 🚀

**Your deployment:**
- ✅ Backend API running
- ✅ MySQL database provisioned
- ✅ Redis cache (optional)
- ✅ Auto-deploy from GitHub
- ✅ HTTPS enabled
- ✅ Monitoring active

**Next:** Update your frontend to use the new backend URL and test everything!

---

## 📝 Checklist

- [ ] Railway account created
- [ ] GitHub repo connected
- [ ] MySQL database added
- [ ] Redis added (optional)
- [ ] Environment variables configured
- [ ] Secrets generated and set
- [ ] CORS origins updated
- [ ] Backend deployed successfully
- [ ] Health check passing
- [ ] Database migrations run
- [ ] Frontend updated with new API URL
- [ ] All endpoints tested
- [ ] Monitoring set up

---

**Need help?** Check the troubleshooting section or Railway's documentation!
