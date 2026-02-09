# 🚀 Deployment Documentation

Complete guide to all deployment files and options.

---

## 📁 Deployment Files Overview

```
backend/
├── railway.json                    # Railway configuration
├── .railwayignore                  # Files to exclude from Railway
├── Procfile                        # Process definition for Railway
├── .env.railway.example            # Environment variables template
├── QUICK_START_RAILWAY.md          # 10-minute quick start guide
├── RAILWAY_DEPLOY.md               # Detailed Railway deployment guide
├── RAILWAY_MIGRATION_GUIDE.md      # Migration to Oracle Cloud guide
├── scripts/
│   ├── railway-postdeploy.js       # Post-deployment setup script
│   └── check-railway-storage.js    # Storage monitoring script
└── .github/
    └── workflows/
        └── railway-deploy.yml      # GitHub Actions workflow
```

---

## 🎯 Choose Your Deployment Path

### Option 1: Quick Start (10 minutes) ⚡
**Best for:** Getting started quickly, testing

**Follow:** `QUICK_START_RAILWAY.md`

**What you get:**
- Backend live in 10 minutes
- MySQL + Redis included
- Auto-deploy from GitHub
- Free for small usage

---

### Option 2: Full Deployment (30 minutes) 📚
**Best for:** Production deployment, understanding everything

**Follow:** `RAILWAY_DEPLOY.md`

**What you get:**
- Complete setup with all features
- Custom domain configuration
- Monitoring and alerts
- Database migrations
- Security best practices

---

### Option 3: Migration to Oracle (3-4 hours) 🔄
**Best for:** When Railway storage limit reached, need more control

**Follow:** `RAILWAY_MIGRATION_GUIDE.md`

**What you get:**
- 200GB storage (vs 1GB)
- Forever free hosting
- Full server control
- Unlimited tenants

---

## 📋 File Descriptions

### `railway.json`
Railway platform configuration:
- Build settings
- Start command
- Health check endpoint
- Restart policy

**When to modify:**
- Change build command
- Adjust health check timeout
- Modify restart behavior

---

### `.railwayignore`
Files excluded from Railway deployment:
- node_modules (reinstalled on Railway)
- .env files (set in dashboard)
- Development files
- Test files
- Documentation

**When to modify:**
- Add files to exclude
- Include specific files

---

### `Procfile`
Process definition for Railway:
```
web: node --max-old-space-size=512 --expose-gc server.js
```

**When to modify:**
- Change memory limits
- Add process flags
- Run different command

---

### `.env.railway.example`
Template for environment variables:
- Database configuration
- JWT secrets
- Redis settings
- CORS origins
- API keys

**How to use:**
1. Copy values to Railway dashboard
2. Generate secrets
3. Update with your domains

---

### `scripts/railway-postdeploy.js`
Runs after deployment:
- Checks database connection
- Runs migrations
- Runs seeders (non-production)
- Verifies environment variables
- Displays deployment summary

**When it runs:**
- Automatically after each deployment
- Can run manually: `npm run railway:postdeploy`

---

### `scripts/check-railway-storage.js`
Monitors database storage:
- Shows all database sizes
- Calculates total usage
- Warns at 80% capacity
- Critical alert at 90%
- Provides recommendations

**How to use:**
```bash
npm run railway:check-storage
```

**When to run:**
- Weekly for monitoring
- Before adding many tenants
- When approaching storage limits

---

### `.github/workflows/railway-deploy.yml`
GitHub Actions workflow:
- Triggers on push to main
- Runs tests
- Checks syntax
- Notifies about deployment

**When it runs:**
- Automatically on git push
- Can trigger manually

---

## 🔧 Configuration Guide

### 1. Database Configuration

Railway auto-provides these variables:
```bash
MYSQLHOST
MYSQLPORT
MYSQLUSER
MYSQLPASSWORD
MYSQLDATABASE
MYSQL_URL
```

Your app uses:
```bash
DB_HOST=${{MYSQLHOST}}
DB_PORT=${{MYSQLPORT}}
DB_USER=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}
DB_NAME=finvera_main
MASTER_DB_NAME=finvera_master
```

---

### 2. Redis Configuration

Railway auto-provides:
```bash
REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
REDIS_URL
```

Your app uses:
```bash
REDIS_ENABLED=true
REDIS_HOST=${{REDIS.REDIS_HOST}}
REDIS_PORT=${{REDIS.REDIS_PORT}}
REDIS_PASSWORD=${{REDIS.REDIS_PASSWORD}}
```

---

### 3. Security Configuration

**Required secrets:**
```bash
JWT_SECRET=<64-char-hex>
ENCRYPTION_KEY=<32-char-hex>
SESSION_SECRET=<32-char-hex>
```

**Generate with:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 4. CORS Configuration

**Update with your actual domains:**
```bash
CORS_ORIGIN=https://your-frontend.com,https://www.your-frontend.com
MAIN_DOMAIN=your-domain.com
FRONTEND_URL=https://your-frontend.com
```

