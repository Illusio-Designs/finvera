#!/bin/bash

###############################################################################
# Finvera Backend - Final Deployment Script
# Deploys to main directory with proper exclusions
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Finvera Backend - Deployment                      ║${NC}"
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
    echo -e "${YELLOW}⚠${NC} lftp not installed. Installing..."
    sudo apt-get update && sudo apt-get install -y lftp
fi

# Create deployment directory
DEPLOY_DIR="$(pwd)/deploy-package"
echo -e "${BLUE}► Step 1: Preparing deployment package...${NC}"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy files excluding: uploads/, .env, *.md files, node_modules/, package-lock.json
echo "Copying backend files (excluding: uploads, .env, .md files, node_modules, package-lock.json)..."

# Copy src directory
if [ -d "src" ]; then
    echo "  ✓ Copying src/ directory..."
    cp -r src "$DEPLOY_DIR/"
fi

# Copy config directory if exists
if [ -d "config" ]; then
    echo "  ✓ Copying config/ directory..."
    cp -r config "$DEPLOY_DIR/"
fi

# Copy root files (excluding .md files and package-lock.json)
for file in server.js package.json .sequelizerc .prettierrc .eslintrc.js .gitignore API_DOCUMENTATION.json; do
    if [ -f "$file" ]; then
        echo "  ✓ Copying $file"
        cp "$file" "$DEPLOY_DIR/"
    fi
done

# Copy .env.example (not .env)
if [ -f ".env.example" ]; then
    echo "  ✓ Copying .env.example"
    cp .env.example "$DEPLOY_DIR/"
elif [ -f ".env.production.example" ]; then
    echo "  ✓ Copying .env.production.example as .env.example"
    cp .env.production.example "$DEPLOY_DIR/.env.example"
fi

# Create necessary empty directories
echo "  ✓ Creating empty directories..."
mkdir -p "$DEPLOY_DIR/logs"

echo -e "${GREEN}✓${NC} Deployment package prepared"
echo ""

# Show what will be uploaded
echo -e "${BLUE}► Files to upload:${NC}"
cd "$DEPLOY_DIR"
find . -type f | head -30
FILE_COUNT=$(find . -type f | wc -l)
echo "... total $FILE_COUNT files"
echo ""
cd - > /dev/null

# Test FTP connection
echo -e "${BLUE}► Step 2: Testing FTP connection...${NC}"
if lftp -e "set ftp:ssl-allow no; open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST; pwd; bye" &> /dev/null; then
    echo -e "${GREEN}✓${NC} FTP connection successful"
else
    echo -e "${RED}✗${NC} FTP connection failed"
    rm -rf "$DEPLOY_DIR"
    exit 1
fi
echo ""

# Create remote directory structure
echo -e "${BLUE}► Step 3: Creating remote directory structure...${NC}"
lftp -e "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
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
mkdir -p config;
mkdir -p logs;
pwd;
ls -la;
bye
" 2>&1 | tail -10
echo -e "${GREEN}✓${NC} Remote directories ready"
echo ""

# Upload files
echo -e "${BLUE}► Step 4: Uploading files to server...${NC}"
echo -e "${YELLOW}Uploading to: $FTP_REMOTE_PATH${NC}"
echo -e "${YELLOW}This may take several minutes...${NC}"
echo ""

lftp -e "
set ftp:ssl-allow no;
set net:timeout 60;
set net:max-retries 5;
set net:reconnect-interval-base 5;
set ftp:sync-mode off;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
cd $FTP_REMOTE_PATH;
mirror --reverse --delete --verbose --parallel=4 \
  --exclude-glob .env \
  --exclude-glob uploads/ \
  --exclude-glob node_modules/ \
  --exclude-glob package-lock.json \
  --exclude-glob '*.md' \
  --exclude-glob .git/ \
  --exclude-glob deploy-*/ \
  --exclude-glob .ftpconfig \
  $DEPLOY_DIR/ ./;
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

# Create server setup scripts
echo -e "${BLUE}► Step 5: Creating server scripts...${NC}"

