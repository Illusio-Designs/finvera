#!/bin/bash

###############################################################################
# Finvera Backend - Production Deployment Script
# Updates server via FTP with proper exclusions
###############################################################################

# --- Configuration ---
FTP_SERVER="ftp.illusiodesigns.agency"
FTP_USER="finvera@illusiodesigns.agency"
FTP_PASS="Rishi@1995"
REMOTE_DIR="/"
LOCAL_SOURCE_DIR="."
STAGING_DIR="build"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Finvera Backend - Production Deployment           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# --- 1. The Safety Net (Trap) ---
# This function will run automatically when the script exits, crashes, or is cancelled.
cleanup() {
    if [ -d "$STAGING_DIR" ]; then
        echo -e "\n${YELLOW}--- Cleaning up temporary files ---${NC}"
        rm -rf "$STAGING_DIR"
        echo -e "${GREEN}Cleanup done.${NC}"
    fi
}

# Register the trap: Run 'cleanup' on EXIT, SIGINT (Ctrl+C), or ERR (Error)
trap cleanup EXIT

# Stop the script immediately if any command returns an error
set -e

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Configuration:${NC}"
echo -e "${GREEN}✓${NC} FTP Server: $FTP_SERVER"
echo -e "${GREEN}✓${NC} FTP User: $FTP_USER"
echo -e "${GREEN}✓${NC} Remote Directory: $REMOTE_DIR"
echo -e "${GREEN}✓${NC} Source Directory: $LOCAL_SOURCE_DIR"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${BLUE}--- Step 1: Validating Source Directory ---${NC}"

if [ ! -d "$LOCAL_SOURCE_DIR" ]; then
    echo -e "${RED}✗ Error: Source directory '$LOCAL_SOURCE_DIR' not found.${NC}"
    exit 1
fi

# Check if essential files exist
if [ ! -f "$LOCAL_SOURCE_DIR/server.js" ]; then
    echo -e "${RED}✗ Error: server.js not found in source directory.${NC}"
    exit 1
fi

if [ ! -f "$LOCAL_SOURCE_DIR/package.json" ]; then
    echo -e "${RED}✗ Error: package.json not found in source directory.${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Source directory validated"
echo -e "${GREEN}✓${NC} Essential files found (server.js, package.json)"
echo ""

echo -e "${BLUE}--- Step 2: Preparing Staging Area ---${NC}"

# Ensure we start fresh
if [ -d "$STAGING_DIR" ]; then
    echo "Removing existing staging directory..."
    rm -rf "$STAGING_DIR"
fi
mkdir "$STAGING_DIR"
echo -e "${GREEN}✓${NC} Staging directory created: $STAGING_DIR"
echo ""

echo -e "${YELLOW}Syncing files to staging area...${NC}"
echo "This will copy all files except excluded ones."
echo ""

