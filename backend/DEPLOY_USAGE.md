# AWS EC2 Deployment Script Usage Guide

## Overview

The `deploy.sh` script automates the complete deployment of the Finvera backend to an AWS EC2 instance. It handles:
- System updates
- Node.js installation
- Dependencies installation
- Database configuration
- PM2 setup
- Nginx reverse proxy configuration
- Firewall setup

## Prerequisites

1. **AWS EC2 Instance** running Ubuntu 20.04+ or Amazon Linux 2023
2. **RDS MySQL Database** already created
3. **SSH Access** to the EC2 instance
4. **Security Groups** configured:
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80) and HTTPS (port 443) from anywhere
   - RDS security group allows MySQL (port 3306) from EC2 security group

## Quick Start

### 1. Connect to Your EC2 Instance

```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
# or for Ubuntu:
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### 2. Download the Script

```bash
# Option 1: Clone the repository
git clone https://github.com/Illusio-Designs/finvera.git
cd finvera/backend

# Option 2: Download just the script
wget https://raw.githubusercontent.com/Illusio-Designs/finvera/main/backend/deploy.sh
chmod +x deploy.sh
```

### 3. Run the Script

#### Basic Usage (with prompts):
```bash
./deploy.sh
```

The script will prompt you for the RDS password if not provided.

#### Advanced Usage (with environment variables):
```bash
RDS_ENDPOINT="your-rds-endpoint.rds.amazonaws.com" \
RDS_USER="admin" \
RDS_PASSWORD="your-password" \
RDS_DB="finvera_db" \
AWS_REGION="us-east-1" \
./deploy.sh
```

#### Full Configuration:
```bash
RDS_ENDPOINT="finvera-mysql-db.cefq60scawxf.us-east-1.rds.amazonaws.com" \
RDS_USER="finvera_admin" \
RDS_PASSWORD="your-secure-password" \
RDS_DB="finvera_db" \
AWS_REGION="us-east-1" \
AWS_ACCESS_KEY_ID="AKIA..." \
AWS_SECRET_ACCESS_KEY="your-secret-key" \
S3_BUCKET="finvera-backend-storage" \
MAIN_DOMAIN="finvera.solutions" \
API_DOMAIN="api.finvera.solutions" \
FRONTEND_URL="https://client.finvera.solutions" \
./deploy.sh
```

## Configuration Options

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `RDS_ENDPOINT` | RDS MySQL endpoint | `finvera-mysql-db.xxxxx.us-east-1.rds.amazonaws.com` |
| `RDS_USER` | RDS database username | `admin` |
| `RDS_PASSWORD` | RDS database password | `your-password` |
| `RDS_DB` | Main database name | `finvera_db` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RDS_PORT` | RDS MySQL port | `3306` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key (for S3) | (empty) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (for S3) | (empty) |
| `S3_BUCKET` | S3 bucket name | `finvera-backend-storage` |
| `APP_DIR` | Application directory | `/opt/finvera-backend` |
| `GIT_REPO` | Git repository URL | `https://github.com/Illusio-Designs/finvera.git` |
| `GIT_BRANCH` | Git branch to deploy | `main` |
| `NODE_VERSION` | Node.js version | `20` |
| `MAIN_DOMAIN` | Main domain | `finvera.solutions` |
| `API_DOMAIN` | API domain | `api.finvera.solutions` |
| `FRONTEND_URL` | Frontend URL | `https://client.finvera.solutions` |

### Security Keys

The script will automatically generate secure keys if not provided:
- `ENCRYPTION_KEY` - 32-character hex key
- `PAYLOAD_ENCRYPTION_KEY` - Base64 encoded key
- `JWT_SECRET` - 64-character base64 secret
- `JWT_REFRESH_SECRET` - 64-character base64 secret
- `SESSION_SECRET` - 64-character base64 secret

**Important**: Save these keys securely! They are displayed during deployment.

## What the Script Does

1. **System Updates**: Updates all system packages
2. **Node.js Installation**: Installs Node.js 20 (or specified version)
3. **Dependencies**: Installs Git, Nginx, MySQL client, Redis
4. **Global Packages**: Installs PM2 and Sequelize CLI
5. **Application Setup**: Clones/updates repository
6. **Dependencies**: Installs npm packages
7. **Configuration**: Creates `.env` file with all settings
8. **Database**: Tests RDS connection and runs migrations
9. **PM2 Setup**: Configures and starts application with PM2
10. **Nginx**: Sets up reverse proxy
11. **Firewall**: Configures UFW or Firewalld
12. **Verification**: Tests application health

## Post-Deployment Steps

### 1. Verify Application

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs finvera-backend

# Test health endpoint
curl http://localhost:3000/health
```

### 2. Configure Domain (if using custom domain)

1. Point your domain's A record to EC2 public IP
2. Update DNS settings:
   - `api.finvera.solutions` → EC2 Public IP
3. Setup SSL certificate (Let's Encrypt):
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.finvera.solutions
   ```

### 3. Enable Auto-Start on Reboot

The script will show you a command to run. It looks like:
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Run the exact command shown by the script.

## Troubleshooting

### Database Connection Failed

**Error**: `Database connection failed`

**Solutions**:
1. Check RDS endpoint is correct
2. Verify RDS security group allows MySQL (port 3306) from EC2 security group
3. Check RDS username and password
4. Ensure RDS instance is running (not stopped)

### Application Won't Start

**Check logs**:
```bash
pm2 logs finvera-backend
```

**Common issues**:
- Missing environment variables in `.env`
- Database connection issues
- Port 3000 already in use
- Missing dependencies

### Nginx Configuration Error

**Test configuration**:
```bash
sudo nginx -t
```

**View error logs**:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Permission Denied

**Fix permissions**:
```bash
sudo chown -R $USER:$USER /opt/finvera-backend
chmod +x deploy.sh
```

## Updating Deployment

To update your deployment:

```bash
cd /opt/finvera-backend
git pull origin main
npm install --production
pm2 restart finvera-backend
```

Or run the full deployment script again (it will update existing installation).

## Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use strong passwords** - Generate secure passwords for RDS
3. **Restrict security groups** - Only allow necessary ports
4. **Rotate keys regularly** - Change encryption keys periodically
5. **Enable SSL/TLS** - Use Let's Encrypt for HTTPS
6. **Monitor logs** - Regularly check application and Nginx logs
7. **Keep system updated** - Run `sudo apt-get update && sudo apt-get upgrade` regularly

## Manual Configuration

If you prefer to configure manually, the script creates:
- `.env` file in `$APP_DIR`
- `ecosystem.config.js` for PM2
- Nginx configuration in `/etc/nginx/sites-available/finvera-backend`

You can edit these files directly if needed.

## Support

For issues or questions:
1. Check the logs: `pm2 logs finvera-backend`
2. Review this guide
3. Check AWS documentation
4. Create an issue in the repository

## Example Full Deployment

```bash
# 1. Connect to EC2
ssh -i finvera-key.pem ubuntu@34.235.152.48

# 2. Clone repository
git clone https://github.com/Illusio-Designs/finvera.git
cd finvera/backend

# 3. Run deployment with all variables
RDS_ENDPOINT="finvera-mysql-db.cefq60scawxf.us-east-1.rds.amazonaws.com" \
RDS_USER="finvera_admin" \
RDS_PASSWORD="7c!BBo\$PzDxo!S4\$" \
RDS_DB="finvera_db" \
AWS_REGION="us-east-1" \
./deploy.sh

# 4. Verify
pm2 status
curl http://localhost:3000/health
```

---

**Note**: Replace all example values with your actual AWS resources!

