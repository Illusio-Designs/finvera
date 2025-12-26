# AWS Deployment Guide - Step by Step

This guide will help you deploy your Finvera backend on AWS using the **Free Tier** for testing purposes.

## 📋 Prerequisites

1. **AWS Account** (Free tier eligible for 12 months)
   - Sign up at https://aws.amazon.com/free/
   - Requires credit card (won't be charged for free tier usage)

2. **AWS Free Tier Includes:**
   - EC2: 750 hours/month of t2.micro (1 year)
   - RDS MySQL: 750 hours/month of db.t2.micro (1 year)
   - S3: 5GB storage, 20,000 GET requests, 2,000 PUT requests (1 year)
   - Elastic IP: 1 free (if attached to running instance)

---

## 🚀 Step 1: Create RDS MySQL Database

### 1.1 Navigate to RDS
1. Go to AWS Console → Search "RDS" → Click "RDS"
2. Click "Create database"

### 1.2 Database Configuration
- **Engine**: MySQL
- **Version**: MySQL 8.0 (or latest)
- **Template**: Free tier
- **DB Instance Identifier**: `finvera-mysql`
- **Master Username**: `admin` (or your choice)
- **Master Password**: Create a strong password (save it!)
- **DB Instance Class**: `db.t2.micro` (Free tier)
- **Storage**: 20 GB (Free tier limit)
- **Storage Type**: General Purpose SSD (gp2)
- **Storage Autoscaling**: Disable (to stay in free tier)

### 1.3 Connectivity Settings
- **VPC**: Default VPC (or create new)
- **Subnet Group**: Default
- **Public Access**: **YES** (for testing, or NO if using same VPC)
- **VPC Security Group**: Create new → Name: `finvera-rds-sg`
- **Availability Zone**: No preference
- **Database Port**: 3306

### 1.4 Database Authentication
- **Database Authentication**: Password authentication

### 1.5 Additional Configuration
- **Initial Database Name**: `finvera_master`
- **Backup Retention**: 7 days (Free tier)
- **Enable Encryption**: Optional (free tier)
- **Enable Enhanced Monitoring**: Disable (costs money)

### 1.6 Create Database
- Click "Create database"
- Wait 5-10 minutes for database to be created

### 1.7 Get Database Endpoint
1. Go to RDS → Databases → Click your database
2. Copy the **Endpoint** (e.g., `finvera-mysql.xxxxx.us-east-1.rds.amazonaws.com`)
3. Save this for later!

---

## 🔒 Step 2: Configure RDS Security Group

### 2.1 Allow MySQL Access
1. Go to RDS → Databases → Click your database
2. Click on **VPC Security Group** link
3. Click "Edit inbound rules"
4. Add rule:
   - **Type**: MySQL/Aurora
   - **Port**: 3306
   - **Source**: 
     - For testing: `0.0.0.0/0` (allows from anywhere - **NOT secure for production**)
     - For production: Your EC2 security group ID
   - **Description**: Allow MySQL from EC2
5. Click "Save rules"

---

## 💻 Step 3: Create EC2 Instance

### 3.1 Launch EC2 Instance
1. Go to AWS Console → Search "EC2" → Click "EC2"
2. Click "Launch Instance"

### 3.2 Configure Instance
- **Name**: `finvera-backend`
- **AMI**: Amazon Linux 2023 (Free tier eligible)
- **Instance Type**: `t2.micro` (Free tier)
- **Key Pair**: 
  - Create new key pair → Name: `finvera-key`
  - Key pair type: RSA
  - File format: `.pem`
  - **Download and save the .pem file securely!**

### 3.3 Network Settings
- **VPC**: Default VPC (same as RDS)
- **Subnet**: Default
- **Auto-assign Public IP**: Enable
- **Security Group**: Create new → Name: `finvera-backend-sg`
- **Inbound Rules**:
  - SSH (22): My IP (or 0.0.0.0/0 for testing)
  - HTTP (80): 0.0.0.0/0
  - HTTPS (443): 0.0.0.0/0
  - Custom TCP (3000): 0.0.0.0/0 (for your API)

### 3.4 Configure Storage
- **Volume Size**: 8 GB (Free tier: 30 GB total)
- **Volume Type**: gp3

### 3.5 Launch Instance
- Click "Launch Instance"
- Wait 1-2 minutes for instance to be ready

### 3.6 Get Public IP
1. Go to EC2 → Instances
2. Click your instance
3. Copy the **Public IPv4 address** (e.g., `54.123.45.67`)

---

## 🔐 Step 4: Connect to EC2 Instance

### 4.1 On Mac/Linux:
```bash
# Make key file executable
chmod 400 finvera-key.pem

# Connect to EC2
ssh -i finvera-key.pem ec2-user@YOUR_PUBLIC_IP
```

### 4.2 On Windows:
Use **PuTTY** or **Windows Terminal**:
1. Convert .pem to .ppk using PuTTYgen (if using PuTTY)
2. Or use WSL/Windows Terminal with the same command as Mac/Linux

---

## 📦 Step 5: Install Dependencies on EC2

Once connected to EC2, run:

```bash
# Update system
sudo yum update -y

# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install MySQL Client (optional, for testing)
sudo yum install -y mysql

# Verify installations
node --version
npm --version
git --version
pm2 --version
```

---

## 📥 Step 6: Clone and Setup Your Backend

```bash
# Create app directory
mkdir -p ~/finvera
cd ~/finvera

# Clone your repository
git clone https://github.com/Illusio-Designs/finvera.git .

# Navigate to backend
cd backend

# Install dependencies
npm install --production

# Create .env file
nano .env
```

### 6.1 Create .env File
Paste this configuration (update with your RDS endpoint):

```env
# Database Configuration (RDS)
DB_HOST=YOUR_RDS_ENDPOINT_HERE
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=YOUR_RDS_PASSWORD_HERE
DB_NAME=finvera_db
MASTER_DB_NAME=finvera_master

# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Application
APP_NAME=Finvera
LOG_LEVEL=info

# Domains (Update with your domain or EC2 IP)
MAIN_DOMAIN=https://finvera.solutions
API_DOMAIN=http://YOUR_EC2_PUBLIC_IP:3000
FRONTEND_URL=https://finvera.solutions
CORS_ORIGIN=https://finvera.solutions,https://www.finvera.solutions,https://client.finvera.solutions,https://admin.finvera.solutions

# Security
ENCRYPTION_KEY=Devils@2609$
PAYLOAD_ENCRYPTION_KEY=Devils@2609$
JWT_SECRET=Devils@2609$
JWT_REFRESH_SECRET=Devils@2609$
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
SESSION_SECRET=Devils@2609$

# Google OAuth (Update with your Render/EC2 URL)
GOOGLE_CLIENT_ID=1065810673450-6mntdfquhqtdjj6hvamkkc6ahekiknng.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=http://YOUR_EC2_PUBLIC_IP:3000/api/auth/google/callback

# Razorpay (if using)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Email (optional)
EMAIL_ENABLED=false
EMAIL_FROM=noreply@finvera.solutions

# Redis (optional, disable for now)
REDIS_ENABLED=false

# File Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
MAX_DSC_CERTIFICATE_SIZE=5242880

# Tenant Configuration
USE_SEPARATE_DB_USERS=false
MAX_TENANT_CONNECTIONS=50

# Database Root User (for provisioning)
DB_ROOT_USER=admin
DB_ROOT_PASSWORD=YOUR_RDS_PASSWORD_HERE
```

**Save and exit**: `Ctrl+X`, then `Y`, then `Enter`

---

## 🗄️ Step 7: Setup S3 for File Storage (Optional but Recommended)

### 7.1 Create S3 Bucket
1. Go to AWS Console → Search "S3" → Click "S3"
2. Click "Create bucket"
3. **Bucket Name**: `finvera-uploads-UNIQUE-ID` (must be globally unique)
4. **Region**: Same as your EC2/RDS (e.g., us-east-1)
5. **Block Public Access**: Uncheck (or configure bucket policy for specific access)
6. **Versioning**: Disable (to save costs)
7. Click "Create bucket"

### 7.2 Create IAM User for S3 Access
1. Go to IAM → Users → Create User
2. **Username**: `finvera-s3-user`
3. **Access Type**: Programmatic access
4. **Permissions**: Attach policy → `AmazonS3FullAccess` (or create custom policy)
5. **Save Access Key ID and Secret Access Key** (you'll need these)

### 7.3 Install AWS SDK (if using S3)
```bash
cd ~/finvera/backend
npm install aws-sdk
```

### 7.4 Update .env with S3 Credentials
```env
# S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
S3_BUCKET_NAME=finvera-uploads-UNIQUE-ID
USE_S3_FOR_UPLOADS=true
```

**Note**: For now, you can skip S3 and use local storage. We'll configure it later if needed.

---

## 🚀 Step 8: Start Your Backend

### 8.1 Test Database Connection
```bash
cd ~/finvera/backend

# Test connection (optional)
mysql -h YOUR_RDS_ENDPOINT -u admin -p
# Enter password, then type: exit
```

### 8.2 Start with PM2
```bash
cd ~/finvera/backend

# Start the application
pm2 start server.js --name finvera-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system reboot
pm2 startup
# Copy and run the command it gives you (starts with sudo)
```

### 8.3 Check Status
```bash
# Check if running
pm2 status

# View logs
pm2 logs finvera-backend

# Monitor
pm2 monit
```

---

## 🌐 Step 9: Setup Nginx Reverse Proxy (Recommended)

### 9.1 Install Nginx
```bash
sudo yum install -y nginx
```

### 9.2 Configure Nginx
```bash
sudo nano /etc/nginx/conf.d/finvera.conf
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;  # Or your domain

    # Increase timeouts for long-running requests
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;

    # API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
}
```

**Save and exit**: `Ctrl+X`, then `Y`, then `Enter`

### 9.3 Test and Start Nginx
```bash
# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

---

## 🔥 Step 10: Configure Firewall

### 10.1 Update Security Group
1. Go to EC2 → Instances → Click your instance
2. Click "Security" tab → Click Security Group
3. Edit inbound rules:
   - **HTTP (80)**: 0.0.0.0/0
   - **HTTPS (443)**: 0.0.0.0/0
   - **Custom TCP (3000)**: 0.0.0.0/0 (or remove if using Nginx only)

### 10.2 Configure EC2 Firewall (if needed)
```bash
# Check if firewalld is running
sudo systemctl status firewalld

# If running, allow ports
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

---

## ✅ Step 11: Test Your Deployment

### 11.1 Test API
```bash
# From your local machine
curl http://YOUR_EC2_PUBLIC_IP/api/health

# Or in browser
http://YOUR_EC2_PUBLIC_IP/api/health
```

### 11.2 Check Logs
```bash
# On EC2
pm2 logs finvera-backend
```

### 11.3 Test Database Connection
- Your backend should automatically connect to RDS on startup
- Check PM2 logs for connection success messages

---

## 🔄 Step 12: Setup Auto-Deployment (Optional)

### 12.1 Using Git + PM2
```bash
# Create deployment script
nano ~/finvera/deploy.sh
```

Paste:
```bash
#!/bin/bash
cd ~/finvera
git pull origin main
cd backend
npm install --production
pm2 restart finvera-backend
```

```bash
# Make executable
chmod +x ~/finvera/deploy.sh
```

### 12.2 Manual Deployment
```bash
# SSH to EC2
ssh -i finvera-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# Pull latest code
cd ~/finvera
git pull origin main

# Install dependencies
cd backend
npm install --production

# Restart
pm2 restart finvera-backend
```

---

## 💰 Step 13: Monitor Costs

### 13.1 AWS Cost Explorer
1. Go to AWS Console → Billing → Cost Explorer
2. Set up billing alerts:
   - Go to Billing → Preferences
   - Enable "Receive Billing Alerts"
   - Go to CloudWatch → Alarms → Create Alarm
   - Metric: EstimatedCharges
   - Threshold: $5 (or your limit)

### 13.2 Free Tier Limits
- **EC2**: 750 hours/month (1 t2.micro instance = 24/7 = ~750 hours)
- **RDS**: 750 hours/month (1 db.t2.micro = 24/7 = ~750 hours)
- **S3**: 5GB storage, 20,000 GET, 2,000 PUT requests
- **Data Transfer**: 15 GB out to internet/month

**Important**: Stop instances when not testing to avoid charges!

---

## 🛠️ Troubleshooting

### Issue: Cannot connect to RDS
- **Check**: Security group allows MySQL (port 3306) from EC2
- **Check**: RDS is in same VPC as EC2
- **Check**: RDS has "Public Access" enabled (for testing)

### Issue: Application not starting
```bash
# Check logs
pm2 logs finvera-backend

# Check if port 3000 is in use
sudo netstat -tulpn | grep 3000

# Restart PM2
pm2 restart finvera-backend
```

### Issue: Out of memory
- **Solution**: Upgrade to t2.small (not free tier) or optimize your app

### Issue: Database connection timeout
- **Check**: RDS endpoint is correct
- **Check**: Security group rules
- **Check**: RDS is running (not stopped)

---

## 📝 Next Steps

1. **Domain Setup**: Point your domain to EC2 IP using Route 53 or your DNS provider
2. **SSL Certificate**: Setup Let's Encrypt with Certbot for HTTPS
3. **Backup Strategy**: Setup automated RDS backups
4. **Monitoring**: Setup CloudWatch alarms
5. **S3 Integration**: Move file uploads to S3 for better scalability

---

## 🎯 Quick Reference

- **EC2 Public IP**: `http://YOUR_EC2_PUBLIC_IP`
- **RDS Endpoint**: `YOUR_RDS_ENDPOINT.region.rds.amazonaws.com`
- **SSH Command**: `ssh -i finvera-key.pem ec2-user@YOUR_EC2_PUBLIC_IP`
- **PM2 Commands**:
  - `pm2 status` - Check status
  - `pm2 logs` - View logs
  - `pm2 restart finvera-backend` - Restart
  - `pm2 stop finvera-backend` - Stop
  - `pm2 delete finvera-backend` - Remove

---

## ⚠️ Important Notes

1. **Free Tier Expires**: After 12 months, you'll be charged
2. **Stop Instances**: Always stop EC2 and RDS when not testing
3. **Security**: Don't use `0.0.0.0/0` in production security groups
4. **Backups**: Setup automated backups before going to production
5. **Monitoring**: Enable CloudWatch to track usage

---

**Need Help?** Check AWS documentation or create an issue in your repository.

