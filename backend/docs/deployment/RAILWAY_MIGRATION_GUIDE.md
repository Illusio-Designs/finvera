# 🔄 Migration Guide: Railway → Oracle Cloud

When to migrate and how to do it smoothly.

---

## 📊 When to Migrate

Migrate from Railway to Oracle Cloud when:

- ✅ Storage usage > 900MB (approaching 1GB limit)
- ✅ More than 40-50 tenant databases
- ✅ Monthly Railway costs > $20
- ✅ Need more than 512MB RAM
- ✅ Need more control over infrastructure
- ✅ Want truly free hosting forever

---

## 💎 Oracle Cloud Always Free Tier

**What you get (FOREVER FREE):**
- 2 VMs with 1GB RAM each (ARM or AMD)
- 200GB block storage
- 10TB bandwidth/month
- 2 Autonomous Databases (20GB each)
- Load balancer
- Object storage (10GB)

**Perfect for:**
- 100+ tenant databases
- Full control
- No time limits
- No credit card charges

---

## 🚀 Migration Steps

### Phase 1: Preparation (1 hour)

1. **Backup Railway Database**
   ```bash
   # In Railway dashboard
   # MySQL service → Connect → Copy connection string
   
   # On your local machine
   mysqldump -h RAILWAY_HOST -u RAILWAY_USER -p \
     --all-databases > railway_backup.sql
   ```

2. **Document Current Setup**
   - List all environment variables
   - Note all tenant databases
   - Export user data
   - Save configuration files

3. **Test Backup**
   ```bash
   # Verify backup file
   ls -lh railway_backup.sql
   
   # Check backup integrity
   head -n 50 railway_backup.sql
   ```

---

### Phase 2: Oracle Cloud Setup (30 minutes)

