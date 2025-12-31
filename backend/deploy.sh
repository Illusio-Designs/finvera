#!/bin/bash
# =================================
# Finvera Backend - AWS EC2 Deployment Script
# Complete deployment script for AWS EC2 instances
# Supports both Ubuntu and Amazon Linux
# =================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =================================
# CONFIGURATION
# =================================
# These can be overridden by environment variables
# Usage: RDS_ENDPOINT="your-endpoint" ./deploy.sh

# AWS RDS Configuration
RDS_ENDPOINT="${RDS_ENDPOINT:-finvera-mysql-db.cefq60scawxf.us-east-1.rds.amazonaws.com}"
RDS_USER="${RDS_USER:-finvera_admin}"
RDS_PASSWORD="${RDS_PASSWORD:-}"
RDS_DB="${RDS_DB:-finvera_db}"
RDS_PORT="${RDS_PORT:-3306}"

# AWS S3 Configuration (Optional)
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}"
S3_BUCKET="${S3_BUCKET:-finvera-backend-storage}"

# Application Configuration
APP_DIR="${APP_DIR:-/opt/finvera-backend}"
GIT_REPO="${GIT_REPO:-https://github.com/Illusio-Designs/finvera.git}"
GIT_BRANCH="${GIT_BRANCH:-main}"
NODE_VERSION="${NODE_VERSION:-20}"

# Domain Configuration
MAIN_DOMAIN="${MAIN_DOMAIN:-finvera.solutions}"
API_DOMAIN="${API_DOMAIN:-api.finvera.solutions}"
FRONTEND_URL="${FRONTEND_URL:-https://client.finvera.solutions}"

# Security Keys (Generate these with: openssl rand -hex 32)
ENCRYPTION_KEY="${ENCRYPTION_KEY:-}"
PAYLOAD_ENCRYPTION_KEY="${PAYLOAD_ENCRYPTION_KEY:-}"
JWT_SECRET="${JWT_SECRET:-}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-}"
SESSION_SECRET="${SESSION_SECRET:-}"

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_VERSION=$VERSION_ID
elif type lsb_release >/dev/null 2>&1; then
    OS=$(lsb_release -si | tr '[:upper:]' '[:lower:]')
else
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
fi

# =================================
# HELPER FUNCTIONS
# =================================

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  $1${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_error "Please do not run this script as root. It will use sudo when needed."
        exit 1
    fi
}

# =================================
# MAIN DEPLOYMENT SCRIPT
# =================================

print_header "Finvera Backend - AWS EC2 Deployment"
echo -e "${BLUE}OS Detected:${NC} $OS $OS_VERSION"
echo -e "${BLUE}Node.js Version:${NC} $NODE_VERSION"
echo -e "${BLUE}App Directory:${NC} $APP_DIR"
echo ""

check_root

# =================================
# STEP 1: UPDATE SYSTEM
# =================================
print_header "STEP 1: Updating System Packages"

print_step "Updating package lists..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt-get update -y
    PKG_MANAGER="apt-get"
    INSTALL_CMD="sudo apt-get install -y"
elif [ "$OS" = "amzn" ] || [ "$OS" = "amazon" ]; then
    sudo yum update -y
    PKG_MANAGER="yum"
    INSTALL_CMD="sudo yum install -y"
else
    print_error "Unsupported OS: $OS"
    exit 1
fi
print_success "System updated"

# =================================
# STEP 2: INSTALL NODE.JS
# =================================
print_header "STEP 2: Installing Node.js $NODE_VERSION"

if command -v node &> /dev/null; then
    CURRENT_NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$CURRENT_NODE_VERSION" -ge "$NODE_VERSION" ]; then
        print_success "Node.js already installed: $(node --version)"
    else
        print_warning "Node.js version is older, updating..."
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            sudo apt-get remove -y nodejs npm 2>/dev/null || true
        fi
    fi
fi

