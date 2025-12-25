#!/bin/bash

###############################################################################
# Finvera Backend - Full Deployment Script
# Uploads complete backend with directory structure (excludes node_modules, etc.)
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Finvera Backend - Full Deployment                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load FTP configuration
if [ -f ".ftpconfig" ]; then
    source .ftpconfig
else
    echo -e "${RED}✗${NC} .ftpconfig not found!"
    exit 1
fi

echo -e "${GREEN}✓${NC} FTP Host: $FTP_HOST"
echo -e "${GREEN}✓${NC} FTP User: $FTP_USER"
echo -e "${GREEN}✓${NC} Remote Path: $FTP_REMOTE_PATH"
echo ""

# Check lftp
if ! command -v lftp &> /dev/null; then
    echo -e "${RED}✗${NC} lftp not installed. Installing..."
    sudo apt-get update && sudo apt-get install -y lftp
fi

# Create deployment directory
DEPLOY_DIR="$(pwd)/deploy-package"
echo -e "${BLUE}► Step 1: Preparing deployment package...${NC}"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy all files maintaining structure, excluding specific items
echo "Copying backend files..."

# Copy src directory with all subdirectories
if [ -d "src" ]; then
    echo "  ✓ Copying src/ directory..."
    cp -r src "$DEPLOY_DIR/"
fi

# Copy root files
for file in server.js package.json .sequelizerc .prettierrc .eslintrc.js; do
    if [ -f "$file" ]; then
        echo "  ✓ Copying $file"
        cp "$file" "$DEPLOY_DIR/"
    fi
done

# Copy config directory if exists
if [ -d "config" ]; then
    echo "  ✓ Copying config/ directory..."
    cp -r config "$DEPLOY_DIR/"
fi

# Create necessary empty directories
echo "  ✓ Creating empty directories..."
mkdir -p "$DEPLOY_DIR/uploads"
mkdir -p "$DEPLOY_DIR/logs"
mkdir -p "$DEPLOY_DIR/node_modules"

# Create .env.example for reference
if [ -f ".env.example" ] || [ -f ".env.production.example" ]; then
    echo "  ✓ Copying .env template..."
    [ -f ".env.production.example" ] && cp .env.production.example "$DEPLOY_DIR/.env.example" || cp .env.example "$DEPLOY_DIR/.env.example"
fi

echo -e "${GREEN}✓${NC} Deployment package prepared"
echo ""

# Show what will be uploaded
echo -e "${BLUE}► Files to upload:${NC}"
cd "$DEPLOY_DIR"
find . -type f | head -30
FILE_COUNT=$(find . -type f | wc -l)
echo "... and $FILE_COUNT files total"
echo ""
cd - > /dev/null

# Test FTP connection
echo -e "${BLUE}► Step 2: Testing FTP connection...${NC}"
if lftp -e "set ftp:ssl-allow no; open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST; pwd; bye" &> /dev/null; then
    echo -e "${GREEN}✓${NC} FTP connection successful"
else
    echo -e "${RED}✗${NC} FTP connection failed"
    exit 1
fi
echo ""

# Create remote directory structure
echo -e "${BLUE}► Step 3: Creating remote directory structure...${NC}"
lftp -e "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
cd $FTP_REMOTE_PATH || mkdir -p $FTP_REMOTE_PATH;
cd $FTP_REMOTE_PATH;
mkdir -p src;
mkdir -p src/config;
mkdir -p src/controllers;
mkdir -p src/middleware;
mkdir -p src/models;
mkdir -p src/routes;
mkdir -p src/services;
mkdir -p src/utils;
mkdir -p src/validators;
mkdir -p src/websocket;
mkdir -p src/migrations;
mkdir -p src/seeders;
mkdir -p src/scripts;
mkdir -p logs;
mkdir -p uploads;
mkdir -p node_modules;
pwd;
bye
" 2>&1 | grep -E "pwd|mkdir" | tail -5
echo -e "${GREEN}✓${NC} Remote directories created"
echo ""

# Upload files
echo -e "${BLUE}► Step 4: Uploading files to server...${NC}"
echo -e "${YELLOW}This may take several minutes depending on connection speed...${NC}"
echo ""

