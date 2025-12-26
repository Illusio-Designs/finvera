# Railway CLI Setup Instructions

## ✅ Step 1: Login to Railway

You need to login to Railway CLI first. Run this command in your terminal:

```bash
railway login
```

This will open a browser window for authentication. Complete the login process.

## ✅ Step 2: Link Your Project

After logging in, link your project:

```bash
railway link -p 5d1de741-26b0-4fe0-9470-f4dfd58cf1be
```

## ✅ Step 3: Configure Root Directory

**IMPORTANT:** Since your project is a monorepo (has `backend/` and `frontend/` folders), you need to tell Railway to use the `backend/` directory.

### Option A: Via Railway Dashboard (Recommended)
1. Go to https://railway.app
2. Open your project
3. Click on your service
4. Go to **Settings** → **Source**
5. Set **Root Directory** to: `backend`
6. Save and redeploy

### Option B: Via Railway CLI
```bash
railway variables set RAILWAY_ROOT_DIRECTORY=backend
```

## ✅ Step 4: Add MySQL Database

1. In Railway dashboard, click **New** → **Database** → **Add MySQL**
2. Railway will create a MySQL database automatically
3. Note the connection details from the **Variables** tab

## ✅ Step 5: Set Environment Variables

In Railway dashboard → **Variables** tab, add these variables:

```env
# Database (use Railway's variable references)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}

# For tenant provisioning (use same MySQL user)
DB_ROOT_USER=${{MySQL.MYSQLUSER}}
DB_ROOT_PASSWORD=${{MySQL.MYSQLPASSWORD}}

# Server
NODE_ENV=production
PORT=3000

# JWT (generate a random secret)
JWT_SECRET=<your-random-secret-here>
JWT_EXPIRES_IN=7d

# CORS (your frontend URL)
CORS_ORIGIN=https://your-frontend.vercel.app

# Session (generate a random secret)
SESSION_SECRET=<your-random-secret-here>

# File Uploads
UPLOADS_DIR=./uploads

# Add other variables from backend/.env.example
```

**Note:** Railway uses `${{Service.Variable}}` syntax to reference other services.

## ✅ Step 6: Deploy

Railway will automatically deploy when you:
- Push to your GitHub repository (if connected)
- Or manually trigger deployment from dashboard

## 🔍 Verify Deployment

1. Check build logs in Railway dashboard
2. Verify the service is running
3. Test the health endpoint: `https://your-project.railway.app/health`

## 🐛 Troubleshooting

### Error: "Railpack could not determine how to build"
- **Fix:** Set Root Directory to `backend` in Railway settings

### Error: "Cannot find package.json"
- **Fix:** Ensure Root Directory is set to `backend`

### Database connection errors
- **Fix:** Verify environment variables use Railway's variable reference syntax

---

## Quick Commands Reference

```bash
# Login
railway login

# Link project
railway link -p 5d1de741-26b0-4fe0-9470-f4dfd58cf1be

# View logs
railway logs

# Open dashboard
railway open

# Set environment variable
railway variables set KEY=value

# Deploy
railway up
```

