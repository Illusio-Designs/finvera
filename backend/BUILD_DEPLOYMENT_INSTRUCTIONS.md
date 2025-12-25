# 🎉 BUILD.zip - Ready to Deploy!

## ✅ Package Created Successfully!

**File:** `/workspace/backend/BUILD.zip`  
**Size:** 273KB  
**Contents:** 166 files in `build-deploy/` folder

---

## 📦 What's Inside BUILD.zip

```
build-deploy/
├── src/              (All backend code)
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
├── logs/             (empty, ready for logs)
├── server.js
├── package.json
├── .env.example
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── .sequelizerc
├── API_DOCUMENTATION.json
├── install.sh        (installation script)
├── start.sh          (start server script)
└── test.sh           (health check script)
```

**Excluded:** uploads/, .env, *.md, node_modules/, package-lock.json

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Upload BUILD.zip to Server

#### Option A: cPanel File Manager (EASIEST) ⭐

1. **Login to cPanel:**
   - URL: https://illusiodesigns.agency:2083
   - Username: `finvera@illusiodesigns.agency`
   - Password: `Rishi@1995`

2. **Go to File Manager:**
   - Click "File Manager" icon
   - Navigate to home directory (root `/`)

3. **Upload ZIP:**
   - Click "Upload" button
   - Select `/workspace/backend/BUILD.zip`
   - Wait for upload (273KB - should be fast!)

4. **Extract ZIP:**
   - Go back to File Manager
   - You should see `BUILD.zip` in your home directory
   - Right-click on `BUILD.zip`
   - Click "Extract"
   - Extract to: `/home/finvera/`
   - Click "Extract Files"

5. **Verify Extraction:**
   You should now see folder: `build-deploy/`
   - Click on `build-deploy/`
   - Verify folders inside: `src/`, `config/`, `logs/`
   - Verify files: `server.js`, `package.json`, etc.

6. **Set Permissions (since you mentioned chmod 777):**
   - Select `build-deploy` folder
   - Click "Permissions" or "Change Permissions"
   - Set to `777` (or check all boxes)
   - Check "Recurse into subdirectories"
   - Click "Change Permissions"

7. **Delete ZIP (optional):**
   - Select `BUILD.zip`
   - Click "Delete"

---

#### Option B: FileZilla

1. **Connect:**
   - Host: `ftp.illusiodesigns.agency`
   - Username: `finvera@illusiodesigns.agency`
   - Password: `Rishi@1995`
   - Port: `21`

2. **Upload:**
   - Navigate to: `/` (root directory)
   - Drag `BUILD.zip` to server

3. **Extract via SSH** (see Step 2)

---

### Step 2: SSH and Setup

```bash
# SSH into server
ssh finvera@illusiodesigns.agency
# Password: Rishi@1995

# Navigate to home
cd ~

# If uploaded via FTP, extract
unzip BUILD.zip

# Go into build-deploy folder
cd build-deploy

# Verify files
ls -la
# Should see: src/, config/, server.js, package.json, etc.

# Set permissions (since you set 777)
chmod 777 -R .

# Verify permissions
ls -la
```

---

### Step 3: Create .env File

```bash
# Still in ~/build-deploy directory

# Copy example
cp .env.example .env

# Edit .env
nano .env
```

**Update these critical values:**

```bash
# Database (get from cPanel > MySQL)
DB_HOST=localhost
DB_USER=your_cpanel_db_user
DB_PASSWORD=your_db_password
DB_NAME=finvera_db
MASTER_DB_NAME=finvera_master

# Generate secure keys
ENCRYPTION_KEY=generate-32-char-key
PAYLOAD_ENCRYPTION_KEY=generate-strong-key
JWT_SECRET=generate-64-char-key
JWT_REFRESH_SECRET=generate-64-char-key
SESSION_SECRET=generate-64-char-key

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

---

### Step 4: Generate Secure Keys

```bash
# Generate keys for .env
openssl rand -base64 32   # ENCRYPTION_KEY
openssl rand -base64 48   # PAYLOAD_ENCRYPTION_KEY
openssl rand -base64 64   # JWT_SECRET
openssl rand -base64 64   # JWT_REFRESH_SECRET
openssl rand -base64 64   # SESSION_SECRET

# Copy each output to your .env file
nano .env
```

---

### Step 5: Setup Database

**Via cPanel MySQL:**
1. Go to cPanel → MySQL Databases
2. Create database: `finvera_db`
3. Create database: `finvera_master`
4. Create user
5. Grant ALL privileges to both databases

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

---

### Step 6: Run Installation Script

```bash
# Still in ~/build-deploy

# Run install script
bash install.sh
```

This will:
- Install all npm dependencies
- Create logs/ and uploads/ directories
- Set proper permissions

---

### Step 7: Run Database Migrations

```bash
npm run migrate
```

---

### Step 8: Start Server

```bash
# Start with PM2 (recommended)
npm install -g pm2
pm2 start server.js --name finvera-backend
pm2 save
pm2 startup