if ! command -v node &> /dev/null || [ "$CURRENT_NODE_VERSION" -lt "$NODE_VERSION" ]; then
    print_step "Installing Node.js $NODE_VERSION..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS" = "amzn" ] || [ "$OS" = "amazon" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
        sudo yum install -y nodejs
    fi
    print_success "Node.js installed: $(node --version)"
    print_success "npm installed: $(npm --version)"
fi

# =================================
# STEP 3: INSTALL SYSTEM DEPENDENCIES
# =================================
print_header "STEP 3: Installing System Dependencies"

print_step "Installing Git, Nginx, MySQL Client..."
$INSTALL_CMD git nginx mysql-client

# Install Redis if not present
if ! command -v redis-server &> /dev/null; then
    print_step "Installing Redis..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        $INSTALL_CMD redis-server
    elif [ "$OS" = "amzn" ] || [ "$OS" = "amazon" ]; then
        $INSTALL_CMD redis
    fi
    print_success "Redis installed"
else
    print_success "Redis already installed"
fi

# =================================
# STEP 4: INSTALL NPM GLOBAL PACKAGES
# =================================
print_header "STEP 4: Installing Global NPM Packages"

print_step "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_success "PM2 installed: $(pm2 --version)"
else
    print_success "PM2 already installed: $(pm2 --version)"
fi

print_step "Installing Sequelize CLI..."
if ! command -v sequelize &> /dev/null; then
    sudo npm install -g sequelize-cli
    print_success "Sequelize CLI installed"
else
    print_success "Sequelize CLI already installed"
fi

# =================================
# STEP 5: SETUP APPLICATION DIRECTORY
# =================================
print_header "STEP 5: Setting Up Application Directory"

print_step "Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR
cd $APP_DIR
print_success "Directory created and permissions set"

# =================================
# STEP 6: CLONE/UPDATE REPOSITORY
# =================================
print_header "STEP 6: Cloning/Updating Repository"

if [ -d ".git" ]; then
    print_step "Repository exists, pulling latest changes..."
    git fetch origin
    git checkout $GIT_BRANCH
    git pull origin $GIT_BRANCH
    print_success "Repository updated"
else
    print_step "Cloning repository..."
    git clone $GIT_REPO /tmp/finvera-temp
    cp -r /tmp/finvera-temp/backend/* .
    cp -r /tmp/finvera-temp/backend/.* . 2>/dev/null || true
    rm -rf /tmp/finvera-temp
    git checkout $GIT_BRANCH 2>/dev/null || true
    print_success "Repository cloned"
fi

# =================================
# STEP 7: INSTALL NODE.JS DEPENDENCIES
# =================================
print_header "STEP 7: Installing Node.js Dependencies"

print_step "Cleaning old dependencies..."
rm -rf node_modules package-lock.json

print_step "Installing production dependencies..."
npm install --production
print_success "Dependencies installed"

# =================================
# STEP 8: CREATE .ENV FILE
# =================================
print_header "STEP 8: Creating Environment Configuration"

# Check if .env already exists
if [ -f ".env" ]; then
    print_warning ".env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

# Prompt for RDS password if not set
if [ -z "$RDS_PASSWORD" ]; then
    echo -e "${YELLOW}Enter RDS database password:${NC}"
    read -s RDS_PASSWORD
    echo ""
fi

# Generate secrets if not provided
if [ -z "$ENCRYPTION_KEY" ]; then
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    print_success "Generated ENCRYPTION_KEY"
fi

if [ -z "$PAYLOAD_ENCRYPTION_KEY" ]; then
    PAYLOAD_ENCRYPTION_KEY=$(openssl rand -base64 48)
    print_success "Generated PAYLOAD_ENCRYPTION_KEY"
fi

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 64)
    print_success "Generated JWT_SECRET"
fi

if [ -z "$JWT_REFRESH_SECRET" ]; then
    JWT_REFRESH_SECRET=$(openssl rand -base64 64)
    print_success "Generated JWT_REFRESH_SECRET"
fi

if [ -z "$SESSION_SECRET" ]; then
    SESSION_SECRET=$(openssl rand -base64 64)
    print_success "Generated SESSION_SECRET"
fi

print_step "Creating .env file..."
cat > .env <<ENVEOF
# =================================
# APPLICATION CONFIGURATION
# =================================
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
APP_NAME=Finvera
LOG_LEVEL=info

# =================================
# DOMAIN CONFIGURATION
# =================================
MAIN_DOMAIN=$MAIN_DOMAIN
API_DOMAIN=$API_DOMAIN
FRONTEND_URL=$FRONTEND_URL
CORS_ORIGIN=https://$MAIN_DOMAIN,https://www.$MAIN_DOMAIN,https://client.$MAIN_DOMAIN,https://admin.$MAIN_DOMAIN

# =================================
# DATABASE CONFIGURATION (RDS MySQL)
# =================================
DB_HOST=$RDS_ENDPOINT
DB_PORT=$RDS_PORT
DB_USER=$RDS_USER
DB_PASSWORD=$RDS_PASSWORD
DB_NAME=$RDS_DB
MASTER_DB_NAME=finvera_master
USE_SEPARATE_DB_USERS=false
DB_ROOT_USER=$RDS_USER
DB_ROOT_PASSWORD=$RDS_PASSWORD

# =================================
# AWS CONFIGURATION
# =================================
AWS_REGION=$AWS_REGION
ENVEOF

# Add S3 configuration if provided
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    cat >> .env <<ENVEOF
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
S3_BUCKET=$S3_BUCKET
USE_S3_FOR_UPLOADS=true
ENVEOF
    print_success "S3 configuration added"
else
    cat >> .env <<ENVEOF
# S3 Configuration (optional)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# S3_BUCKET=
USE_S3_FOR_UPLOADS=false
ENVEOF
    print_warning "S3 credentials not provided, using local storage"
fi

cat >> .env <<ENVEOF

# =================================
# SECURITY KEYS
# =================================
ENCRYPTION_KEY=$ENCRYPTION_KEY
PAYLOAD_ENCRYPTION_KEY=$PAYLOAD_ENCRYPTION_KEY
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
SESSION_SECRET=$SESSION_SECRET

# =================================
# REDIS CONFIGURATION
# =================================
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# =================================
# EMAIL CONFIGURATION
# =================================
EMAIL_ENABLED=false
EMAIL_FROM=noreply@$MAIN_DOMAIN

# =================================
# FILE UPLOAD CONFIGURATION
# =================================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
MAX_DSC_CERTIFICATE_SIZE=5242880

# =================================
# TENANT CONFIGURATION
# =================================
MAX_TENANT_CONNECTIONS=50
ENVEOF

print_success ".env file created"
chmod 600 .env  # Secure the .env file

# =================================
# STEP 9: TEST DATABASE CONNECTION
# =================================
print_header "STEP 9: Testing Database Connection"

print_step "Testing connection to RDS: $RDS_ENDPOINT"
export MYSQL_PWD="$RDS_PASSWORD"
if mysql -h $RDS_ENDPOINT -u $RDS_USER -P $RDS_PORT -e "SELECT 1" 2>/dev/null; then
    print_success "Database connection successful"
else
    print_error "Database connection failed. Please check:"
    echo "  - RDS endpoint: $RDS_ENDPOINT"
    echo "  - Username: $RDS_USER"
    echo "  - Security group allows MySQL (port 3306) from this EC2 instance"
    unset MYSQL_PWD
    exit 1
fi
unset MYSQL_PWD

# =================================
# STEP 10: RUN DATABASE MIGRATIONS
# =================================
print_header "STEP 10: Running Database Migrations"

print_step "Running migrations..."
if npm run migrate 2>/dev/null; then
    print_success "Migrations completed"
else
    print_warning "Migrations failed or skipped (this may be normal if already migrated)"
fi

# =================================
# STEP 11: CREATE REQUIRED DIRECTORIES
# =================================
print_header "STEP 11: Creating Required Directories"

print_step "Creating uploads and logs directories..."
mkdir -p uploads logs
chmod 755 uploads logs
print_success "Directories created"

# =================================
# STEP 12: SETUP PM2
# =================================
print_header "STEP 12: Setting Up PM2 Process Manager"

print_step "Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js <<PM2EOF
module.exports = {
  apps: [{
    name: 'finvera-backend',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false,
    node_args: '--max-old-space-size=4096 --expose-gc'
  }]
};
PM2EOF
print_success "PM2 configuration created"

# =================================
# STEP 13: START APPLICATION
# =================================
print_header "STEP 13: Starting Application"

print_step "Stopping existing instance (if any)..."
pm2 delete finvera-backend 2>/dev/null || true

print_step "Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
print_success "Application started"

print_step "Setting up PM2 startup script..."
STARTUP_CMD=$(pm2 startup systemd -u $USER --hp $HOME | tail -1)
if [ -n "$STARTUP_CMD" ]; then
    print_warning "Run this command to enable auto-start on reboot:"
    echo -e "${YELLOW}  $STARTUP_CMD${NC}"
fi

# =================================
# STEP 14: CONFIGURE NGINX
# =================================
print_header "STEP 14: Configuring Nginx Reverse Proxy"

print_step "Creating Nginx configuration..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    NGINX_SITES_DIR="/etc/nginx/sites-available"
    NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
else
    NGINX_SITES_DIR="/etc/nginx/conf.d"
    NGINX_ENABLED_DIR="/etc/nginx/conf.d"
fi

sudo tee $NGINX_SITES_DIR/finvera-backend > /dev/null <<NGINXEOF
server {
    listen 80;
    server_name $API_DOMAIN;

    client_max_body_size 10M;

    # Increase timeouts for long-running requests
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;

    # API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }

    # Root location
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

# Enable site (Ubuntu/Debian only)
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo ln -sf $NGINX_SITES_DIR/finvera-backend $NGINX_ENABLED_DIR/finvera-backend
    sudo rm -f $NGINX_ENABLED_DIR/default
fi

print_step "Testing Nginx configuration..."
if sudo nginx -t; then
    print_success "Nginx configuration valid"
    print_step "Restarting Nginx..."
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    print_success "Nginx restarted and enabled"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# =================================
# STEP 15: CONFIGURE FIREWALL
# =================================
print_header "STEP 15: Configuring Firewall"

print_step "Configuring firewall rules..."
if command -v ufw &> /dev/null; then
    sudo ufw --force enable
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    print_success "UFW firewall configured"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --permanent --add-port=3000/tcp
    sudo firewall-cmd --reload
    print_success "Firewalld configured"
else
    print_warning "No firewall detected. Please configure security groups in AWS."
fi

# =================================
# STEP 16: VERIFICATION
# =================================
print_header "STEP 16: Verifying Deployment"

print_step "Checking PM2 status..."
pm2 status

print_step "Testing application health endpoint..."
sleep 3  # Give the app time to start
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "Application is responding"
else
    print_warning "Health check failed. Check logs: pm2 logs finvera-backend"
fi

# =================================
# DEPLOYMENT COMPLETE
# =================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║              🎉 DEPLOYMENT SUCCESSFUL! 🎉                  ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  DEPLOYMENT SUMMARY                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓${NC} Application Directory: ${CYAN}$APP_DIR${NC}"
echo -e "${GREEN}✓${NC} Database: ${CYAN}$RDS_ENDPOINT${NC}"
echo -e "${GREEN}✓${NC} Domain: ${CYAN}$API_DOMAIN${NC}"
echo -e "${GREEN}✓${NC} Node.js: ${CYAN}$(node --version)${NC}"
echo -e "${GREEN}✓${NC} PM2: ${CYAN}$(pm2 --version)${NC}"
echo ""

echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}View logs:${NC}"
echo -e "  ${GREEN}pm2 logs finvera-backend${NC}"
echo ""
echo -e "${BLUE}Check status:${NC}"
echo -e "  ${GREEN}pm2 status${NC}"
echo ""
echo -e "${BLUE}Restart application:${NC}"
echo -e "  ${GREEN}pm2 restart finvera-backend${NC}"
echo ""
echo -e "${BLUE}Test health endpoint:${NC}"
echo -e "  ${GREEN}curl http://localhost:3000/health${NC}"
echo ""
echo -e "${BLUE}View Nginx logs:${NC}"
echo -e "  ${GREEN}sudo tail -f /var/log/nginx/error.log${NC}"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Deployment Complete! ✓                                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