# Create install script
cat > "$DEPLOY_DIR/install.sh" << 'INSTALLSCRIPT'
#!/bin/bash

echo "╔════════════════════════════════════════════════╗"
echo "║   Finvera Backend - Installation              ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check Node.js
echo "► Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found! Please install Node.js 18+"
    exit 1
fi
echo "✓ Node.js: $(node --version)"
echo "✓ NPM: $(npm --version)"
echo ""

# Install dependencies
echo "► Installing dependencies..."
npm install --production
echo ""

# Check for .env
if [ ! -f ".env" ]; then
    echo "⚠ .env file not found!"
    echo "Please create .env file:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi
echo "✓ .env file exists"
echo ""

# Run migrations
echo "► Running database migrations..."
npm run migrate || echo "⚠ Migrations failed (may be normal if already run)"
echo ""

echo "✓ Installation complete!"
echo ""
echo "Next: bash start.sh"
INSTALLSCRIPT

# Create start script
cat > "$DEPLOY_DIR/start.sh" << 'STARTSCRIPT'
#!/bin/bash

echo "Starting Finvera Backend..."

# Load environment
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start with PM2 if available
if command -v pm2 &> /dev/null; then
    echo "Starting with PM2..."
    pm2 stop finvera-backend 2>/dev/null || true
    pm2 delete finvera-backend 2>/dev/null || true
    pm2 start server.js --name finvera-backend \
        --max-memory-restart 1G \
        --log logs/out.log \
        --error logs/err.log
    pm2 save
    echo "✓ Backend started with PM2"
    pm2 status
else
    echo "Starting with Node.js..."
    NODE_ENV=production node server.js
fi
STARTSCRIPT

# Create test script
cat > "$DEPLOY_DIR/test.sh" << 'TESTSCRIPT'
#!/bin/bash

echo "╔════════════════════════════════════════════════╗"
echo "║   Finvera Backend - Health Check              ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

PORT=$(grep PORT .env 2>/dev/null | cut -d '=' -f2 || echo "3000")

echo "Testing on port $PORT..."
echo ""

echo "1. Health check:"
curl -s http://localhost:$PORT/health | python3 -m json.tool 2>/dev/null || curl http://localhost:$PORT/health
echo ""

echo "2. API health:"
curl -s http://localhost:$PORT/api/health | python3 -m json.tool 2>/dev/null || curl http://localhost:$PORT/api/health
echo ""

if command -v pm2 &> /dev/null; then
    echo "3. PM2 status:"
    pm2 status
fi
TESTSCRIPT

# Make scripts executable
chmod +x "$DEPLOY_DIR/install.sh"
chmod +x "$DEPLOY_DIR/start.sh"
chmod +x "$DEPLOY_DIR/test.sh"

# Upload scripts
echo "Uploading server scripts..."
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
echo -e "${BLUE}Deployed to: $FTP_REMOTE_PATH${NC}"
echo ""
echo -e "${YELLOW}Next Steps on Server:${NC}"
echo ""
echo -e "1. ${BLUE}SSH into server:${NC}"
echo -e "   ${GREEN}ssh $FTP_USER${NC}"
echo ""
echo -e "2. ${BLUE}Navigate to directory:${NC}"
echo -e "   ${GREEN}cd ~${NC}"
echo -e "   ${GREEN}ls -la${NC}"
echo ""
echo -e "3. ${BLUE}Create .env file:${NC}"
echo -e "   ${GREEN}cp .env.example .env${NC}"
echo -e "   ${GREEN}nano .env${NC}"
echo ""
echo -e "4. ${BLUE}Run installation:${NC}"
echo -e "   ${GREEN}bash install.sh${NC}"
echo ""
echo -e "5. ${BLUE}Start server:${NC}"
echo -e "   ${GREEN}bash start.sh${NC}"
echo ""
echo -e "6. ${BLUE}Test deployment:${NC}"
echo -e "   ${GREEN}bash test.sh${NC}"
echo ""
echo -e "${GREEN}Deployment complete!${NC}"
echo ""
