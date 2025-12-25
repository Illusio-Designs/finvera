#!/bin/bash

###############################################################################
# Finvera Backend - Deploy to BUILD Folder
# Uploads all files to /build directory
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      Finvera Backend - Deploy to BUILD Folder             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load FTP configuration
if [ -f ".ftpconfig" ]; then
    source .ftpconfig
else
    echo -e "${RED}✗${NC} .ftpconfig not found!"
    exit 1
fi

# Override remote path to /build
FTP_REMOTE_PATH="/build"

echo -e "${GREEN}✓${NC} FTP Host: $FTP_HOST"
echo -e "${GREEN}✓${NC} FTP User: $FTP_USER"
echo -e "${GREEN}✓${NC} Remote Path: $FTP_REMOTE_PATH"
echo ""

# Create deployment directory
DEPLOY_DIR="$(pwd)/deploy-package"
echo -e "${BLUE}► Step 1: Preparing deployment package...${NC}"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

echo "Copying all backend files..."
echo "Excluding: uploads/, .env, *.md, node_modules/, package-lock.json"
echo ""

# Copy src directory
if [ -d "src" ]; then
    echo "  ✓ Copying src/ directory..."
    cp -r src "$DEPLOY_DIR/"
fi

# Copy config directory
if [ -d "config" ]; then
    echo "  ✓ Copying config/ directory..."
    cp -r config "$DEPLOY_DIR/"
fi

# Copy root files
for file in server.js package.json .sequelizerc .prettierrc .eslintrc.js .gitignore API_DOCUMENTATION.json; do
    if [ -f "$file" ]; then
        echo "  ✓ Copying $file"
        cp "$file" "$DEPLOY_DIR/"
    fi
done

# Copy .env.example
if [ -f ".env.example" ]; then
    cp .env.example "$DEPLOY_DIR/"
elif [ -f ".env.production.example" ]; then
    cp .env.production.example "$DEPLOY_DIR/.env.example"
fi

# Create directories
mkdir -p "$DEPLOY_DIR/logs"

echo -e "${GREEN}✓${NC} Package prepared"
echo ""

FILE_COUNT=$(find "$DEPLOY_DIR" -type f | wc -l)
echo -e "${BLUE}Total files: $FILE_COUNT${NC}"
echo ""

# Test FTP
echo -e "${BLUE}► Step 2: Testing FTP connection...${NC}"
if lftp -e "set ftp:ssl-allow no; open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST; pwd; bye" &> /dev/null; then
    echo -e "${GREEN}✓${NC} FTP connection successful"
else
    echo -e "${RED}✗${NC} FTP connection failed"
    exit 1
fi
echo ""

# Create build folder on server
echo -e "${BLUE}► Step 3: Creating /build folder on server...${NC}"
lftp -e "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
mkdir -p /build;
cd /build;
pwd;
bye
" 2>&1 | tail -5
echo -e "${GREEN}✓${NC} Build folder ready"
echo ""

# Upload files
echo -e "${BLUE}► Step 4: Uploading files to /build...${NC}"
echo -e "${YELLOW}Uploading $FILE_COUNT files...${NC}"
echo ""

lftp << EOF
set ftp:ssl-allow no
set net:timeout 120
set net:max-retries 10
set net:reconnect-interval-base 5
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST
cd /build
mirror --reverse --delete --verbose --parallel=2 \
  --exclude-glob .env \
  --exclude-glob uploads/ \
  --exclude-glob node_modules/ \
  --exclude-glob package-lock.json \
  --exclude-glob '*.md' \
  --exclude-glob .git/ \
  --exclude-glob deploy-*/ \
  --exclude-glob .ftpconfig \
  $DEPLOY_DIR/ ./
bye
EOF

UPLOAD_STATUS=$?

if [ $UPLOAD_STATUS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} Upload successful!"
else
    echo -e "${RED}✗${NC} Upload failed with status: $UPLOAD_STATUS"
    rm -rf "$DEPLOY_DIR"
    exit 1
fi
echo ""

# Create server scripts
echo -e "${BLUE}► Step 5: Creating server scripts...${NC}"