lftp -e "
set ftp:ssl-allow no;
set net:timeout 60;
set net:max-retries 5;
set net:reconnect-interval-base 5;
set ftp:sync-mode off;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
cd $FTP_REMOTE_PATH;
mirror --reverse --delete --verbose --parallel=4 --exclude-glob node_modules/ --exclude-glob .git/ --exclude-glob deploy-package/ --exclude-glob deploy-temp/ $DEPLOY_DIR/ ./;
bye
"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} Files uploaded successfully"
else
    echo -e "${RED}✗${NC} Upload failed"
    rm -rf "$DEPLOY_DIR"
    exit 1
fi
echo ""

# Create server setup script
echo -e "${BLUE}► Step 5: Creating server scripts...${NC}"

# Create install script
cat > "$DEPLOY_DIR/install.sh" << 'INSTALLSCRIPT'
#!/bin/bash

# Finvera Backend - Server Installation Script

echo "╔════════════════════════════════════════════════╗"
echo "║   Finvera Backend - Server Setup              ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check Node.js
echo "► Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found! Please install Node.js 18+"
    exit 1
fi
echo "✓ Node.js version: $(node --version)"
echo "✓ NPM version: $(npm --version)"
echo ""

# Install dependencies
echo "► Installing dependencies..."
npm install --production
if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed"
else
    echo "✗ Failed to install dependencies"
    exit 1
fi
echo ""

# Check for .env
echo "► Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "⚠ .env file not found!"
    echo ""
    echo "Please create .env file with production values:"
    echo "  1. Copy template: cp .env.example .env"
    echo "  2. Edit: nano .env"
    echo "  3. Update all values (database, secrets, etc.)"
    echo ""
    exit 1
fi
echo "✓ .env file exists"
echo ""

# Check database connection
echo "► Testing database connection..."
DB_HOST=$(grep DB_HOST .env | cut -d '=' -f2)
DB_USER=$(grep DB_USER .env | cut -d '=' -f2)
DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2)

if command -v mysql &> /dev/null; then
    if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" &> /dev/null; then
        echo "✓ Database connection successful"
    else
        echo "⚠ Database connection failed"
        echo "  Please check your database credentials in .env"
    fi
else
    echo "⚠ MySQL client not found, skipping DB test"
fi
echo ""

# Run migrations
echo "► Running database migrations..."
npm run migrate
if [ $? -eq 0 ]; then
    echo "✓ Migrations completed"
else
    echo "⚠ Migrations failed (this is normal if already run)"
fi
echo ""

echo "╔════════════════════════════════════════════════╗"
echo "║        Installation Complete!                  ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Review .env configuration"
echo "  2. Start server: bash start.sh"
echo "  3. Test: bash test.sh"
echo ""
INSTALLSCRIPT

# Create start script
cat > "$DEPLOY_DIR/start.sh" << 'STARTSCRIPT'
#!/bin/bash

# Finvera Backend - Start Script

echo "Starting Finvera Backend..."

# Load environment
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    echo "Starting with PM2..."
    
    # Stop if already running
    pm2 stop finvera-backend 2>/dev/null || true
    pm2 delete finvera-backend 2>/dev/null || true
    
    # Start fresh
    pm2 start server.js --name finvera-backend \
        --max-memory-restart 1G \
        --log logs/out.log \
        --error logs/err.log
    
    pm2 save
    
    echo ""
    echo "✓ Backend started with PM2"
    echo ""
    echo "Useful commands:"
    echo "  pm2 status              - Check status"
    echo "  pm2 logs finvera-backend - View logs"
    echo "  pm2 restart finvera-backend - Restart"
    echo "  pm2 stop finvera-backend - Stop"
    echo ""
else
    echo "Starting with Node.js..."
    echo "⚠ PM2 not found. Install with: npm install -g pm2"
    echo ""
    NODE_ENV=production node server.js
fi
STARTSCRIPT

# Create test script
cat > "$DEPLOY_DIR/test.sh" << 'TESTSCRIPT'
#!/bin/bash

# Finvera Backend - Test Script

echo "╔════════════════════════════════════════════════╗"
echo "║   Finvera Backend - Health Check Tests        ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Get port from .env or default to 3000
PORT=$(grep PORT .env 2>/dev/null | cut -d '=' -f2 || echo "3000")

echo "Testing backend on port $PORT..."
echo ""

# Test 1: Basic health check
echo "1. Testing /health endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/health)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✓ Health check passed (HTTP $HTTP_CODE)"
    curl -s http://localhost:$PORT/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:$PORT/health