# OR start with Node directly
node server.js
```

---

### Step 9: Test Deployment

```bash
# Run test script
bash test.sh

# OR manually test
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

---

## ✅ Quick Command Reference

```bash
# Navigate to build-deploy
cd ~/build-deploy

# Check files
ls -la

# Edit .env
nano .env

# Install dependencies
bash install.sh
# OR
npm install --production

# Create directories
mkdir -p logs uploads
chmod 777 logs uploads

# Run migrations
npm run migrate

# Start server
bash start.sh
# OR
pm2 start server.js --name finvera-backend

# Test
bash test.sh
# OR
curl http://localhost:3000/health

# Check PM2 status
pm2 status
pm2 logs finvera-backend

# Restart
pm2 restart finvera-backend

# Stop
pm2 stop finvera-backend
```

---

## 📂 Directory Structure After Deployment

```
/home/finvera/
├── build-deploy/          ← Your backend is here
│   ├── src/
│   ├── config/
│   ├── logs/
│   ├── uploads/ (created by install.sh)
│   ├── node_modules/ (installed by npm)
│   ├── server.js
│   ├── package.json
│   ├── .env (created by you)
│   ├── install.sh
│   ├── start.sh
│   └── test.sh
└── BUILD.zip (can delete after extraction)
```

---

## 🔍 Troubleshooting

### Cannot extract ZIP via cPanel?
```bash
# SSH and extract manually
ssh finvera@illusiodesigns.agency
cd ~
unzip BUILD.zip
cd build-deploy
```

### Permission denied errors?
```bash
chmod 777 -R ~/build-deploy
```

### npm install fails?
```bash
# Check Node.js
node --version  # Should be 18+
npm --version

# Try again
npm install --production
```

### Database connection fails?
```bash
# Test database connection
mysql -u finvera_user -p

# Check .env credentials
cat .env | grep DB_
```

### Port 3000 already in use?
```bash
# Find and kill process
sudo netstat -tulpn | grep 3000
pm2 delete finvera-backend

# Or change port in .env
nano .env
# Set PORT=3001
```

### PM2 not starting?
```bash
# Check logs
pm2 logs finvera-backend

# Try starting manually
node server.js
```

---

## ✅ Deployment Checklist

- [ ] BUILD.zip uploaded to server
- [ ] ZIP extracted to build-deploy/ folder
- [ ] Permissions set to 777 (as requested)
- [ ] .env file created and configured
- [ ] Database credentials updated
- [ ] Security keys generated and added
- [ ] Google OAuth credentials added
- [ ] Database created (finvera_db, finvera_master)
- [ ] Database user created with permissions
- [ ] npm dependencies installed
- [ ] Migrations run successfully
- [ ] Server started with PM2
- [ ] Health check passes
- [ ] PM2 shows "online" status
- [ ] Logs are clean

---

## 📊 Deployment Log Summary

**FTP Deployment Attempts:**
- ✗ Direct FTP upload timed out (FTP too slow in this environment)
- ✅ Created BUILD.zip package instead (273KB)

**Solution:**
- ✅ Manual upload via cPanel (fastest and most reliable)
- ✅ All files packaged in build-deploy/ folder
- ✅ Exclusions applied: uploads, .env, .md, node_modules, package-lock.json
- ✅ Server scripts included: install.sh, start.sh, test.sh

---

## 🎯 Success Indicators

You know it's working when:

```bash
✓ curl http://localhost:3000/health
  {"status":"ok","timestamp":"2025-12-25T..."}

✓ pm2 status
  finvera-backend | online

✓ pm2 logs finvera-backend
  Server running on port 3000

✓ No errors in logs
```

---

## 🌐 After Backend is Live

1. Test locally: `curl http://localhost:3000/health`
2. Configure domain: Point `api.finvera.solutions` to server IP
3. Test externally: `curl https://api.finvera.solutions/health`
4. Deploy frontend applications
5. Test Google OAuth
6. Launch! 🚀

---

## 📞 Support

**Need Help?**
- Email: info@illusiodesigns.agency
- Phone: 7600046416

---

## 📋 File Location

**Package:** `/workspace/backend/BUILD.zip` (273KB)

**To download from server:**
```bash
# On your local machine
scp finvera@illusiodesigns.agency:/workspace/backend/BUILD.zip ./
```

---

## 🎉 READY TO DEPLOY!

**Next Step:** Upload BUILD.zip via cPanel File Manager!

1. Login to cPanel
2. Upload BUILD.zip
3. Extract
4. Follow steps above

**Status:** ✅ 100% Ready  
**Package:** BUILD.zip created  
**Size:** 273KB  
**Files:** 166 files  
**Location:** build-deploy/ folder

---

**Created:** December 25, 2025  
**Method:** Manual upload recommended  
**Deployment Time:** ~10 minutes  
**Difficulty:** Easy ⭐⭐☆☆☆