# Install script
cat > "$DEPLOY_DIR/install.sh" << 'INSTALLSCRIPT'
#!/bin/bash
echo "╔════════════════════════════════════════════════╗"
echo "║   Finvera Backend - Installation              ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found!"
    exit 1
fi
echo "✓ Node.js: $(node --version)"
echo "✓ NPM: $(npm --version)"
echo ""

echo "► Installing dependencies..."
npm install --production
echo ""

if [ ! -f ".env" ]; then
    echo "⚠ .env file not found!"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi
echo "✓ .env exists"
echo ""

echo "► Running migrations..."
npm run migrate || echo "⚠ Migrations may have failed"
echo ""

echo "✓ Installation complete!"
echo "Next: bash start.sh"
INSTALLSCRIPT

# Start script
cat > "$DEPLOY_DIR/start.sh" << 'STARTSCRIPT'
#!/bin/bash
echo "Starting Finvera Backend..."

if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

if command -v pm2 &> /dev/null; then
    pm2 stop finvera-backend 2>/dev/null || true
    pm2 delete finvera-backend 2>/dev/null || true
    pm2 start server.js --name finvera-backend --max-memory-restart 1G --log logs/out.log --error logs/err.log
    pm2 save
    echo "✓ Started with PM2"
    pm2 status
else
    NODE_ENV=production node server.js
fi
STARTSCRIPT

# Test script
cat > "$DEPLOY_DIR/test.sh" << 'TESTSCRIPT'
#!/bin/bash
echo "Testing Finvera Backend..."
PORT=$(grep PORT .env 2>/dev/null | cut -d '=' -f2 || echo "3000")
echo ""
echo "Health check:"
curl -s http://localhost:$PORT/health | python3 -m json.tool 2>/dev/null || curl http://localhost:$PORT/health
echo ""
echo "API health:"
curl -s http://localhost:$PORT/api/health | python3 -m json.tool 2>/dev/null || curl http://localhost:$PORT/api/health
echo ""
command -v pm2 &> /dev/null && pm2 status
TESTSCRIPT

chmod +x "$DEPLOY_DIR"/*.sh

# Upload scripts
lftp -e "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
cd /build;
put $DEPLOY_DIR/install.sh;
put $DEPLOY_DIR/start.sh;
put $DEPLOY_DIR/test.sh;
chmod 777 install.sh;
chmod 777 start.sh;
chmod 777 test.sh;
bye
"

echo -e "${GREEN}✓${NC} Scripts uploaded"
echo ""

# Cleanup
rm -rf "$DEPLOY_DIR"
echo -e "${GREEN}✓${NC} Cleanup done"
echo ""

# Success
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            DEPLOYMENT SUCCESSFUL! 🎉                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}All files uploaded to: /build${NC}"
echo ""
echo -e "${YELLOW}Next Steps on Server:${NC}"
echo ""
echo -e "1. ${BLUE}SSH into server:${NC}"
echo -e "   ${GREEN}ssh $FTP_USER${NC}"
echo ""
echo -e "2. ${BLUE}Go to build folder:${NC}"
echo -e "   ${GREEN}cd ~/build${NC}"
echo -e "   OR"
echo -e "   ${GREEN}cd /home/finvera/build${NC}"
echo ""
echo -e "3. ${BLUE}Verify files:${NC}"
echo -e "   ${GREEN}ls -la${NC}"
echo -e "   ${GREEN}ls -la src/${NC}"
echo ""
echo -e "4. ${BLUE}Set permissions (if needed):${NC}"
echo -e "   ${GREEN}chmod 777 -R .${NC}"
echo ""
echo -e "5. ${BLUE}Create .env:${NC}"
echo -e "   ${GREEN}cp .env.example .env${NC}"
echo -e "   ${GREEN}nano .env${NC}"
echo ""
echo -e "6. ${BLUE}Install:${NC}"
echo -e "   ${GREEN}bash install.sh${NC}"
echo ""
echo -e "7. ${BLUE}Start:${NC}"
echo -e "   ${GREEN}bash start.sh${NC}"
echo ""
echo -e "8. ${BLUE}Test:${NC}"
echo -e "   ${GREEN}bash test.sh${NC}"
echo ""
echo -e "${GREEN}✓ Deployment to /build complete!${NC}"
