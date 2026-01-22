const { spawn } = require('child_process');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

// Set environment variables for client-only mode
process.env.ELECTRON_CLIENT_ONLY = 'true';
process.env.ELECTRON_IS_DEV = 'true';

const dev = true;
const hostname = 'localhost';
const port = 3002;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let electronProcess = null;

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    
    // Start Electron after Next.js is ready
    console.log('🚀 Starting Electron...');
    
    // Use require to get the electron executable path
    let electronPath;
    try {
      electronPath = require('electron');
    } catch (error) {
      console.error('Electron not found:', error);
      return;
    }
    
    electronProcess = spawn(electronPath, ['.'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: { 
        ...process.env, 
        ELECTRON_IS_DEV: 'true',
        ELECTRON_CLIENT_ONLY: 'true'
      }
    });

    electronProcess.on('close', () => {
      process.exit();
    });
  });
});

// Handle process termination
process.on('SIGINT', () => {
  if (electronProcess) {
    electronProcess.kill();
  }
  process.exit();
});

process.on('SIGTERM', () => {
  if (electronProcess) {
    electronProcess.kill();
  }
  process.exit();
});