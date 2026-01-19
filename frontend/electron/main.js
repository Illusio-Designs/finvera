const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Set client-only mode for packaged app
if (app.isPackaged) {
  process.env.ELECTRON_CLIENT_ONLY = 'true';
}

let mainWindow;
let serverProcess;

// Wait for server to be ready
function waitForServer(url, callback, maxRetries = 30) {
  let retries = maxRetries;
  const checkServer = () => {
    http.get(url, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        // Server is up (404 is ok, means server is responding)
        callback();
      } else {
        retries--;
        if (retries > 0) {
          setTimeout(checkServer, 1000);
        } else {
          console.error('Server failed to start');
          if (mainWindow) {
            mainWindow.loadURL('data:text/html,<h1>Failed to start server</h1><p>Please check the console for errors.</p>');
          }
        }
      }
    }).on('error', () => {
      retries--;
      if (retries > 0) {
        setTimeout(checkServer, 1000);
      } else {
        console.error('Server failed to start');
        if (mainWindow) {
          mainWindow.loadURL('data:text/html,<h1>Failed to start server</h1><p>Please check the console for errors.</p>');
        }
      }
    });
  };
  checkServer();
}

// Start Next.js standalone server in production
function startNextServer() {
  if (serverProcess) {
    return; // Server already running
  }

  // In packaged app, resources are in different location
  let serverPath;
  let serverCwd;
  
  if (app.isPackaged) {
    // In production, check resources path first (from extraResources)
    // extraResources puts files in process.resourcesPath
    const resourcesPath = process.resourcesPath || path.join(app.getAppPath(), '..');
    
    // Try resources path first (where extraResources puts files)
    serverPath = path.join(resourcesPath, 'standalone', 'server.js');
    serverCwd = path.join(resourcesPath, 'standalone');
    
    // Fallback: try app path (for asarUnpack)
    if (!fs.existsSync(serverPath)) {
      serverPath = path.join(app.getAppPath(), '.next', 'standalone', 'server.js');
      serverCwd = path.join(app.getAppPath(), '.next', 'standalone');
    }
    
    // Another fallback: try app path directly
    if (!fs.existsSync(serverPath)) {
      serverPath = path.join(app.getAppPath(), 'standalone', 'server.js');
      serverCwd = path.join(app.getAppPath(), 'standalone');
    }
  } else {
    // In development build (not packaged but production mode)
    serverPath = path.join(app.getAppPath(), '.next', 'standalone', 'server.js');
    serverCwd = path.join(app.getAppPath(), '.next', 'standalone');
  }
  
  // Verify server file exists
  if (!fs.existsSync(serverPath)) {
    console.error(`Server file not found at: ${serverPath}`);
    console.error('Available paths checked:', [
      path.join(process.resourcesPath || 'N/A', 'standalone', 'server.js'),
      path.join(app.getAppPath(), '.next', 'standalone', 'server.js'),
      path.join(app.getAppPath(), 'standalone', 'server.js'),
    ]);
    return;
  }

  // Set environment variables for the Next.js server
  const env = {
    ...process.env,
    PORT: '3001',
    HOSTNAME: 'localhost',
    NODE_ENV: 'production',
    ELECTRON_BUILD: 'true',
    ELECTRON_CLIENT_ONLY: 'true',
  };

  // Start the Next.js server
  serverProcess = spawn('node', [serverPath], {
    env,
    cwd: serverCwd,
    stdio: 'inherit',
  });

  serverProcess.on('close', (code) => {
    serverProcess = null;
    if (code !== 0 && code !== null) {
      console.error(`Next.js server exited with code ${code}`);
    }
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start Next.js server:', err);
    serverProcess = null;
  });
}