else
    echo "   ✗ Health check failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 2: API health check
echo "2. Testing /api/health endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/api/health)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✓ API health check passed (HTTP $HTTP_CODE)"
    curl -s http://localhost:$PORT/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:$PORT/api/health
else
    echo "   ✗ API health check failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 3: Check if process is running
echo "3. Checking backend process..."
if command -v pm2 &> /dev/null; then
    pm2 status finvera-backend
else
    if pgrep -f "node.*server.js" > /dev/null; then
        echo "   ✓ Backend process is running"
        ps aux | grep "node.*server.js" | grep -v grep
    else
        echo "   ✗ Backend process not found"
    fi
fi
echo ""

echo "╔════════════════════════════════════════════════╗"
echo "║           Test Complete                        ║"
echo "╚════════════════════════════════════════════════╝"
TESTSCRIPT

# Make scripts executable
chmod +x "$DEPLOY_DIR/install.sh"
chmod +x "$DEPLOY_DIR/start.sh"
chmod +x "$DEPLOY_DIR/test.sh"

# Upload scripts
lftp -e "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
cd $FTP_REMOTE_PATH;
put $DEPLOY_DIR/install.sh;
put $DEPLOY_DIR/start.sh;
put $DEPLOY_DIR/test.sh;
chmod 755 install.sh;
chmod 755 start.sh;
chmod 755 test.sh;
bye
"

echo -e "${GREEN}✓${NC} Server scripts uploaded"
echo ""

# Create ecosystem config for PM2
cat > "$DEPLOY_DIR/ecosystem.config.js" << 'ECOCONFIG'
module.exports = {
  apps: [{
    name: 'finvera-backend',
    script: './server.js',
    instances: 1,
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
ECOCONFIG

# Upload PM2 config
lftp -e "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
cd $FTP_REMOTE_PATH;
put $DEPLOY_DIR/ecosystem.config.js;
bye
"

echo -e "${GREEN}✓${NC} PM2 config uploaded"
echo ""

# Cleanup
echo -e "${BLUE}► Step 6: Cleaning up...${NC}"
rm -rf "$DEPLOY_DIR"
echo -e "${GREEN}✓${NC} Cleanup complete"
echo ""

# Success message
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Deployment Successful! 🎉                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Deployment Summary:${NC}"
echo -e "  ✓ All backend files uploaded"
echo -e "  ✓ Directory structure maintained"
echo -e "  ✓ Server scripts created"
echo -e "  ✓ PM2 configuration uploaded"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}   IMPORTANT: Next Steps on Your Server${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}1. SSH into your server:${NC}"
echo -e "   ${GREEN}ssh $FTP_USER${NC}"
echo ""
echo -e "${BLUE}2. Navigate to the API directory:${NC}"
echo -e "   ${GREEN}cd $FTP_REMOTE_PATH${NC}"
echo ""
echo -e "${BLUE}3. Create .env file:${NC}"
echo -e "   ${GREEN}cp .env.example .env${NC}"
echo -e "   ${GREEN}nano .env${NC}"
echo -e "   ${YELLOW}(Update ALL values: DB credentials, secrets, Google OAuth, etc.)${NC}"
echo ""
echo -e "${BLUE}4. Run installation:${NC}"
echo -e "   ${GREEN}bash install.sh${NC}"
echo ""
echo -e "${BLUE}5. Start the backend:${NC}"
echo -e "   ${GREEN}bash start.sh${NC}"
echo ""
echo -e "${BLUE}6. Test the deployment:${NC}"
echo -e "   ${GREEN}bash test.sh${NC}"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Server Scripts Available:${NC}"
echo -e "  • ${GREEN}install.sh${NC}  - Install dependencies & run migrations"
echo -e "  • ${GREEN}start.sh${NC}    - Start the backend server"
echo -e "  • ${GREEN}test.sh${NC}     - Run health checks"
echo ""
echo -e "${BLUE}Monitoring Commands:${NC}"
echo -e "  • ${GREEN}pm2 status${NC}              - Check server status"
echo -e "  • ${GREEN}pm2 logs finvera-backend${NC} - View live logs"
echo -e "  • ${GREEN}pm2 restart finvera-backend${NC} - Restart server"
echo ""
echo -e "${GREEN}Deployment complete! Ready for server setup.${NC}"
echo ""
