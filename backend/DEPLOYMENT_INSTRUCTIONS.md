# Finvera Backend - Manual Deployment Instructions

**Server:** illusiodesigns.agency  
**FTP User:** finvera@illusiodesigns.agency

---

## 📦 What You Have

All deployment files are ready in `/workspace/backend/`:

1. **`deploy.sh`** - Automated deployment script
2. **`setup-server.sh`** - Server setup script
3. **`test-ftp.sh`** - FTP connection test
4. **`.ftpconfig`** - FTP credentials (already configured)
5. **`.env.production.example`** - Production environment template

---

## 🚀 Quick Deployment (Option 1 - Automated)

### From your local machine with good internet:

```bash
cd /workspace/backend

# Test FTP connection first
bash test-ftp.sh

# If connection works, run deployment
bash deploy.sh
```

The script will:
- ✅ Install dependencies
- ✅ Create deployment archive
- ✅ Upload to FTP server
- ✅ Create startup scripts
- ✅ Create PM2 configuration
- ✅ Create health check tests

---

## 🔧 Manual Deployment (Option 2 - If automated fails)

### Step 1: Connect via FTP

Use FileZilla or any FTP client:
```
Host: ftp.illusiodesigns.agency
Port: 21
User: finvera@illusiodesigns.agency
Password: Rishi@1995
```

### Step 2: Create Directory Structure

On the server, create these directories:
```
/api/
├── src/
├── logs/
├── uploads/
└── node_modules/
```

### Step 3: Upload Files

Upload these from `/workspace/backend/` to `/api/`:
- All files in `src/` folder
- `server.js`
- `package.json`
- `package-lock.json`

### Step 4: SSH and Install Dependencies

```bash
# SSH into server
ssh finvera@illusiodesigns.agency

# Navigate to API directory
cd ~/api

# Install Node.js if not installed
# Check version
node --version
npm --version

# Install dependencies
npm install --production

# Create .env file
nano .env
```

### Step 5: Configure Environment

Copy contents from `.env.production.example` and update these values:

**CRITICAL VALUES TO UPDATE:**
```bash
# Database credentials (get from cPanel)
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=finvera_db
MASTER_DB_NAME=finvera_master

# Generate strong keys (run: openssl rand -base64 48)
ENCRYPTION_KEY=<generate_strong_key>
PAYLOAD_ENCRYPTION_KEY=<generate_strong_key>
JWT_SECRET=<generate_strong_key>
JWT_REFRESH_SECRET=<generate_strong_key>
SESSION_SECRET=<generate_strong_key>

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://api.finvera.solutions/api/auth/google/callback
```

### Step 6: Setup Database

```bash
# Login to MySQL
mysql -u root -p

# Create databases
CREATE DATABASE finvera_db;
CREATE DATABASE finvera_master;

# Create user
CREATE USER 'finvera_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON finvera_db.* TO 'finvera_user'@'localhost';
GRANT ALL PRIVILEGES ON finvera_master.* TO 'finvera_user'@'localhost';
GRANT ALL PRIVILEGES ON `finvera_tenant_%`.* TO 'finvera_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run migrations
npm run migrate
```

### Step 7: Start Application

**Option A: Using PM2 (Recommended)**
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start server.js --name finvera-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Check status
pm2 status
pm2 logs finvera-backend
```

**Option B: Using Node directly (for testing)**
```bash
NODE_ENV=production node server.js
```

### Step 8: Configure Nginx/Apache

#### For Nginx:

Create `/etc/nginx/sites-available/finvera-api`:

```nginx
server {
    listen 80;
    server_name api.finvera.solutions;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/finvera-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### For Apache (cPanel):

Create `.htaccess` in `/api/`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

### Step 9: Test Deployment

```bash
# Test health endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/health

# Test from outside
curl https://api.finvera.solutions/health
```

---

## 🧪 Simple Test Server (Option 3)

If you want to test connectivity first, I've created a simple test server.

### Test Files Created:

1. **test-server.js** - Simple HTTP server
2. **test-package.json** - Package config
3. **README-TEST.md** - Test instructions

### To use:

```bash
# Upload test-server.js to /api/
# SSH into server
cd ~/api
node test-server.js

# Test
curl http://localhost:3000/health
```

---

## 📋 Deployment Checklist

### Pre-Deployment:
- [ ] FTP credentials verified
- [ ] SSH access confirmed
- [ ] Node.js installed on server (v18+)
- [ ] MySQL installed and running
- [ ] Domain DNS configured

### Deployment:
- [ ] Files uploaded to `/api/`
- [ ] Dependencies installed (`npm install --production`)
- [ ] `.env` file created and configured
- [ ] Databases created
- [ ] Database user created and permissions granted
- [ ] Migrations run (`npm run migrate`)
- [ ] Application started (PM2 or node)

### Post-Deployment:
- [ ] Health check works: `/health`
- [ ] API health works: `/api/health`
- [ ] Google OAuth configured
- [ ] Domain points to server
- [ ] SSL certificate installed
- [ ] Nginx/Apache configured
- [ ] PM2 process running
- [ ] Logs are clean

---

## 🔍 Troubleshooting

### Cannot connect to database:
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u finvera_user -p -h localhost
```

### Port 3000 already in use:
```bash
# Find process
sudo netstat -tulpn | grep 3000

# Kill process
sudo kill -9 <PID>
```

### PM2 not starting:
```bash
# Check logs
pm2 logs finvera-backend

# Restart
pm2 restart finvera-backend

# Delete and start fresh
pm2 delete finvera-backend
pm2 start server.js --name finvera-backend
```

### Permission denied errors:
```bash
# Check ownership
ls -la

# Fix permissions
chmod 755 server.js
chown finvera:finvera -R /home/finvera/api
```

---

## 📞 Support

**Technical Support:**
- Email: info@illusiodesigns.agency
- Phone: 7600046416

**Documentation:**
- `BACKEND_STATUS_REPORT.md` - Complete feature list
- `GOOGLE_OAUTH_SETUP.md` - OAuth configuration
- `PRODUCTION_SETUP_GUIDE.md` - Detailed setup guide
- `.env.production.example` - Environment variables

---

## 🎯 Quick Commands Reference

```bash
# Test deployment
bash /workspace/backend/deploy.sh

# SSH into server
ssh finvera@illusiodesigns.agency

# Check app status
pm2 status
pm2 logs finvera-backend

# Restart app
pm2 restart finvera-backend

# View logs
tail -f ~/api/logs/out.log
tail -f ~/api/logs/err.log

# Test health
curl http://localhost:3000/health
curl https://api.finvera.solutions/health

# Database
mysql -u finvera_user -p

# Check processes
ps aux | grep node
```

---

**Last Updated:** December 25, 2025  
**Deployment Ready:** ✅ Yes