1. **Create Oracle Cloud Account**
   - Go to https://www.oracle.com/cloud/free/
   - Sign up (requires credit card but won't charge)
   - Verify email
   - Complete identity verification

2. **Create Compute Instance**
   - Dashboard → Compute → Instances
   - Click "Create Instance"
   - Choose:
     - Name: finvera-backend
     - Image: Ubuntu 22.04
     - Shape: VM.Standard.A1.Flex (ARM, 1 OCPU, 6GB RAM) - FREE
     - Or: VM.Standard.E2.1.Micro (AMD, 1GB RAM) - FREE
   - Add SSH key (generate if needed)
   - Create

3. **Configure Firewall**
   - Instance → Subnet → Security List
   - Add Ingress Rules:
     - Port 80 (HTTP)
     - Port 443 (HTTPS)
     - Port 3000 (API)
     - Port 3306 (MySQL) - only from your IP

---

### Phase 3: Server Setup (30 minutes)

1. **Connect to Instance**
   ```bash
   ssh -i ~/.ssh/oracle_key ubuntu@YOUR_INSTANCE_IP
   ```

2. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install MySQL
   sudo apt install -y mysql-server
   
   # Install Redis
   sudo apt install -y redis-server
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install -y nginx
   ```

3. **Configure MySQL**
   ```bash
   # Secure MySQL
   sudo mysql_secure_installation
   
   # Create database user
   sudo mysql
   ```
   
   ```sql
   CREATE USER 'finvera'@'localhost' IDENTIFIED BY 'your-strong-password';
   GRANT ALL PRIVILEGES ON *.* TO 'finvera'@'localhost' WITH GRANT OPTION;
   FLUSH PRIVILEGES;
   EXIT;
   ```

4. **Configure Redis**
   ```bash
   sudo systemctl enable redis-server
   sudo systemctl start redis-server
   ```

---

### Phase 4: Deploy Application (30 minutes)

1. **Clone Repository**
   ```bash
   cd /home/ubuntu
   git clone https://github.com/your-username/finvera.git
   cd finvera/backend
   ```

2. **Install Dependencies**
   ```bash
   npm install --production
   ```

3. **Create Environment File**
   ```bash
   nano .env
   ```
   
   Paste your Railway environment variables (update DB credentials):
   ```bash
   NODE_ENV=production
   PORT=3000
   
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=finvera
   DB_PASSWORD=your-strong-password
   DB_NAME=finvera_db
   MASTER_DB_NAME=finvera_master
   
   JWT_SECRET=your-jwt-secret
   ENCRYPTION_KEY=your-encryption-key
   
   REDIS_ENABLED=true
   REDIS_HOST=localhost
   REDIS_PORT=6379
   
   # ... rest of your variables
   ```

4. **Restore Database**
   ```bash
   mysql -u finvera -p < railway_backup.sql
   ```

5. **Run Migrations**
   ```bash
   npm run migrate
   ```

6. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

---

### Phase 5: Configure Nginx (15 minutes)

1. **Create Nginx Config**
   ```bash
   sudo nano /etc/nginx/sites-available/finvera
   ```
   
   ```nginx
   server {
       listen 80;
       server_name your-domain.com api.your-domain.com;
   
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

2. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/finvera /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

3. **Install SSL Certificate**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com -d api.your-domain.com
   ```

---

### Phase 6: Testing (30 minutes)

1. **Test Health Endpoint**
   ```bash
   curl http://YOUR_INSTANCE_IP:3000/health
   ```

2. **Test API**
   ```bash
   curl http://YOUR_INSTANCE_IP:3000/api
   ```

3. **Test Database Connection**
   ```bash
   mysql -u finvera -p -e "SHOW DATABASES;"
   ```

4. **Check PM2 Status**
   ```bash
   pm2 status
   pm2 logs
   ```

5. **Monitor Resources**
   ```bash
   htop
   df -h
   free -h
   ```

---

### Phase 7: DNS Update (5 minutes)

1. **Update DNS Records**
   - Point your domain to Oracle instance IP
   - A record: `api.your-domain.com` → `ORACLE_IP`
   - Wait for DNS propagation (5-30 minutes)

2. **Test Domain**
   ```bash
   curl https://api.your-domain.com/health
   ```

---

### Phase 8: Update Frontend (5 minutes)

Update frontend environment variables:
```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
```

Redeploy frontend.

---

### Phase 9: Monitor & Verify (1 hour)

1. **Monitor Logs**
   ```bash
   pm2 logs --lines 100
   tail -f /var/log/nginx/access.log
   tail -f /var/log/nginx/error.log
   ```

2. **Test All Endpoints**
   - Login
   - Create tenant
   - Create voucher
   - Upload file
   - WebSocket connection

3. **Monitor Performance**
   ```bash
   pm2 monit
   ```

---

### Phase 10: Cleanup Railway (After 24 hours)

Once everything is working on Oracle:

1. **Verify Everything Works**
   - All features functional
   - No errors in logs
   - Frontend connected
   - Users can access

2. **Delete Railway Services**
   - Railway dashboard → Project → Settings → Delete
   - This stops billing

---

## 📊 Comparison

| Feature | Railway | Oracle Cloud |
|---------|---------|--------------|
| **Cost** | $5-20/mo | $0 forever |
| **Storage** | 1GB | 200GB |
| **RAM** | 512MB | 1-6GB |
| **Databases** | Limited | Unlimited |
| **Setup Time** | 5 min | 1 hour |
| **Maintenance** | None | Manual |
| **Auto-deploy** | Yes | No (setup CI/CD) |
| **Backups** | Automatic | Manual |

---

## 🔧 Post-Migration Setup

### 1. Automated Backups
```bash
# Create backup script
nano /home/ubuntu/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u finvera -p'your-password' --all-databases > /home/ubuntu/backups/backup_$DATE.sql
find /home/ubuntu/backups -name "backup_*.sql" -mtime +7 -delete
```

```bash
chmod +x /home/ubuntu/backup.sh
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

### 2. Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Setup PM2 monitoring
pm2 install pm2-logrotate
```

### 3. Security
```bash
# Setup firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

---

## 💡 Tips

1. **Test migration on a separate instance first**
2. **Keep Railway running for 24-48 hours as backup**
3. **Monitor Oracle instance closely for first week**
4. **Set up alerts for disk space, CPU, memory**
5. **Document your Oracle setup for team**

---

## 🆘 Rollback Plan

If migration fails:

1. **Keep Railway running** (don't delete immediately)
2. **Update DNS back to Railway**
3. **Investigate issues on Oracle**
4. **Try migration again when ready**

---

## 📞 Support

- Oracle Cloud Docs: https://docs.oracle.com/en-us/iaas/
- Oracle Support: https://www.oracle.com/support/
- Community: https://community.oracle.com/

---

**Estimated Total Migration Time: 3-4 hours**

**Difficulty: Intermediate** (requires basic Linux/DevOps knowledge)

**Cost Savings: $5-20/month → $0/month** 💰
