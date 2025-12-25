# 🚀 Finvera Backend - Final Deployment Guide

## ✅ Updated Configuration

Your deployment is now configured to deploy to the **main/root directory** (not public_html).

### What's Excluded (as requested):
- ❌ `uploads/` directory
- ❌ `.env` file
- ❌ All `.md` files (documentation)
- ❌ `node_modules/` directory
- ❌ `package-lock.json`

### What's Included:
- ✅ `src/` directory (complete backend code)
- ✅ `config/` directory
- ✅ `server.js`
- ✅ `package.json`
- ✅ `.sequelizerc`
- ✅ `.prettierrc`
- ✅ `.eslintrc.js`
- ✅ `.gitignore`
- ✅ `API_DOCUMENTATION.json`
- ✅ `.env.example` (template only)

**Total:** 166 files

---

## 📂 Directory Structure (Same as Your Image)

```
/ (root directory)
├── config/
│   └── config.js
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
├── logs/ (created on server)
├── uploads/ (created on server, excluded from deployment)
├── node_modules/ (installed on server)
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── .sequelizerc
├── API_DOCUMENTATION.json
├── package.json
├── server.js
└── .env (created on server, excluded from deployment)
```

---

## 🚀 Deploy Options

### Option 1: Use Deployment Script (Automated)

```bash
cd /workspace/backend
bash deploy-final.sh
```

**This will:**
- Upload all files to root directory
- Exclude uploads, .env, .md files, node_modules, package-lock.json
- Create install.sh, start.sh, test.sh on server
- Maintain exact directory structure

---

### Option 2: Manual Upload via cPanel (Recommended)

#### Step 1: Create Archive (Without Exclusions)

```bash
cd /workspace/backend
tar --exclude='node_modules' \
    --exclude='package-lock.json' \
    --exclude='.env' \
    --exclude='uploads' \
    --exclude='*.md' \
    --exclude='.git' \
    --exclude='deploy-*' \
    --exclude='.ftpconfig' \
    -czf finvera-backend-clean.tar.gz \
    src/ config/ server.js package.json .sequelizerc .prettierrc \
    .eslintrc.js .gitignore API_DOCUMENTATION.json .env.example
```

#### Step 2: Upload via cPanel

1. **Login to cPanel:**
   - URL: https://illusiodesigns.agency:2083
   - Username: `finvera@illusiodesigns.agency`
   - Password: `Rishi@1995`

2. **Go to File Manager:**
   - Click "File Manager"
   - Navigate to home directory (root `/`)
   - You should see folders like: `public_html`, `mail`, etc.

3. **Upload Archive:**
   - Click "Upload" button
   - Select `finvera-backend-clean.tar.gz`
   - Wait for upload to complete

4. **Extract Files:**
   - Go back to File Manager
   - Right-click on `finvera-backend-clean.tar.gz`
   - Click "Extract"
   - Extract to: `/home/finvera/` (root directory)
   - Delete the .tar.gz file after extraction

5. **Verify Structure:**
   You should now see in your root directory:
   ```
   /home/finvera/
   ├── src/
   ├── config/
   ├── server.js
   ├── package.json
   ├── .env.example
   └── ... (other files)
   ```

---

### Option 3: FileZilla (Manual FTP)

1. **Connect:**
   - Host: `ftp.illusiodesigns.agency`
   - Username: `finvera@illusiodesigns.agency`
   - Password: `Rishi@1995`
   - Port: `21`

2. **Navigate:**
   - Remote side: Go to `/` (root directory)

3. **Upload Folders & Files:**
   Upload these from `/workspace/backend/`:
   - `src/` folder (complete directory)
   - `config/` folder
   - `server.js`
   - `package.json`
   - `.sequelizerc`
   - `.prettierrc`
   - `.eslintrc.js`
   - `.gitignore`
   - `API_DOCUMENTATION.json`
   - `.env.example`

4. **Create Directories:**
   On server, create:
   - `logs/`

---

## ⚙️ Server Setup (After Files Upload)

### Step 1: SSH into Server

```bash
ssh finvera@illusiodesigns.agency
```
Password: `Rishi@1995`

### Step 2: Verify Files

```bash
cd ~
ls -la
```

You should see:
- `src/` directory
- `config/` directory
- `server.js`
- `package.json`
- etc.

### Step 3: Create .env File

```bash
cp .env.example .env
nano .env
```

**Update these values:**

```bash
# Database
DB_HOST=localhost
DB_USER=your_db_user          # Get from cPanel
DB_PASSWORD=your_db_password  # Get from cPanel
DB_NAME=finvera_db
MASTER_DB_NAME=finvera_master

# Security - Generate new keys!
ENCRYPTION_KEY=your-32-char-key
PAYLOAD_ENCRYPTION_KEY=your-strong-key
JWT_SECRET=your-jwt-secret-64-chars
JWT_REFRESH_SECRET=your-refresh-secret
SESSION_SECRET=your-session-secret

# Domain
MAIN_DOMAIN=finvera.solutions
FRONTEND_URL=https://client.finvera.solutions

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://api.finvera.solutions/api/auth/google/callback

# Optional
REDIS_ENABLED=false
EMAIL_ENABLED=false
```

