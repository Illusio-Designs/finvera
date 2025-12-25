#!/bin/bash

###############################################################################
# Server Setup Script - Creates proper directory structure
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Finvera Server Setup & Test Deployment     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Load FTP config
source /workspace/backend/.ftpconfig

echo -e "${GREEN}✓${NC} FTP Host: $FTP_HOST"
echo -e "${GREEN}✓${NC} FTP User: $FTP_USER"
echo ""

# Step 1: Create directory structure on server
echo -e "${BLUE}► Step 1: Creating directory structure...${NC}"

lftp -e "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
mkdir -p api;
cd api;
mkdir -p src;
mkdir -p logs;
mkdir -p uploads;
mkdir -p node_modules;
ls -la;
bye
" 2>&1 | grep -v "mkdir: Access failed"

echo -e "${GREEN}✓${NC} Directory structure created"
echo ""

# Step 2: Create test health check file
echo -e "${BLUE}► Step 2: Creating test health check files...${NC}"

# Create a simple test Node.js server
cat > /tmp/test-server.js << 'TESTSERVER'
// Simple Test Server for Finvera Backend
const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Finvera Backend Test Server',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      version: '1.0.0-test'
    }));
    return;
  }

  // API health check
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      api: 'working',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Root endpoint
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Finvera Backend Test</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
          }
          .success { color: green; }
          .info { color: blue; }
          h1 { color: #4F46E5; }
          .endpoint { 
            background: #f5f5f5;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <h1>🚀 Finvera Backend Test Server</h1>
        <p class="success">✓ Server is running!</p>
        <p class="info">Port: ${PORT}</p>
        <p class="info">Time: ${new Date().toLocaleString()}</p>
        
        <h2>Test Endpoints:</h2>
        <div class="endpoint">
          <strong>GET /health</strong><br>
          <a href="/health" target="_blank">Test Health Check</a>
        </div>
        <div class="endpoint">
          <strong>GET /api/health</strong><br>
          <a href="/api/health" target="_blank">Test API Health</a>
        </div>
        
        <h2>Next Steps:</h2>
        <ol>
          <li>Deploy full backend application</li>
          <li>Configure database connection</li>
          <li>Set up environment variables</li>
          <li>Run migrations</li>
          <li>Start production server</li>
        </ol>
      </body>
      </html>
    `);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(\`Finvera Test Server running on port \${PORT}\`);
  console.log(\`Visit: http://localhost:\${PORT}\`);
});

// Handle errors
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});
TESTSERVER

# Create package.json for test
cat > /tmp/test-package.json << 'TESTPKG'
{
  "name": "finvera-backend-test",
  "version": "1.0.0-test",
  "description": "Finvera Backend Test Server",
  "main": "test-server.js",
  "scripts": {
    "start": "node test-server.js",
    "test": "curl http://localhost:3000/health"
  }
}
TESTPKG

# Create README
cat > /tmp/README-TEST.md << 'TESTREADME'
# Finvera Backend Test Deployment

This is a test deployment to verify server connectivity and Node.js setup.

## Test Server Status

✓ FTP connection successful
✓ Directory structure created
✓ Test files uploaded

## How to Test

### 1. SSH into your server
```bash
ssh finvera@illusiodesigns.agency
```

### 2. Navigate to the API directory
```bash
cd ~/api
# OR
cd /home/finvera/api
```

### 3. Start the test server
```bash
# Make sure Node.js is installed
node --version

# Start test server
node test-server.js
```

### 4. Test the endpoints

Open in browser:
- http://your-domain.com:3000/
- http://your-domain.com:3000/health
- http://your-domain.com:3000/api/health

Or use curl:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/health
```

## Next Steps

Once test server works:

1. Stop test server (Ctrl+C)
2. Run full deployment: `bash deploy.sh` (from local machine)
3. Configure production environment variables
4. Set up database
5. Run migrations
6. Start with PM2

## Files in This Test

- `test-server.js` - Simple Node.js HTTP server
- `test-package.json` - Package configuration
- `README-TEST.md` - This file

## Troubleshooting

If server doesn't start:
- Check Node.js is installed: `node --version`
- Check port 3000 is available: `netstat -tulpn | grep 3000`
- Check logs for errors
- Verify permissions: `ls -la`

## Support

Contact: info@illusiodesigns.agency
Phone: 7600046416
TESTREADME

# Upload test files
echo "Uploading test files..."
lftp -e "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
cd api;
put /tmp/test-server.js;
put /tmp/test-package.json;
put /tmp/README-TEST.md;
ls -la;
bye
"

echo -e "${GREEN}✓${NC} Test files uploaded"
echo ""

# Step 3: Create .htaccess for Node.js app (if using cPanel)
echo -e "${BLUE}► Step 3: Creating .htaccess configuration...${NC}"

cat > /tmp/.htaccess << 'HTACCESS'
# Enable Node.js Application
# Redirect all requests to Node.js server

<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Allow direct access to health checks
    RewriteCond %{REQUEST_URI} ^/health [OR]
    RewriteCond %{REQUEST_URI} ^/api/health
    RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
    
    # Proxy all other requests to Node.js
    RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
</IfModule>

# CORS Headers
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
HTACCESS

lftp -e "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
cd api;
put /tmp/.htaccess;
bye
"

echo -e "${GREEN}✓${NC} .htaccess uploaded"
echo ""

# Cleanup
rm -f /tmp/test-server.js /tmp/test-package.json /tmp/README-TEST.md /tmp/.htaccess

# Final summary
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Server Setup Complete!                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}What was created on the server:${NC}"
echo ""
echo -e "📁 /api                    - Main API directory"
echo -e "📁 /api/src                - Source code directory"
echo -e "📁 /api/logs               - Log files"
echo -e "📁 /api/uploads            - File uploads"
echo -e "📁 /api/node_modules       - Dependencies"
echo -e "📄 /api/test-server.js     - Test Node.js server"
echo -e "📄 /api/test-package.json  - Test package config"
echo -e "📄 /api/README-TEST.md     - Test instructions"
echo -e "📄 /api/.htaccess          - Apache configuration"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo -e "1. ${BLUE}SSH into your server:${NC}"
echo -e "   ssh finvera@illusiodesigns.agency"
echo ""
echo -e "2. ${BLUE}Navigate to API directory:${NC}"
echo -e "   cd ~/api"
echo ""
echo -e "3. ${BLUE}Test the server:${NC}"
echo -e "   node test-server.js"
echo ""
echo -e "4. ${BLUE}In another terminal, test endpoints:${NC}"
echo -e "   curl http://localhost:3000/health"
echo ""
echo -e "5. ${BLUE}Once working, deploy full backend:${NC}"
echo -e "   bash deploy.sh (from local machine)"
echo ""
echo -e "${GREEN}Setup complete!${NC}"
