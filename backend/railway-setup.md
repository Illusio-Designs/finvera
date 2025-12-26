# Railway Deployment Setup

## ⚠️ IMPORTANT: Monorepo Configuration

Your project structure is:
```
finvera/
├── backend/    ← Your backend code is here
├── frontend/   ← Your frontend code is here
└── README.md
```

**Railway needs to know to use the `backend/` directory as the root.**

## Step-by-Step Guide

### 1. Sign Up
- Go to https://railway.app
- Sign up with GitHub (recommended)

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your `finvera` repository

### 3. ⚠️ CRITICAL: Set Root Directory
- After connecting the repo, go to **Settings** → **Source**
- Set **Root Directory** to: `backend`
- This tells Railway to treat `backend/` as the project root
- **Without this, Railway will fail with "Railpack could not determine how to build"**

### 3. Add MySQL Database
- In your Railway project, click "New"
- Select "Database" → "Add MySQL"
- Railway will create a MySQL database automatically
- Note the connection details (host, port, user, password, database name)

### 4. Set Environment Variables
In Railway project → Variables tab, add:

```env
# Database (from Railway MySQL service)
DB_HOST=<railway-mysql-host>
DB_PORT=3306
DB_USER=<railway-mysql-user>
DB_PASSWORD=<railway-mysql-password>
DB_NAME=<railway-mysql-database>

# For tenant provisioning (use Railway MySQL root user)
DB_ROOT_USER=<railway-mysql-root-user>
DB_ROOT_PASSWORD=<railway-mysql-root-password>

# Server
NODE_ENV=production
PORT=3000

# JWT
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# Session
SESSION_SECRET=<your-session-secret>

# Redis (optional - Railway has Redis addon)
REDIS_HOST=<railway-redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<railway-redis-password>

# File Uploads (use Railway's volume or S3)
UPLOADS_DIR=./uploads

# Other environment variables from your .env.example
```

### 5. Configure Build Settings
Railway will auto-detect Node.js, but you can customize:

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

### 6. Deploy
- Railway will automatically deploy on every push to your main branch
- Check the "Deployments" tab for logs
- Your backend will be available at: `https://your-project.railway.app`

### 7. Update Frontend
Update your frontend `.env` to point to Railway backend:

```env
NEXT_PUBLIC_API_URL=https://your-project.railway.app
```

---

## Railway MySQL Connection Details

After creating MySQL database in Railway:
1. Click on the MySQL service
2. Go to "Variables" tab
3. You'll see:
   - `MYSQLHOST` → Use as `DB_HOST`
   - `MYSQLPORT` → Use as `DB_PORT`
   - `MYSQLUSER` → Use as `DB_USER`
   - `MYSQLPASSWORD` → Use as `DB_PASSWORD`
   - `MYSQLDATABASE` → Use as `DB_NAME`

For `DB_ROOT_USER` and `DB_ROOT_PASSWORD`, use the same values (Railway MySQL uses a single user with full privileges).

---

## Troubleshooting

### Database Connection Issues
- Ensure all environment variables are set correctly
- Check Railway MySQL service is running
- Verify network connectivity (Railway services auto-connect)

### Build Failures
- Check build logs in Railway dashboard
- Ensure `package.json` has correct `start` script
- Verify Node.js version compatibility

### Memory Issues
- Railway free tier has memory limits
- Consider upgrading if you hit limits
- Or optimize your code (reduce memory usage)

---

## Railway vs Current Setup

| Feature | Current (cPanel) | Railway |
|---------|------------------|---------|
| Deployment | Manual FTP | Auto from GitHub |
| Database | Same server | Separate service |
| Scaling | Manual | Automatic |
| Monitoring | Limited | Built-in |
| Cost | Fixed monthly | Pay-as-you-go |
| Setup Time | Already done | ~30 minutes |

---

## Next Steps

1. ✅ Set up Railway account
2. ✅ Deploy backend to Railway
3. ✅ Set up MySQL database
4. ✅ Configure environment variables
5. ✅ Test deployment
6. ✅ Update frontend API URL
7. ✅ Migrate existing data (if needed)