**Save:** `Ctrl+X`, then `Y`, then `Enter`

### Step 4: Generate Secure Keys

```bash
# Run these commands and copy outputs to .env
openssl rand -base64 32   # ENCRYPTION_KEY
openssl rand -base64 48   # PAYLOAD_ENCRYPTION_KEY
openssl rand -base64 64   # JWT_SECRET
openssl rand -base64 64   # JWT_REFRESH_SECRET
openssl rand -base64 64   # SESSION_SECRET
```

### Step 5: Setup Database

**Via cPanel:**
1. Go to: cPanel → MySQL Databases
2. Create database: `finvera_db`
3. Create database: `finvera_master`
4. Create user and grant ALL privileges

**OR via MySQL CLI:**

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
cd ~
npm install --production
```

### Step 7: Create Missing Directories

```bash
mkdir -p logs
mkdir -p uploads
chmod 755 logs
chmod 755 uploads
```

### Step 8: Run Migrations

```bash
npm run migrate
```

### Step 9: Install PM2

```bash
npm install -g pm2
```

### Step 10: Start Server

```bash
pm2 start server.js --name finvera-backend \
    --max-memory-restart 1G \
    --log logs/out.log \
    --error logs/err.log

pm2 save
pm2 startup
```

### Step 11: Test

```bash
# Test locally
curl http://localhost:3000/health

# Check PM2 status
pm2 status
pm2 logs finvera-backend
```

**Expected Response:**
```json
{"status":"ok","timestamp":"2025-12-25T..."}
```

---

## 📋 Quick Server Commands

```bash
# Navigate to backend directory
cd ~

# Check files
ls -la

# Edit .env
nano .env

# Install dependencies
npm install --production

# Run migrations
npm run migrate

# Start server
pm2 start server.js --name finvera-backend
pm2 save

# Check status
pm2 status

# View logs
pm2 logs finvera-backend

# Restart
pm2 restart finvera-backend

# Stop
pm2 stop finvera-backend

# Test health
curl http://localhost:3000/health

# Check process
ps aux | grep node
```

---

## 🔍 Troubleshooting

### Files not in root directory?

```bash
# Check your location
pwd

# Should be: /home/finvera

# List files
ls -la

# If files are in subdirectory, move them:
mv subdirectory/* .
```

### PM2 not starting?

```bash
# Check logs
pm2 logs finvera-backend

# Check .env
cat .env

# Test Node.js
node --version

# Test manually
node server.js
```

### Database connection error?

```bash
# Check database exists
mysql -u finvera_user -p
SHOW DATABASES;

# Check .env has correct credentials
grep DB_ .env
```

### Port 3000 already in use?

```bash
# Find process
sudo netstat -tulpn | grep 3000

# Kill process
pm2 delete finvera-backend

# Or change port in .env
nano .env
# Set PORT=3001
```

---

## ✅ Deployment Checklist

- [ ] Files uploaded to root directory (`/home/finvera/`)
- [ ] Directory structure matches image (src/, config/, server.js, etc.)
- [ ] .env file created and configured
- [ ] Database credentials updated in .env
- [ ] Security keys generated and added to .env
- [ ] Google OAuth credentials added to .env
- [ ] Database created (finvera_db, finvera_master)
- [ ] Database user created with permissions
- [ ] Dependencies installed (`npm install --production`)
- [ ] logs/ directory created
- [ ] uploads/ directory created
- [ ] Migrations run (`npm run migrate`)
- [ ] PM2 installed
- [ ] Server started with PM2
- [ ] Health check passes (`curl http://localhost:3000/health`)
- [ ] PM2 shows "online" status
- [ ] Logs are clean (no errors)

---

## 🌐 Domain Setup

Once backend is running:

### DNS Configuration:
Add A record in your domain registrar:
```
Type    Name    Value               TTL
A       api     YOUR_SERVER_IP      300
```

### Test:
```bash
curl https://api.finvera.solutions/health
```

---

## 📞 Support

**Need Help?**
- Email: info@illusiodesigns.agency
- Phone: 7600046416

---

## 📁 Updated Files

1. **`.ftpconfig`** - Updated to deploy to root (`/`)
2. **`deploy-final.sh`** - New deployment script with proper exclusions
3. **`FINAL_DEPLOYMENT_GUIDE.md`** - This guide

---

## 🎯 Summary

**Deployment Location:** Root directory (`/home/finvera/`)  
**Excluded:** uploads/, .env, *.md, node_modules/, package-lock.json  
**Files:** 166 files  
**Structure:** Same as your GitHub image  

**Status:** ✅ Ready to deploy!

---

**Last Updated:** December 25, 2025  
**Deployment:** Main directory (root)  
**Exclusions:** Configured as requested
