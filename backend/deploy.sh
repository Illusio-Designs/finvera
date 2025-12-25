#!/bin/bash

###############################################################################
# Finvera Backend Deployment Script
# Deploys backend to FTP server
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Finvera Backend Deployment Script                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load FTP configuration
if [ -f "$SCRIPT_DIR/.ftpconfig" ]; then
    echo -e "${GREEN}✓${NC} Loading FTP configuration..."
    source "$SCRIPT_DIR/.ftpconfig"
else
    echo -e "${RED}✗${NC} .ftpconfig file not found!"
    echo -e "${YELLOW}Creating .ftpconfig template...${NC}"
    cat > "$SCRIPT_DIR/.ftpconfig" << 'EOF'
# FTP Configuration
FTP_HOST=ftp.illusiodesigns.agency
FTP_PORT=21
FTP_USER=finvera@illusiodesigns.agency
FTP_PASSWORD=your_password_here
FTP_REMOTE_PATH=/public_html/api
EOF
    echo -e "${YELLOW}Please edit .ftpconfig with your credentials and run again.${NC}"
    exit 1
fi

# Validate configuration
if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASSWORD" ]; then
    echo -e "${RED}✗${NC} FTP configuration incomplete!"
    exit 1
fi

echo -e "${GREEN}✓${NC} FTP Host: $FTP_HOST"
echo -e "${GREEN}✓${NC} FTP User: $FTP_USER"
echo -e "${GREEN}✓${NC} Remote Path: $FTP_REMOTE_PATH"
echo ""

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} lftp is not installed. Installing..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y lftp
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install lftp
    else
        echo -e "${RED}✗${NC} Please install lftp manually"
        exit 1
    fi
fi

# Step 1: Test FTP connection
echo -e "${BLUE}► Step 1: Testing FTP connection...${NC}"
if lftp -e "open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST; ls; bye" &> /dev/null; then
    echo -e "${GREEN}✓${NC} FTP connection successful!"
else
    echo -e "${RED}✗${NC} FTP connection failed!"
    exit 1
fi
echo ""

# Step 2: Install dependencies
echo -e "${BLUE}► Step 2: Installing production dependencies...${NC}"
cd "$SCRIPT_DIR"
if [ -f "package.json" ]; then
    npm install --production
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${RED}✗${NC} package.json not found!"
    exit 1
fi
echo ""

# Step 3: Create deployment archive
echo -e "${BLUE}► Step 3: Creating deployment archive...${NC}"
DEPLOY_DIR="$SCRIPT_DIR/deploy-temp"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy necessary files
echo "Copying files..."
cp -r src "$DEPLOY_DIR/"
cp -r node_modules "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/"
cp server.js "$DEPLOY_DIR/"

# Copy .env if exists (with warning)
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠${NC} Copying .env file (make sure it has production values!)"
    cp .env "$DEPLOY_DIR/"
else
    echo -e "${YELLOW}⚠${NC} .env file not found - you'll need to create it on the server"
fi

echo -e "${GREEN}✓${NC} Files prepared for deployment"
echo ""

# Step 4: Upload to FTP server
echo -e "${BLUE}► Step 4: Uploading to FTP server...${NC}"
echo "This may take several minutes..."

lftp -e "
set ftp:ssl-allow no;
set net:timeout 30;
set net:max-retries 3;
set net:reconnect-interval-base 5;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
cd $FTP_REMOTE_PATH || mkdir -p $FTP_REMOTE_PATH;
cd $FTP_REMOTE_PATH;
mirror --reverse --delete --verbose --parallel=4 $DEPLOY_DIR/ ./;
bye
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Upload successful!"
else
    echo -e "${RED}✗${NC} Upload failed!"
    rm -rf "$DEPLOY_DIR"
    exit 1
fi
echo ""

# Step 5: Create startup script on server
echo -e "${BLUE}► Step 5: Creating startup script on server...${NC}"

cat > "$DEPLOY_DIR/start.sh" << 'STARTSCRIPT'
#!/bin/bash
# Finvera Backend Startup Script

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start application with PM2
if command -v pm2 &> /dev/null; then
    pm2 start server.js --name finvera-backend --max-memory-restart 1G
    pm2 save
    echo "✓ Backend started with PM2"
else
    # Fallback to node
    NODE_ENV=production node server.js
fi
STARTSCRIPT

chmod +x "$DEPLOY_DIR/start.sh"

# Upload startup script
lftp -e "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
cd $FTP_REMOTE_PATH;
put $DEPLOY_DIR/start.sh;
bye
"

echo -e "${GREEN}✓${NC} Startup script created on server"
echo ""

# Step 6: Create ecosystem config for PM2
echo -e "${BLUE}► Step 6: Creating PM2 ecosystem config...${NC}"

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

# Step 7: Create test health check file
echo -e "${BLUE}► Step 7: Creating health check test...${NC}"

cat > "$DEPLOY_DIR/test-health.sh" << 'TESTSCRIPT'
#!/bin/bash
# Test backend health

echo "Testing Finvera Backend Health..."
echo ""

# Test local health endpoint
echo "1. Testing local health endpoint..."
curl -f http://localhost:3000/health && echo "✓ Local health check passed" || echo "✗ Local health check failed"
echo ""

# Test API health endpoint
echo "2. Testing API health endpoint..."
curl -f http://localhost:3000/api/health && echo "✓ API health check passed" || echo "✗ API health check failed"
echo ""

# Test database connection
echo "3. Testing with environment info..."
curl http://localhost:3000/health | jq '.'
echo ""

echo "Health check complete!"
TESTSCRIPT

chmod +x "$DEPLOY_DIR/test-health.sh"

# Upload test script
lftp -e "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
cd $FTP_REMOTE_PATH;
put $DEPLOY_DIR/test-health.sh;
bye
"

echo -e "${GREEN}✓${NC} Health check script uploaded"
echo ""

# Cleanup
echo -e "${BLUE}► Step 8: Cleaning up temporary files...${NC}"
rm -rf "$DEPLOY_DIR"
echo -e "${GREEN}✓${NC} Cleanup complete"
echo ""

# Final summary
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Deployment Completed Successfully!            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo -e "1. ${YELLOW}SSH into your server${NC}"
echo -e "   ssh $FTP_USER"
echo ""
echo -e "2. ${YELLOW}Navigate to deployment directory${NC}"
echo -e "   cd $FTP_REMOTE_PATH"
echo ""
echo -e "3. ${YELLOW}Create/Edit .env file with production values${NC}"
echo -e "   nano .env"
echo ""
echo -e "4. ${YELLOW}Install dependencies (if not already done)${NC}"
echo -e "   npm install --production"
echo ""
echo -e "5. ${YELLOW}Run database migrations${NC}"
echo -e "   npm run migrate"
echo ""
echo -e "6. ${YELLOW}Start the application${NC}"
echo -e "   bash start.sh"
echo -e "   ${BLUE}OR${NC}"
echo -e "   pm2 start ecosystem.config.js"
echo ""
echo -e "7. ${YELLOW}Test the deployment${NC}"
echo -e "   bash test-health.sh"
echo ""
echo -e "${BLUE}Monitoring:${NC}"
echo -e "   pm2 status"
echo -e "   pm2 logs finvera-backend"
echo -e "   pm2 monit"
echo ""
echo -e "${GREEN}Deployment script completed!${NC}"
