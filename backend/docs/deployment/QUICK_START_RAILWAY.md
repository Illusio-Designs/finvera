# ⚡ Quick Start: Deploy to Railway in 10 Minutes

The fastest way to get your backend live!

---

## 🎯 What You'll Get

- ✅ Backend API running on Railway
- ✅ MySQL database (1GB storage)
- ✅ Redis cache (optional)
- ✅ HTTPS enabled automatically
- ✅ Auto-deploy from GitHub
- ✅ Free for 0-50 tenants

---

## 📋 Prerequisites

- GitHub account with your code pushed
- Railway account (sign up at https://railway.app - free, no credit card)
- 10 minutes of your time

---

## 🚀 Step-by-Step (10 Minutes)

### 1️⃣ Create Railway Project (2 min)

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Click **"Deploy from GitHub repo"**
4. Select your repository
5. Click **"Add variables"** → Skip for now
6. Click **"Deploy"**

### 2️⃣ Add MySQL Database (1 min)

1. Click **"+ New"** in your project
2. Select **"Database"** → **"Add MySQL"**
3. Done! Railway auto-configures everything

### 3️⃣ Add Redis (1 min) - Optional

1. Click **"+ New"** again
2. Select **"Database"** → **"Add Redis"**
3. Done!

### 4️⃣ Configure Environment Variables (5 min)

1. Click your **backend service** (not database)
2. Go to **"Variables"** tab
3. Click **"RAW Editor"**
4. Paste this (replace the secrets):

```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

DB_HOST=${{MYSQLHOST}}
DB_PORT=${{MYSQLPORT}}
DB_USER=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}
DB_NAME=finvera_db
MASTER_DB_NAME=finvera_master

# IMPORTANT: Generate these!
JWT_SECRET=PASTE_GENERATED_SECRET_HERE
ENCRYPTION_KEY=PASTE_GENERATED_SECRET_HERE

REDIS_ENABLED=true
REDIS_HOST=${{REDIS.REDIS_HOST}}
REDIS_PORT=${{REDIS.REDIS_PORT}}
REDIS_PASSWORD=${{REDIS.REDIS_PASSWORD}}

MAX_TENANT_CONNECTIONS=30
USE_SEPARATE_DB_USERS=false

# Replace with your frontend domain!
CORS_ORIGIN=https://your-frontend.vercel.app
MAIN_DOMAIN=your-domain.com
FRONTEND_URL=https://your-frontend.vercel.app
```

5. Click **"Save"**

### 5️⃣ Generate Secrets (1 min)

Open terminal and run:

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the outputs and paste into Railway variables:
- First output → `JWT_SECRET`
- Second output → `ENCRYPTION_KEY`

### 6️⃣ Get Your Backend URL (30 sec)

1. Go to **"Settings"** tab
2. Scroll to **"Domains"**
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `https://finvera-backend-production.up.railway.app`)

### 7️⃣ Update Frontend (30 sec)

In your frontend `.env`:
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
```

Redeploy frontend.

### 8️⃣ Test It! (30 sec)

```bash
curl https://your-backend-url.railway.app/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-02-08T..."}
```

---

## ✅ Done!

Your backend is live! 🎉

**What's working:**
- ✅ API endpoints
- ✅ Database connections
- ✅ Redis caching
- ✅ HTTPS
- ✅ Auto-deploy

---

## 🔄 Next Steps

1. **Run migrations** (see full guide)
2. **Test all endpoints**
3. **Monitor storage usage**
4. **Set up custom domain** (optional)

---

## 📊 Monitor Your Usage

Check storage:
```bash
npm run railway:check-storage
```

View logs:
- Railway dashboard → Deployments → Click latest → View logs

---

## 💰 Cost

- **0-10 tenants**: $0/month (free credit)
- **10-30 tenants**: $2-5/month
- **30-50 tenants**: $5-10/month

---

## 🆘 Troubleshooting

**Issue: "Cannot connect to database"**
- Check MySQL service is running
- Verify `DB_HOST=${{MYSQLHOST}}` syntax

**Issue: "CORS error"**
- Update `CORS_ORIGIN` with your actual frontend URL
- Include both http and https

**Issue: "Out of memory"**
- Reduce `MAX_TENANT_CONNECTIONS` to 20
- Consider upgrading plan

---

## 📚 Full Documentation

For detailed setup, see: `RAILWAY_DEPLOY.md`

For migration to Oracle Cloud, see: `RAILWAY_MIGRATION_GUIDE.md`

---

**Need help?** Check Railway docs: https://docs.railway.app
