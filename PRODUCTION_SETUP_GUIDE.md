# Finvera - Production Setup Guide

**Quick guide for setting up Finvera backend in production**

---

## Prerequisites

- ✅ Ubuntu 20.04+ / Debian 11+ server
- ✅ MySQL 8.0+ installed
- ✅ Node.js 18+ installed
- ✅ Redis installed (optional but recommended)
- ✅ Domain name configured
- ✅ SSL certificate (Let's Encrypt recommended)

---

## Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Install Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (Reverse Proxy)
sudo apt install -y nginx
```

---

## Step 2: MySQL Database Setup

```bash
# Login to MySQL
sudo mysql -u root -p

# Create databases
CREATE DATABASE finvera_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE finvera_master CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user
CREATE USER 'finvera_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD_HERE';

# Grant privileges
GRANT ALL PRIVILEGES ON finvera_db.* TO 'finvera_user'@'localhost';
GRANT ALL PRIVILEGES ON finvera_master.* TO 'finvera_user'@'localhost';
GRANT ALL PRIVILEGES ON `finvera_tenant_%`.* TO 'finvera_user'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

---

## Step 3: Clone and Setup Backend

```bash
# Create application directory
sudo mkdir -p /var/www/finvera
sudo chown $USER:$USER /var/www/finvera
cd /var/www/finvera

# Clone your repository (replace with your repo)
git clone https://github.com/Illusio-Designs/finvera.git .

# Install backend dependencies
cd backend
npm install --production

# Create uploads directory
mkdir -p uploads
chmod 755 uploads
```

---

## Step 4: Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit the .env file
nano .env
```

**CRITICAL: Update these values in `.env`:**

```bash
# =================================
# PRODUCTION CONFIGURATION
# =================================
NODE_ENV=production
PORT=3000
MAIN_DOMAIN=yourdomain.com
FRONTEND_URL=https://client.yourdomain.com

# =================================
# DATABASE (Use values from Step 2)
# =================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=finvera_user
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE
DB_NAME=finvera_db
MASTER_DB_NAME=finvera_master

# =================================
# SECURITY (Generate strong random strings)
# =================================
# Generate with: openssl rand -base64 48
ENCRYPTION_KEY=$(openssl rand -base64 32)
PAYLOAD_ENCRYPTION_KEY=$(openssl rand -base64 48)
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)

# =================================
# REDIS
# =================================
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Set if configured

# =================================
# GOOGLE OAUTH (Get from Google Cloud Console)
# =================================
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback

# =================================
# RAZORPAY (Get from Razorpay Dashboard)
# =================================
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 5: Database Migration

```bash
# Run migrations to create tables
npm run migrate

# Seed initial data (optional)
npm run seed
```

---

## Step 6: Configure PM2

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'finvera-backend',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
}
EOF

# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown by the command above
```

---

## Step 7: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/finvera-api
```

**Paste this configuration:**

```nginx
# API Server Configuration
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration (Update paths to your certificates)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Client body size limit (for file uploads)
    client_max_body_size 20M;

    # Proxy to Node.js backend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files (uploads)
    location /uploads {
        alias /var/www/finvera/backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # Logging
    access_log /var/log/nginx/finvera-api.access.log;
    error_log /var/log/nginx/finvera-api.error.log;
}
```

**Save and exit, then:**

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/finvera-api /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## Step 8: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal with:
sudo certbot renew --dry-run
```

---

## Step 9: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 10: Google OAuth Setup

1. **Go to Google Cloud Console:** https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Enable Google+ API:**
   - APIs & Services → Library → Search "Google+ API" → Enable
4. **Create OAuth 2.0 Credentials:**
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Name: Finvera Backend
   - Authorized redirect URIs:
     - `https://api.yourdomain.com/api/auth/google/callback`
5. **Copy Client ID and Client Secret** to your `.env` file
6. **Restart backend:**
   ```bash
   pm2 restart finvera-backend
   ```

---

## Step 11: Razorpay Setup

1. **Sign up at:** https://dashboard.razorpay.com/
2. **Generate API Keys:**
   - Settings → API Keys → Generate Live Keys
3. **Set up Webhook:**
   - Settings → Webhooks → Add New Webhook
   - Webhook URL: `https://api.yourdomain.com/api/razorpay/webhook`
   - Active Events: Select all payment and subscription events
   - Secret: Copy webhook secret
4. **Update `.env` file** with keys and secret
5. **Restart backend:**
   ```bash
   pm2 restart finvera-backend
   ```

---

## Step 12: Monitoring & Logs

```bash
# View application logs
pm2 logs finvera-backend

# Monitor application
pm2 monit

# Check application status
pm2 status

# View Nginx logs
sudo tail -f /var/log/nginx/finvera-api.access.log
sudo tail -f /var/log/nginx/finvera-api.error.log
```

---

