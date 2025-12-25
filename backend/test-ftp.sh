#!/bin/bash

# Quick FTP connection test
echo "Testing FTP connection..."
echo ""

# Load FTP config
source /workspace/backend/.ftpconfig

# Test connection
lftp -e "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
pwd;
ls -la;
bye
" 2>&1

echo ""
echo "FTP test complete!"