**Examples:**
```bash
# Vercel deployment
CORS_ORIGIN=https://finvera.vercel.app,https://www.finvera.com
MAIN_DOMAIN=finvera.com
FRONTEND_URL=https://finvera.vercel.app

# Netlify deployment
CORS_ORIGIN=https://finvera.netlify.app,https://www.finvera.com
MAIN_DOMAIN=finvera.com
FRONTEND_URL=https://finvera.netlify.app
```

---

## 🚀 Deployment Workflow

### Initial Deployment

1. **Prepare code**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Create Railway project**
   - Follow `QUICK_START_RAILWAY.md` or `RAILWAY_DEPLOY.md`

3. **Configure environment**
   - Set all required variables
   - Generate secrets
   - Update CORS origins

4. **Deploy**
   - Railway auto-deploys on push
   - Monitor logs in dashboard

5. **Run migrations**
   ```bash
   # Option 1: Temporary start command
   # In Railway: Settings → Deploy → Custom Start Command
   npm run migrate && npm start
   
   # Option 2: Railway CLI
   railway run npm run migrate
   ```

6. **Test deployment**
   ```bash
   curl https://your-backend.railway.app/health
   ```

---

### Continuous Deployment

After initial setup:

1. **Make changes**
   ```bash
   # Edit code
   git add .
   git commit -m "Add new feature"
   git push origin main
   ```

2. **Railway auto-deploys**
   - Detects push
   - Builds app
   - Runs tests (if configured)
   - Deploys to production

3. **Monitor deployment**
   - Check Railway dashboard
   - View logs
   - Test endpoints

---

## 📊 Monitoring

### Storage Monitoring

**Check storage weekly:**
```bash
npm run railway:check-storage
```

**Output example:**
```
Database Name                    | Size (MB) | Tables | Status
--------------------------------|-----------|--------|----------
finvera_master                  |      2.45 |     12 | ✓ OK
finvera_main                    |      5.23 |     25 | ✓ OK
finvera_tenant_abc123           |     15.67 |     18 | ✓ OK
finvera_tenant_xyz789           |     12.34 |     18 | ✓ OK
--------------------------------|-----------|--------|----------
TOTAL                           |     35.69 |     73 |

Storage Summary:
   Total Used: 35.69 MB
   Limit: 1024 MB (Railway free tier)
   Remaining: 988.31 MB
   Usage: 3.5%

✅ Storage usage is healthy
```

---

### Application Monitoring

**Railway dashboard:**
- Deployments → View logs
- Metrics → CPU, Memory, Network
- Settings → Environment variables

**Health check:**
```bash
curl https://your-backend.railway.app/health
```

**API test:**
```bash
curl https://your-backend.railway.app/api
```

---

## 🔄 Scaling Strategy

### Phase 1: Railway Free Tier (0-30 tenants)
- **Storage:** 1GB
- **RAM:** 512MB
- **Cost:** $0-5/month
- **Action:** Monitor storage weekly

### Phase 2: Railway Paid Tier (30-100 tenants)
- **Storage:** 5GB+
- **RAM:** 1-2GB
- **Cost:** $10-30/month
- **Action:** Upgrade Railway plan

### Phase 3: Oracle Cloud (100+ tenants)
- **Storage:** 200GB
- **RAM:** 1-6GB
- **Cost:** $0/month (forever free)
- **Action:** Follow migration guide

---

## 🆘 Troubleshooting

### Common Issues

**1. "Cannot connect to database"**
```bash
# Check MySQL service is running
# Verify environment variables
# Check DB_HOST=${{MYSQLHOST}} syntax
```

**2. "CORS error"**
```bash
# Update CORS_ORIGIN with actual frontend URL
# Include both http and https
# Include www and non-www versions
```

**3. "Out of memory"**
```bash
# Reduce MAX_TENANT_CONNECTIONS to 20
# Check for memory leaks in logs
# Consider upgrading plan
```

**4. "Storage full"**
```bash
# Run: npm run railway:check-storage
# Delete unused tenant databases
# Archive old data
# Migrate to Oracle Cloud
```

---

## 📚 Additional Resources

### Railway Documentation
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

### Your Documentation
- Quick Start: `QUICK_START_RAILWAY.md`
- Full Guide: `RAILWAY_DEPLOY.md`
- Migration: `RAILWAY_MIGRATION_GUIDE.md`

### Support
- Railway Support: support@railway.app
- Community: Discord server

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Frontend domain known
- [ ] Secrets generated

### Deployment
- [ ] Railway project created
- [ ] MySQL database added
- [ ] Redis added (optional)
- [ ] Environment variables set
- [ ] Secrets configured
- [ ] CORS origins updated
- [ ] Backend deployed
- [ ] Domain generated

### Post-Deployment
- [ ] Health check passing
- [ ] API endpoints working
- [ ] Database migrations run
- [ ] Frontend connected
- [ ] Monitoring set up
- [ ] Storage check scheduled
- [ ] Documentation updated

---

## 🎉 Success!

Your backend is now deployed and ready for production!

**What's next:**
1. Test all features thoroughly
2. Monitor storage and performance
3. Set up alerts for critical metrics
4. Plan for scaling when needed
5. Keep documentation updated

---

**Questions?** Check the guides or Railway documentation!
