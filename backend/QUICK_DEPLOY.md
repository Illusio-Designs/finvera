# Finvera Backend - Quick Deployment Guide

## 🚀 Fastest Way to Deploy

I've prepared everything for you. The backend deployment is ready!

---

## 📦 What's Ready

All your backend files have been packaged (excluding node_modules, .env, uploads).

---

## ⚡ Quick Deploy Steps

### Method 1: Upload Archive (Fastest)

**1. Create the deployment archive:**

```bash
cd /workspace/backend
tar --exclude='node_modules' --exclude='package-lock.json' --exclude='.env' --exclude='uploads' --exclude='.git' --exclude='deploy-*' --exclude='*.log' -czf finvera-backend.tar.gz src/ server.js package.json config/ .sequelizerc .prettierrc .eslintrc.js .env.production.example
```

**2. Upload via FTP:**

Use FileZilla or any FTP client:
- Upload `finvera-backend.tar.gz` to `/public_html/api/`

**3. SSH and extract:**

```bash
ssh finvera@illusiodesigns.agency
cd ~/public_html/api
tar -xzf finvera-backend.tar.gz
rm finvera-backend.tar.gz
```

---

### Method 2: Use cPanel File Manager (Easiest)

**1. Login to cPanel:**
- URL: https://illusiodesigns.agency:2083 (or your cPanel URL)
- Username: finvera@illusiodesigns.agency
- Password: Rishi@1995

**2. Navigate to File Manager:**
- Go to: `public_html/api/`
- Create `api` folder if it doesn't exist

**3. Upload archive:**
- Click "Upload" button
- Select `finvera-backend.tar.gz` from `/workspace/backend/`
- Wait for upload to complete

**4. Extract archive:**
- Right-click on `finvera-backend.tar.gz`
- Click "Extract"
- Delete the .tar.gz file after extraction

**5. Open Terminal in cPanel:**
- Use cPanel Terminal or SSH

---

## 🔧 Server Setup (After Files are Uploaded)

### Step 1: SSH into Server

```bash
ssh finvera@illusiodesigns.agency
```

**Password:** Rishi@1995

### Step 2: Navigate to API Directory

```bash
cd ~/public_html/api
# OR
cd /home/finvera/public_html/api
```

### Step 3: Verify Files

```bash
ls -la
```

You should see:
- `src/` directory
- `server.js`
- `package.json`
- `.env.example`
- `install.sh`, `start.sh`, `test.sh` (if deployed)

### Step 4: Create .env File

```bash
cp .env.example .env
nano .env
```

**Update these critical values:**

```bash
# Database (get from cPanel > MySQL Databases)
DB_HOST=localhost
DB_USER=your_cpanel_db_user
DB_PASSWORD=your_db_password
DB_NAME=finvera_db
MASTER_DB_NAME=finvera_master

# Generate secrets (run: openssl rand -base64 48)
ENCRYPTION_KEY=generate_32_char_key_here
PAYLOAD_ENCRYPTION_KEY=generate_strong_key_here
JWT_SECRET=generate_strong_key_here
JWT_REFRESH_SECRET=generate_strong_key_here
SESSION_SECRET=generate_strong_key_here

# Domain
MAIN_DOMAIN=finvera.solutions
FRONTEND_URL=https://client.finvera.solutions

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.finvera.solutions/api/auth/google/callback
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

### Step 5: Setup Database (via cPanel or MySQL)

**Option A: Via cPanel:**
1. Go to cPanel > MySQL Databases
2. Create databases: `finvera_db` and `finvera_master`
3. Create user and grant all privileges

**Option B: Via SSH:**
```bash
mysql -u root -p

CREATE DATABASE finvera_db;
CREATE DATABASE finvera_master;
CREATE USER 'finvera_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON finvera_db.* TO 'finvera_user'@'localhost';
GRANT ALL PRIVILEGES ON finvera_master.* TO 'finvera_user'@'localhost';
GRANT ALL PRIVILEGES ON `finvera_tenant_%`.* TO 'finvera_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 6: Install Dependencies

```bash
npm install --production
```

### Step 7: Run Migrations

```bash
npm run migrate
```

### Step 8: Start the Server

**Option A: With PM2 (Recommended)**

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start server.js --name finvera-backend

# Save configuration
pm2 save

# Setup autostart
pm2 startup
```

**Option B: Direct Node**

```bash
NODE_ENV=production node server.js
```

### Step 9: Test the Server

```bash
# Test locally
curl http://localhost:3000/health

# Check PM2 status
pm2 status
pm2 logs finvera-backend
```

---

## 🎯 If Using Provided Scripts

If the deployment script created these files on server:

```bash
# Install everything
bash install.sh

# Start server
bash start.sh

# Test server
bash test.sh
```

---

## 🔍 Verify Deployment

### Check Files:
```bash
cd ~/public_html/api
ls -la

# Should see:
# - src/ (directory with all backend code)
# - server.js
# - package.json
# - .env
# - node_modules/ (after npm install)
```

### Test Endpoints:
```bash
# Local test
curl http://localhost:3000/health
curl http://localhost:3000/api/health

# External test (after domain setup)
curl https://api.finvera.solutions/health
```

---

## 📁 Final Directory Structure on Server

```
/home/finvera/public_html/api/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   ├── websocket/
│   ├── migrations/
│   ├── seeders/
│   ├── scripts/
│   └── app.js
├── config/
│   └── config.js
├── node_modules/ (after npm install)
├── logs/
├── uploads/
├── server.js
├── package.json
├── .env
├── .sequelizerc
├── .prettierrc
├── .eslintrc.js
└── ecosystem.config.js (optional, for PM2)
```

---

## ⚙️ Configure Apache/Nginx (If Needed)

### For cPanel (Apache):

Create `.htaccess` in `/public_html/api/`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]

# CORS Headers
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"
```

---

## 🎉 Success Checklist

- [ ] Files uploaded to server
- [ ] .env file created and configured
- [ ] Database created and user set up
- [ ] npm install completed
- [ ] Migrations run successfully
- [ ] Server starts without errors
- [ ] Health check returns 200: `curl http://localhost:3000/health`
- [ ] PM2 showing running status: `pm2 status`
- [ ] Domain DNS points to server
- [ ] External health check works: `curl https://api.finvera.solutions/health`

---

## 🔥 Quick Commands Reference

```bash
# Navigate to directory
cd ~/public_html/api

# Check files
ls -la

# Edit .env
nano .env

# Install dependencies
npm install --production

# Run migrations
npm run migrate

# Start with PM2
pm2 start server.js --name finvera-backend
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs finvera-backend

# Restart
pm2 restart finvera-backend

# Stop
pm2 stop finvera-backend

# Test health
curl http://localhost:3000/health

# Check processes
ps aux | grep node

# View logs
tail -f logs/out.log
tail -f logs/err.log
```

---

## 📞 Support

- **Email:** info@illusiodesigns.agency
- **Phone:** 7600046416

---

## ✅ You're Done!

Once all steps are complete:
1. ✅ Backend is running
2. ✅ Health checks pass
3. ✅ Database connected
4. ✅ Ready for frontend deployment

**Next:** Deploy frontend to `client.finvera.solutions` and `admin.finvera.solutions`

---

**Last Updated:** December 25, 2025