## Step 13: Backup Strategy

### Database Backup Script

```bash
# Create backup script
sudo nano /usr/local/bin/backup-finvera-db.sh
```

**Paste this:**

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/backups/finvera"
DATE=$(date +%Y%m%d_%H%M%S)
DB_USER="finvera_user"
DB_PASS="YOUR_PASSWORD_HERE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup main database
mysqldump -u $DB_USER -p$DB_PASS finvera_db | gzip > $BACKUP_DIR/finvera_db_$DATE.sql.gz

# Backup master database
mysqldump -u $DB_USER -p$DB_PASS finvera_master | gzip > $BACKUP_DIR/finvera_master_$DATE.sql.gz

# Backup all tenant databases
for db in $(mysql -u $DB_USER -p$DB_PASS -e "SHOW DATABASES LIKE 'finvera_tenant_%';" -s --skip-column-names); do
    mysqldump -u $DB_USER -p$DB_PASS $db | gzip > $BACKUP_DIR/${db}_$DATE.sql.gz
done

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Make it executable and schedule:**

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-finvera-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e

# Add this line:
0 2 * * * /usr/local/bin/backup-finvera-db.sh >> /var/log/finvera-backup.log 2>&1
```

---

## Step 14: Health Checks

```bash
# Check backend health
curl https://api.yourdomain.com/health

# Expected response:
# {"status":"ok","timestamp":"2025-12-25T..."}

# Check API endpoint
curl https://api.yourdomain.com/api/health
```

---

## Step 15: Frontend Configuration

Update your frontend `.env` file:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY=same_as_backend_key
NEXT_PUBLIC_MAIN_DOMAIN=yourdomain.com
```

---

## Common Issues & Troubleshooting

### Issue: Cannot connect to database
```bash
# Check MySQL is running
sudo systemctl status mysql

# Check credentials in .env
# Test connection
mysql -u finvera_user -p -h localhost
```

### Issue: Redis connection failed
```bash
# Check Redis is running
sudo systemctl status redis

# Test connection
redis-cli ping
```

### Issue: PM2 app crashed
```bash
# View error logs
pm2 logs finvera-backend --err

# Restart application
pm2 restart finvera-backend
```

### Issue: Nginx 502 Bad Gateway
```bash
# Check if backend is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/finvera-api.error.log

# Check backend is listening on port 3000
sudo netstat -tulpn | grep 3000
```

### Issue: Google OAuth not working
```bash
# Verify callback URL in Google Console matches .env
# Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
# Restart backend after changes
pm2 restart finvera-backend
```

---

## Performance Optimization

### MySQL Optimization

```bash
# Edit MySQL configuration
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Add/Update these settings:
[mysqld]
innodb_buffer_pool_size = 2G
max_connections = 200
query_cache_size = 64M
query_cache_limit = 2M
```

### Redis Optimization

```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Set password
requirepass your_redis_password

# Restart Redis
sudo systemctl restart redis
```

### Node.js Memory

```bash
# Update PM2 config for more memory
nano ecosystem.config.js

# Change max_memory_restart
max_memory_restart: '2G'

# Restart
pm2 restart finvera-backend
```

---

## Security Checklist

- ✅ All passwords are strong and unique
- ✅ Firewall is enabled and configured
- ✅ SSL certificate is installed and auto-renewing
- ✅ Database is not accessible from outside
- ✅ Redis has password protection
- ✅ Environment variables are secured
- ✅ File permissions are correct (uploads directory)
- ✅ Regular backups are configured
- ✅ Monitoring is set up
- ✅ Rate limiting is enabled
- ✅ CORS is properly configured
- ✅ All API keys are production keys (not test keys)

---

## Maintenance Commands

```bash
# Update application
cd /var/www/finvera/backend
git pull origin main
npm install --production
pm2 restart finvera-backend

# View application status
pm2 status
pm2 monit

# Restart services
pm2 restart finvera-backend
sudo systemctl restart nginx
sudo systemctl restart mysql
sudo systemctl restart redis

# View logs
pm2 logs finvera-backend
sudo tail -f /var/log/nginx/finvera-api.error.log

# Database backup (manual)
/usr/local/bin/backup-finvera-db.sh
```

---

## Support

For technical support:
- **Email:** info@illusiodesigns.agency
- **Phone:** 7600046416
- **Website:** https://illusiodesigns.agency

---

## Success! 🎉

Your Finvera backend should now be running in production at:
- **API:** https://api.yourdomain.com
- **Health Check:** https://api.yourdomain.com/health
- **Google OAuth:** https://api.yourdomain.com/api/auth/google

**Next Steps:**
1. Deploy frontend application
2. Test all features thoroughly
3. Set up monitoring and alerts
4. Configure backup verification
5. Document any custom configurations

---

**Last Updated:** December 25, 2025  
**Version:** 1.0.0
