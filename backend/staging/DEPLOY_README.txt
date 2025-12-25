╔════════════════════════════════════════════════════════════╗
║                                                            ║
║            Finvera Backend Deployment                      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

🚀 ONE SCRIPT DEPLOYMENT

Script: deploy.sh
Location: /workspace/backend/deploy.sh

═══════════════════════════════════════════════════════════

📋 WHAT THE SCRIPT DOES:

Step 1: Test FTP Connection ✓
  • Connects to FTP server
  • Verifies credentials
  • Shows current directory

Step 2: Prepare Local Files ✓
  • Creates staging directory
  • Copies all files
  • Applies exclusions (node_modules, .git, etc.)
  • Counts files

Step 3: Create Build Directory on Server ✓
  • Creates /build directory on server
  • Verifies directory creation

Step 4: Upload Files ✓
  • Uploads all files to server:/build
  • Shows progress
  • Uses parallel upload (3 connections)

Step 5: Verify Upload ✓
  • Counts files on server
  • Checks essential files (server.js, package.json, src/, config/)
  • Compares local vs remote file counts

Step 6: Success ✓
  • Shows summary
  • Displays next steps

═══════════════════════════════════════════════════════════

🎯 HOW TO USE:

cd /workspace/backend
bash deploy.sh

OR

./deploy.sh

═══════════════════════════════════════════════════════════

⚙️ CONFIGURATION:

FTP Server: ftp.illusiodesigns.agency
FTP User: finvera@illusiodesigns.agency
FTP Password: Rishi@1995
Remote Build Dir: /build

═══════════════════════════════════════════════════════════

✅ AFTER DEPLOYMENT:

SSH into server:
  ssh finvera@illusiodesigns.agency

Go to build directory:
  cd ~/build

Setup:
  cp .env.example .env
  nano .env
  npm install --production
  npm run migrate
  pm2 start server.js --name finvera-backend

═══════════════════════════════════════════════════════════

📊 WHAT'S EXCLUDED:

  ✗ node_modules/
  ✗ .git/
  ✗ uploads/
  ✗ .env files
  ✗ *.md files
  ✗ package-lock.json
  ✗ archive files (.zip, .tar.gz)
  ✗ deployment scripts

═══════════════════════════════════════════════════════════

✅ SUCCESS INDICATORS:

  ✓ FTP connection successful
  ✓ Build directory created
  ✓ Files uploaded
  ✓ File count matches
  ✓ Essential files verified

═══════════════════════════════════════════════════════════
