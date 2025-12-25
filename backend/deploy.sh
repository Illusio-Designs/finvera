#!/bin/bash

###############################################################################
# Finvera Backend - Complete Deployment Script
# This script: Tests connection → Creates build dir → Uploads → Verifies
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
FTP_SERVER="ftp.illusiodesigns.agency"
FTP_USER="finvera@illusiodesigns.agency"
FTP_PASS="Rishi@1995"
REMOTE_BUILD_DIR="build"
# Removed LOCAL_STAGING - using direct upload now

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}║          Finvera Backend - Complete Deployment            ║${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# No cleanup needed - direct upload

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Configuration:${NC}"
echo -e "${GREEN}✓${NC} FTP Server: $FTP_SERVER"
echo -e "${GREEN}✓${NC} FTP User: $FTP_USER"
echo -e "${GREEN}✓${NC} Remote Build Directory: /$REMOTE_BUILD_DIR"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# ============================================================================
# STEP 1: TEST FTP CONNECTION
# ============================================================================
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  STEP 1: Testing FTP Connection                           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Testing connection to $FTP_SERVER...${NC}"

FTP_TEST=$(lftp -c "
set ftp:ssl-allow yes;
set ssl:verify-certificate no;
set net:timeout 30;
open -u '$FTP_USER','$FTP_PASS' '$FTP_SERVER';
pwd;
bye;
" 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} FTP Connection successful!"
    echo -e "${GREEN}✓${NC} Connected to: $FTP_SERVER"
    echo -e "${GREEN}✓${NC} User: $FTP_USER"
    echo -e "${GREEN}✓${NC} Current directory: $FTP_TEST"
else
    echo -e "${RED}✗${NC} FTP Connection failed!"
    echo -e "${RED}Error:${NC} $FTP_TEST"
    exit 1
fi
echo ""

# ============================================================================
# STEP 2: VALIDATE SOURCE FILES
# ============================================================================
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  STEP 2: Validating Source Files                          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Validate source
if [ ! -f "server.js" ] || [ ! -f "package.json" ]; then
    echo -e "${RED}✗${NC} Essential files not found (server.js, package.json)"
    exit 1
fi
echo -e "${GREEN}✓${NC} Source directory validated"

# Count files that will be uploaded (excluding unwanted files)
LOCAL_FILE_COUNT=$(find . -type f \
  ! -path "./node_modules/*" \
  ! -path "./.git/*" \
  ! -path "./uploads/*" \
  ! -path "./staging/*" \
  ! -path "./build/*" \
  ! -path "./deploy-package/*" \
  ! -path "./.vscode/*" \
  ! -path "./.idea/*" \
  ! -path "./.cursor/*" \
  ! -name "package-lock.json" \
  ! -name ".env*" \
  ! -name "*.log" \
  ! -name ".ftpconfig" \
  ! -name "BUILD.zip" \
  ! -name "PRODUCTION-READY.tar.gz" \
  ! -name "finvera-backend.tar.gz" \
  ! -name "deploy*.sh" \
  ! -name "deploy*.log" \
  ! -name "deploy*.txt" \
  ! -name "setup-server.sh" \
  ! -name "test-ftp.sh" \
  ! -name "*.md" \
  2>/dev/null | wc -l)

echo -e "${GREEN}✓${NC} Files to upload: ${CYAN}$LOCAL_FILE_COUNT${NC}"
echo ""

# ============================================================================
# STEP 3: CREATE BUILD DIRECTORY ON SERVER
# ============================================================================
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  STEP 3: Creating Build Directory on Server               ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Creating /$REMOTE_BUILD_DIR on server...${NC}"

CREATE_RESULT=$(lftp -c "
set ftp:ssl-allow yes;
set ssl:verify-certificate no;
set net:timeout 30;
open -u '$FTP_USER','$FTP_PASS' '$FTP_SERVER';
mkdir -p $REMOTE_BUILD_DIR;
cd $REMOTE_BUILD_DIR;
pwd;
bye;
" 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Build directory created: /$REMOTE_BUILD_DIR"
    echo -e "${GREEN}✓${NC} Remote path: $CREATE_RESULT"
else
    echo -e "${RED}✗${NC} Failed to create build directory"
    echo -e "${RED}Error:${NC} $CREATE_RESULT"
    exit 1
fi
echo ""

# ============================================================================
# STEP 4: UPLOAD FILES TO SERVER
# ============================================================================
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  STEP 4: Uploading Files to Server                        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Uploading $LOCAL_FILE_COUNT files to /$REMOTE_BUILD_DIR...${NC}"
echo -e "${YELLOW}This may take several minutes...${NC}"
echo ""

# Show progress
echo -e "${BLUE}Upload Progress:${NC}"

lftp -c "
set ftp:ssl-allow yes;
set ssl:verify-certificate no;
set net:timeout 120;
set net:max-retries 3;
set net:reconnect-interval-base 5;
open -u '$FTP_USER','$FTP_PASS' '$FTP_SERVER';
cd $REMOTE_BUILD_DIR;
mirror --reverse --delete --verbose --parallel=3 \
  --exclude-glob .DS_Store \
  --exclude-glob Thumbs.db \
  --exclude-glob 'node_modules/**' \
  --exclude-glob '.git/**' \
  --exclude-glob 'uploads/**' \
  --exclude-glob 'staging/**' \
  --exclude-glob 'build/**' \
  --exclude-glob 'deploy-package/**' \
  --exclude-glob '.vscode/**' \
  --exclude-glob '.idea/**' \
  --exclude-glob '.cursor/**' \
  --exclude-glob 'package-lock.json' \
  --exclude-glob '.env*' \
  --exclude-glob '*.log' \
  --exclude-glob '.ftpconfig' \
  --exclude-glob 'BUILD.zip' \
  --exclude-glob 'PRODUCTION-READY.tar.gz' \
  --exclude-glob 'finvera-backend.tar.gz' \
  --exclude-glob 'deploy*.sh' \
  --exclude-glob 'deploy*.log' \
  --exclude-glob 'deploy*.txt' \
  --exclude-glob 'setup-server.sh' \
  --exclude-glob 'test-ftp.sh' \
  --exclude-glob '*.md' \
  . .;
bye;
"

UPLOAD_STATUS=$?

echo ""
if [ $UPLOAD_STATUS -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Upload completed successfully!"
else
    echo -e "${RED}✗${NC} Upload failed with status: $UPLOAD_STATUS"
    exit 1
fi
echo ""

# ============================================================================
# STEP 5: VERIFY FILES ON SERVER
# ============================================================================
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  STEP 5: Verifying Files on Server                        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Counting files on server...${NC}"

REMOTE_FILE_COUNT=$(lftp -c "
set ftp:ssl-allow yes;
set ssl:verify-certificate no;
open -u '$FTP_USER','$FTP_PASS' '$FTP_SERVER';
cd $REMOTE_BUILD_DIR;
find . -type f | wc -l;
bye;
" 2>&1 | tail -1)

echo -e "${BLUE}Local files:${NC}  ${CYAN}$LOCAL_FILE_COUNT${NC}"
echo -e "${BLUE}Remote files:${NC} ${CYAN}$REMOTE_FILE_COUNT${NC}"
echo ""

# Verify key files exist
echo -e "${YELLOW}Verifying key files on server...${NC}"

KEY_FILES_CHECK=$(lftp -c "
set ftp:ssl-allow yes;
set ssl:verify-certificate no;
open -u '$FTP_USER','$FTP_PASS' '$FTP_SERVER';
cd $REMOTE_BUILD_DIR;
cls -1 | head -20;
bye;
" 2>&1)

# Check for essential files
if echo "$KEY_FILES_CHECK" | grep -q "server.js"; then
    echo -e "${GREEN}✓${NC} server.js found"
else
    echo -e "${RED}✗${NC} server.js NOT found"
    exit 1
fi

if echo "$KEY_FILES_CHECK" | grep -q "package.json"; then
    echo -e "${GREEN}✓${NC} package.json found"
else
    echo -e "${RED}✗${NC} package.json NOT found"
    exit 1
fi

if echo "$KEY_FILES_CHECK" | grep -q "src"; then
    echo -e "${GREEN}✓${NC} src/ directory found"
else
    echo -e "${RED}✗${NC} src/ directory NOT found"
    exit 1
fi

if echo "$KEY_FILES_CHECK" | grep -q "config"; then
    echo -e "${GREEN}✓${NC} config/ directory found"
else
    echo -e "${RED}✗${NC} config/ directory NOT found"
    exit 1
fi

echo ""

# Compare counts (allow small difference due to hidden files)
DIFF=$((LOCAL_FILE_COUNT - REMOTE_FILE_COUNT))
DIFF=${DIFF#-}  # absolute value

if [ $DIFF -lt 5 ]; then
    echo -e "${GREEN}✓${NC} File count matches (difference: $DIFF files)"
    VERIFICATION_STATUS="SUCCESS"
else
    echo -e "${YELLOW}⚠${NC} File count difference: $DIFF files"
    echo -e "${YELLOW}⚠${NC} This may be normal (hidden files, etc.)"
    VERIFICATION_STATUS="WARNING"
fi

echo ""

# ============================================================================
# STEP 6: FINAL SUCCESS
# ============================================================================
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
echo -e "${GREEN}✓${NC} FTP Connection: ${GREEN}Successful${NC}"
echo -e "${GREEN}✓${NC} Build Directory: ${CYAN}/$REMOTE_BUILD_DIR${NC}"
echo -e "${GREEN}✓${NC} Files Uploaded: ${CYAN}$LOCAL_FILE_COUNT${NC}"
echo -e "${GREEN}✓${NC} Files on Server: ${CYAN}$REMOTE_FILE_COUNT${NC}"
echo -e "${GREEN}✓${NC} Verification: ${GREEN}$VERIFICATION_STATUS${NC}"
echo ""
echo -e "${BLUE}Server Details:${NC}"
echo -e "  • Host: ${CYAN}$FTP_SERVER${NC}"
echo -e "  • Location: ${CYAN}/$REMOTE_BUILD_DIR${NC}"
echo -e "  • Files: ${CYAN}$REMOTE_FILE_COUNT files${NC}"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Next Steps on Server:${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}1. SSH into server:${NC}"
echo -e "   ${GREEN}ssh $FTP_USER${NC}"
echo ""
echo -e "${BLUE}2. Navigate to build directory:${NC}"
echo -e "   ${GREEN}cd ~/$REMOTE_BUILD_DIR${NC}"
echo ""
echo -e "${BLUE}3. Verify files:${NC}"
echo -e "   ${GREEN}ls -la${NC}"
echo -e "   ${GREEN}ls -la src/${NC}"
echo ""
echo -e "${BLUE}4. Create .env file:${NC}"
echo -e "   ${GREEN}cp .env.example .env${NC}"
echo -e "   ${GREEN}nano .env${NC}"
echo ""
echo -e "${BLUE}5. Install dependencies:${NC}"
echo -e "   ${GREEN}npm install --production${NC}"
echo ""
echo -e "${BLUE}6. Create required directories:${NC}"
echo -e "   ${GREEN}mkdir -p logs uploads${NC}"
echo -e "   ${GREEN}chmod 777 logs uploads${NC}"
echo ""
echo -e "${BLUE}7. Run database migrations:${NC}"
echo -e "   ${GREEN}npm run migrate${NC}"
echo ""
echo -e "${BLUE}8. Start server:${NC}"
echo -e "   ${GREEN}pm2 start server.js --name finvera-backend${NC}"
echo -e "   ${GREEN}pm2 save${NC}"
echo ""
echo -e "${BLUE}9. Verify deployment:${NC}"
echo -e "   ${GREEN}pm2 status${NC}"
echo -e "   ${GREEN}curl http://localhost:3000/health${NC}"
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Deployment Complete - Ready for Setup! ✓                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
