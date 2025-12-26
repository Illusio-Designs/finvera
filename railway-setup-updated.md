# Railway Deployment Setup (Monorepo)

## ⚠️ Important: Monorepo Configuration

Your project has a monorepo structure:
```
finvera/
├── backend/
├── frontend/
└── README.md
```

Railway needs to know which directory contains your backend.

## Solution 1: Set Root Directory in Railway (Recommended)

1. **Create Railway Project**
   - Go to https://railway.app
   - New Project → Deploy from GitHub
   - Select your repository

2. **Configure Root Directory**
   - In Railway project settings
   - Go to "Settings" → "Source"
   - Set **Root Directory** to: `backend`
   - This tells Railway to treat `backend/` as the project root

3. **Add MySQL Database**
   - Click "New" → "Database" → "Add MySQL"
   - Railway will create MySQL automatically

4. **Set Environment Variables**
   - Go to "Variables" tab
   - Add all variables from `backend/.env.example`
   - Use Railway MySQL connection details for database vars

5. **Deploy**
   - Railway will auto-detect Node.js in `backend/` directory
   - It will run `npm install` and `npm start` from `backend/`

---

## Solution 2: Use nixpacks.toml (Alternative)

If Solution 1 doesn't work, we've created `nixpacks.toml` in the root directory that tells Railway to:
- Install dependencies from `backend/`
- Start the app from `backend/`

Railway should automatically detect this file.

---

## Solution 3: Deploy Backend as Separate Repository

1. Create a new GitHub repository just for the backend
2. Copy only the `backend/` folder contents
3. Deploy that repository to Railway

---

## Environment Variables for Railway

After creating MySQL database in Railway, use these variables:

```env
# Database (from Railway MySQL service - check Variables tab)
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

# JWT
JWT_SECRET=<generate-a-random-secret>
JWT_EXPIRES_IN=7d

# CORS (your frontend URL)
CORS_ORIGIN=https://your-frontend.vercel.app

# Session
SESSION_SECRET=<generate-a-random-secret>

# Redis (optional - add Redis service if needed)
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}

# File Uploads
UPLOADS_DIR=./uploads

# Other variables from backend/.env.example
```

**Note:** Railway uses `${{Service.Variable}}` syntax to reference other services.

---

## Quick Fix for Current Error

If you're seeing the Railpack error, do this:

1. **In Railway Dashboard:**
   - Go to your project
   - Click on the service
   - Go to "Settings"
   - Find "Root Directory" or "Working Directory"
   - Set it to: `backend`

2. **Or redeploy:**
   - Delete the current service
   - Create new service
   - When connecting GitHub, specify root directory as `backend`

---

## Verify Deployment

After deployment, check:
- ✅ Build logs show `npm install` running in `backend/`
- ✅ Start command shows `npm start` from `backend/`
- ✅ Health check endpoint works: `https://your-project.railway.app/health`

---

## Troubleshooting

### Error: "Railpack could not determine how to build"
- **Fix:** Set Root Directory to `backend` in Railway settings

### Error: "Cannot find package.json"
- **Fix:** Ensure Root Directory is set to `backend`

### Error: "Module not found"
- **Fix:** Check that `npm install` ran successfully in build logs

### Database connection errors
- **Fix:** Verify environment variables are set correctly
- Use Railway's variable reference syntax: `${{MySQL.MYSQLHOST}}`