# Copy all files first (including hidden files)
cp -r "$LOCAL_SOURCE_DIR"/* "$STAGING_DIR/" 2>/dev/null || true
cp -r "$LOCAL_SOURCE_DIR"/.[!.]* "$STAGING_DIR/" 2>/dev/null || true

echo -e "${GREEN}✓${NC} Files copied to staging"
echo ""

echo -e "${BLUE}--- Step 3: Applying Exclusions ---${NC}"
echo "Removing excluded files and directories..."
echo ""

# Remove excluded directories
echo "  Removing node_modules/..."
rm -rf "$STAGING_DIR"/node_modules

echo "  Removing .git/..."
rm -rf "$STAGING_DIR"/.git

echo "  Removing uploads/..."
rm -rf "$STAGING_DIR"/uploads

echo "  Removing build/ (self)..."
rm -rf "$STAGING_DIR"/build

echo "  Removing deploy-* folders..."
rm -rf "$STAGING_DIR"/deploy-*

echo "  Removing .vscode/..."
rm -rf "$STAGING_DIR"/.vscode

echo "  Removing .idea/..."
rm -rf "$STAGING_DIR"/.idea

# Remove excluded files
echo "  Removing package-lock.json..."
rm -f "$STAGING_DIR"/package-lock.json

echo "  Removing .env* files..."
rm -f "$STAGING_DIR"/.env*

echo "  Removing log files..."
rm -f "$STAGING_DIR"/*.log

echo "  Removing .md files..."
find "$STAGING_DIR" -name "*.md" -type f -delete

echo "  Removing .ftpconfig..."
rm -f "$STAGING_DIR"/.ftpconfig

echo "  Removing BUILD.zip..."
rm -f "$STAGING_DIR"/BUILD.zip

echo "  Removing deployment scripts..."
rm -f "$STAGING_DIR"/deploy-*.sh
rm -f "$STAGING_DIR"/deploy-*.txt

echo ""
echo -e "${GREEN}✓${NC} Exclusions applied"
echo ""

# Count files to be uploaded
FILE_COUNT=$(find "$STAGING_DIR" -type f | wc -l)
echo -e "${BLUE}Files ready for upload: $FILE_COUNT${NC}"
echo ""

echo -e "${BLUE}--- Step 4: Testing FTP Connection ---${NC}"

# Test FTP connection first
if lftp -c "
set ftp:ssl-allow yes;
set ssl:verify-certificate no;
open -u '$FTP_USER','$FTP_PASS' '$FTP_SERVER';
pwd;
bye;
" &> /dev/null; then
    echo -e "${GREEN}✓${NC} FTP connection successful"
else
    echo -e "${RED}✗${NC} FTP connection failed"
    echo "Please check your FTP credentials and server."
    exit 1
fi
echo ""

echo -e "${BLUE}--- Step 5: Starting LFTP Mirror Upload ---${NC}"
echo -e "${YELLOW}Uploading $FILE_COUNT files to server...${NC}"
echo -e "${YELLOW}Remote directory: $REMOTE_DIR${NC}"
echo -e "${YELLOW}This may take several minutes...${NC}"
echo ""

# LFTP command with better settings
lftp -c "
set ftp:ssl-allow yes;
set ssl:verify-certificate no;
set net:timeout 60;
set net:max-retries 5;
set net:reconnect-interval-base 5;
set net:reconnect-interval-multiplier 1;
open -u '$FTP_USER','$FTP_PASS' '$FTP_SERVER';
echo 'Connected. Starting Sync...';
mirror --reverse --delete --verbose --parallel=5 \
  --exclude-glob .DS_Store \
  --exclude-glob Thumbs.db \
  --exclude-glob *.tmp \
  '$STAGING_DIR/' '$REMOTE_DIR';
echo 'Upload complete!';
bye;
"

UPLOAD_STATUS=$?

echo ""

if [ $UPLOAD_STATUS -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║          🎉 DEPLOYMENT SUCCESSFUL! 🎉                      ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Deployment Summary:${NC}"
    echo -e "${GREEN}✓${NC} Files uploaded: $FILE_COUNT"
    echo -e "${GREEN}✓${NC} Remote directory: $REMOTE_DIR"
    echo -e "${GREEN}✓${NC} Server: $FTP_SERVER"
    echo ""
    echo -e "${YELLOW}Next Steps on Server:${NC}"
    echo ""
    echo -e "1. ${BLUE}SSH into server:${NC}"
    echo -e "   ${GREEN}ssh $FTP_USER${NC}"
    echo ""
    echo -e "2. ${BLUE}Create .env file:${NC}"
    echo -e "   ${GREEN}cp .env.example .env${NC}"
    echo -e "   ${GREEN}nano .env${NC}"
    echo ""
    echo -e "3. ${BLUE}Install dependencies:${NC}"
    echo -e "   ${GREEN}npm install --production${NC}"
    echo ""
    echo -e "4. ${BLUE}Run migrations:${NC}"
    echo -e "   ${GREEN}npm run migrate${NC}"
    echo ""
    echo -e "5. ${BLUE}Start/Restart server:${NC}"
    echo -e "   ${GREEN}pm2 restart finvera-backend${NC}"
    echo -e "   OR"
    echo -e "   ${GREEN}pm2 start server.js --name finvera-backend${NC}"
    echo ""
    echo -e "6. ${BLUE}Verify deployment:${NC}"
    echo -e "   ${GREEN}pm2 status${NC}"
    echo -e "   ${GREEN}curl http://localhost:3000/health${NC}"
    echo ""
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                            ║${NC}"
    echo -e "${RED}║          ✗ DEPLOYMENT FAILED                               ║${NC}"
    echo -e "${RED}║                                                            ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}Upload failed with status: $UPLOAD_STATUS${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "1. Check FTP credentials"
    echo "2. Verify network connection"
    echo "3. Check FTP server is accessible"
    echo "4. Try manual upload via BUILD.zip"
    echo ""
    exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Deployment Complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# The 'trap' function will now run automatically to cleanup staging directory