// Keep a global reference of the window object
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/Fav Icon/Fav_Dark_PNG@4x.png'),
    show: false, // Don't show until ready
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: true,
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on window creation
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Load the app
  if (isDev) {
    // In development, wait for Next.js dev server
    waitForServer('http://localhost:3001', () => {
      mainWindow.loadURL('http://localhost:3001/client/dashboard');
    });
  } else {
    // In production, start Next.js standalone server
    startNextServer();
    // Wait for server to start, then load client dashboard directly
    waitForServer('http://localhost:3001', () => {
      mainWindow.loadURL('http://localhost:3001/client/dashboard');
    });
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const parsedUrl = new URL(url);
    
    // Handle subdomain redirects (client.localhost -> localhost:3001/client)
    if (parsedUrl.hostname.endsWith('.localhost') || parsedUrl.hostname.endsWith('.local')) {
      const subdomain = parsedUrl.hostname.split('.')[0];
      if (subdomain === 'client') {
        // Redirect client.localhost to localhost:3001/client
        const newPath = parsedUrl.pathname === '/' ? '/client/dashboard' : `/client${parsedUrl.pathname}`;
        mainWindow.loadURL(`http://localhost:3001${newPath}`);
      } else {
        // Other subdomains redirect to client dashboard
        mainWindow.loadURL('http://localhost:3001/client/dashboard');
      }
      return { action: 'deny' };
    }
    
    // Open external URLs in default browser
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external URLs and restricted routes
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Handle subdomain redirects (client.localhost -> localhost:3001/client)
    if (parsedUrl.hostname.endsWith('.localhost') || parsedUrl.hostname.endsWith('.local')) {
      event.preventDefault();
      const subdomain = parsedUrl.hostname.split('.')[0];
      if (subdomain === 'client') {
        // Redirect client.localhost to localhost:3001/client
        const newPath = parsedUrl.pathname === '/' ? '/client/dashboard' : `/client${parsedUrl.pathname}`;
        mainWindow.loadURL(`http://localhost:3001${newPath}`);
      } else {
        // Other subdomains redirect to client dashboard
        mainWindow.loadURL('http://localhost:3001/client/dashboard');
      }
      return;
    }
    
    // Check for restricted routes - CLIENT ONLY MODE: Block everything except /client/*
    const isClientRoute = parsedUrl.pathname.startsWith('/client/') || parsedUrl.pathname === '/client';
    const isAuthRoute = parsedUrl.pathname.startsWith('/auth/'); // Allow auth callbacks
    const isRootRoute = parsedUrl.pathname === '/'; // Allow root for redirect
    
    // Block ALL non-client routes (admin, public pages, etc.)
    if (!isClientRoute && !isAuthRoute && !isRootRoute) {
      event.preventDefault();
      // Always redirect to client dashboard for any blocked route
      mainWindow.loadURL('http://localhost:3001/client/dashboard');
      return;
    }
    
    // Allow localhost navigation for client routes
    if (parsedUrl.hostname === 'localhost' && parsedUrl.port === '3001') {
      // Allow navigation within the app
      return;
    }
    
    // Block external navigation
    if (parsedUrl.origin !== 'http://localhost:3001') {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: 'Undo' },
        { role: 'redo', label: 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: 'Cut' },
        { role: 'copy', label: 'Copy' },
        { role: 'paste', label: 'Paste' },
        { role: 'selectAll', label: 'Select All' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { role: 'toggleDevTools', label: 'Toggle Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Actual Size' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Fullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize', label: 'Minimize' },
        { role: 'close', label: 'Close' },
      ],
    },
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about', label: 'About ' + app.getName() },
        { type: 'separator' },
        { role: 'services', label: 'Services' },
        { type: 'separator' },
        { role: 'hide', label: 'Hide ' + app.getName() },
        { role: 'hideOthers', label: 'Hide Others' },
        { role: 'unhide', label: 'Show All' },
        { type: 'separator' },
        { role: 'quit', label: 'Quit ' + app.getName() },
      ],
    });

    // Window menu
    template[4].submenu = [
      { role: 'close', label: 'Close' },
      { role: 'minimize', label: 'Minimize' },
      { role: 'zoom', label: 'Zoom' },
      { type: 'separator' },
      { role: 'front', label: 'Bring All to Front' },
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // Kill the Next.js server if running
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup on app quit
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle certificate errors (for development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    // In development, ignore certificate errors
    event.preventDefault();
    callback(true);
  } else {
    // In production, use default behavior
    callback(false);
  }
});
