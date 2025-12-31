# Deploy to EC2 - Quick Start Guide

## Your EC2 Instance Details
- **Public IP**: `34.235.152.48`
- **Instance ID**: `i-0c1b5368b25fed70a`
- **Region**: `us-east-1`

## Quick Deployment

### Step 1: Connect to EC2
```bash
ssh -i your-key.pem ec2-user@34.235.152.48
# or for Ubuntu:
ssh -i your-key.pem ubuntu@34.235.152.48
```

### Step 2: Run Deployment
```bash
# Clone repository
git clone https://github.com/Illusio-Designs/finvera.git
cd finvera/backend

# Set environment variables first (get from .env or AWS Console)
export RDS_PASSWORD="your-rds-password"
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"

# Run deployment script with all configuration
# Set AWS credentials first (get from .env file or AWS Console):
export AWS_ACCESS_KEY_ID="your-access-key-here"
export AWS_SECRET_ACCESS_KEY="your-secret-key-here"
export RDS_PASSWORD="your-rds-password-here"

# Then run deployment:
RDS_ENDPOINT="finvera-mysql-db.cefq60scawxf.us-east-1.rds.amazonaws.com" \
RDS_USER="finvera_admin" \
RDS_PASSWORD="${RDS_PASSWORD}" \
RDS_DB="finvera_db" \
AWS_REGION="us-east-1" \
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
S3_BUCKET="finvera-backend-storage" \
MAIN_DOMAIN="finvera.solutions" \
API_DOMAIN="api.finvera.solutions" \
FRONTEND_URL="https://client.finvera.solutions" \
./deploy.sh
```

### Step 3: Verify Deployment
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs finvera-backend

# Test health endpoint
curl http://localhost:3000/health

# Check Nginx
sudo systemctl status nginx
```

## What the Script Does

1. ✅ Updates system packages
2. ✅ Installs Node.js 20
3. ✅ Installs PM2, Nginx, MySQL client, Redis
4. ✅ Clones/updates repository
5. ✅ Creates `.env` file with all configuration
6. ✅ Tests RDS database connection
7. ✅ Runs database migrations
8. ✅ Sets up PM2 process manager
9. ✅ Configures Nginx reverse proxy
10. ✅ Starts application

## After Deployment

Your application will be available at:
- **Local**: `http://localhost:3000`
- **Via Nginx**: `http://34.235.152.48` (if domain not configured)
- **Production**: `https://api.finvera.solutions` (after DNS setup)

## Troubleshooting

### If deployment fails:
```bash
# Check logs
pm2 logs finvera-backend

# Restart application
pm2 restart finvera-backend

# Check database connection
mysql -h finvera-mysql-db.cefq60scawxf.us-east-1.rds.amazonaws.com -u finvera_admin -p
```

### If RDS connection fails:
- Check RDS security group allows MySQL (port 3306) from EC2 security group
- Verify RDS instance is running (not stopped)
- Check password is correct

## Next Steps

1. **Setup Domain**: Point `api.finvera.solutions` to EC2 IP (34.235.152.48)
2. **Setup SSL**: Use Let's Encrypt for HTTPS
3. **Monitor**: Setup CloudWatch monitoring
4. **Backup**: Configure automated RDS backups

