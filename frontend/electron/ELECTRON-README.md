# Finvera Electron Desktop Application

This guide explains how to develop and build the Finvera desktop application using Electron for macOS and Windows.

## Prerequisites

- Node.js 16+ and npm
- For macOS builds: macOS 10.15+ with Xcode Command Line Tools
- For Windows builds: Windows 10+ or cross-compilation tools

## Installation

First, install all dependencies:

```bash
cd frontend
npm install
```

## Development

To run the application in development mode:

```bash
npm run electron:dev
```

This will:
1. Start the Next.js development server on http://localhost:3000
2. Wait for the server to be ready
3. Launch the Electron application

The application will automatically reload when you make changes to your code.

### Development Features

- Hot module reloading for React components
- DevTools automatically opened in development mode
- Source maps for debugging

## Building for Production

### Build for All Platforms (Mac & Windows)

```bash
npm run electron:build
```

This will:
1. Build the Next.js application for production
2. Package the Electron app for both macOS and Windows

### Build for Specific Platforms

**macOS only:**
```bash
npm run electron:build:mac
```

**Windows only:**
```bash
npm run electron:build:win
```

**Linux only:**
```bash
npm run electron:build:linux
```

## Build Outputs

Built applications will be in the `dist/` directory:

### macOS
- `Finvera-{version}.dmg` - DMG installer
- `Finvera-{version}-mac.zip` - Zipped application
- Supports both Intel (x64) and Apple Silicon (arm64)

### Windows
- `Finvera Setup {version}.exe` - NSIS installer
- `Finvera {version}.exe` - Portable version
- Supports both 64-bit (x64) and 32-bit (ia32)

### Linux
- `Finvera-{version}.AppImage` - AppImage package
- `Finvera_{version}_amd64.deb` - Debian package

## Application Icons

The application requires icons for each platform:

1. **macOS**: `electron/assets/icon.icns` (512x512px minimum)
2. **Windows**: `electron/assets/icon.ico` (256x256px minimum)
3. **Linux**: `electron/assets/icon.png` (512x512px recommended)

See `electron/assets/README.md` for instructions on creating these icons.

## Architecture

### File Structure

```
frontend/
├── electron/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Preload script (context bridge)
│   ├── builder.js           # Build configuration script
│   ├── entitlements.mac.plist  # macOS entitlements
│   └── assets/
│       └── README.md        # Icon creation guide
├── lib/
│   └── electron.js          # Electron utilities for React
├── pages/                   # Next.js pages
├── components/              # React components
└── package.json            # Dependencies and scripts
```

### Main Process (main.js)

The main process handles:
- Creating and managing application windows
- Menu bar configuration
- IPC (Inter-Process Communication) handlers
- Persistent storage (electron-store)
- Application lifecycle events

### Preload Script (preload.js)

The preload script:
- Provides a secure bridge between main and renderer processes
- Exposes limited APIs to the web application
- Maintains security through context isolation

### Renderer Process (React/Next.js)

The web application runs in the renderer process and can:
- Use Electron APIs through the exposed context bridge
- Access persistent storage
- Detect if running in Electron vs browser
- Use platform-specific features

## Using Electron Features in Your App

### Check if Running in Electron

```javascript
import { isElectron } from '../lib/electron';

if (isElectron()) {
  // Running in Electron
  console.log('Desktop app mode');
} else {
  // Running in browser
  console.log('Web app mode');
}
```

### Store Data Persistently

```javascript
import { electronStore } from '../lib/electron';

// Save data
await electronStore.set('userPreferences', { theme: 'dark' });

// Get data
const preferences = await electronStore.get('userPreferences');

// Delete data
await electronStore.delete('userPreferences');

// Clear all data
await electronStore.clear();
```

### Get App Information

```javascript
import { electronApp } from '../lib/electron';

// Get app version
const version = await electronApp.getVersion();

// Get platform
const platform = electronApp.getPlatform(); // 'darwin', 'win32', or 'linux'

// Get app paths
const userDataPath = await electronApp.getPath('userData');
const tempPath = await electronApp.getPath('temp');
```

### Platform Detection

```javascript
import { isMac, isWindows, isLinux } from '../lib/electron';

if (isMac()) {
  // macOS-specific code
}

if (isWindows()) {
  // Windows-specific code
}

if (isLinux()) {
  // Linux-specific code
}
```

## Configuration

### Package.json

Key configuration in `package.json`:
- `main`: Points to the Electron main process file
- `build`: electron-builder configuration
- `scripts`: Commands for development and building

### Next.js Configuration

The `next.config.js` is configured to:
- Export static HTML for Electron
- Disable image optimization
- Set webpack target to 'electron-renderer'
- Handle Electron-specific build requirements

## Security Considerations

The application is configured with security best practices:

1. **Context Isolation**: Enabled to separate Electron APIs from web content
2. **Node Integration**: Disabled in renderer process
3. **Remote Module**: Disabled for security
4. **Preload Script**: Used to safely expose limited APIs
5. **Content Security**: External links open in default browser

## Debugging

### Development Mode

DevTools are automatically opened in development mode. You can also:

```javascript
// In main.js, uncomment this line if needed:
mainWindow.webContents.openDevTools();
```

### Production Debugging

To debug production builds:

1. Set `DEBUG=electron-builder` environment variable before building
2. Check the `dist/` directory for build logs
3. Use Console logging in the main process (output goes to terminal)

## Troubleshooting

### Build Fails

1. **Clear cache and rebuild:**
   ```bash
   rm -rf node_modules dist .next
   npm install
   npm run electron:build
   ```

2. **Check Node.js version:**
   Ensure you're using Node.js 16 or higher

3. **Platform-specific issues:**
   - macOS: Ensure Xcode Command Line Tools are installed
   - Windows: Try running as Administrator

### App Won't Start

1. **Check port 3000:**
   Ensure no other application is using port 3000 in development

2. **Check dependencies:**
   ```bash
   npm install
   ```

3. **Check console output:**
   Look for errors in the terminal where you ran the command

### Icons Not Showing

1. Place proper icon files in `electron/assets/`
2. Ensure icons are in the correct format (see `electron/assets/README.md`)
3. Rebuild the application

## Publishing

### Code Signing (macOS)

For macOS distribution, you'll need:
1. Apple Developer account
2. Developer ID certificate
3. Update `package.json` with certificate details

### Code Signing (Windows)

For Windows distribution, you'll need:
1. Code signing certificate
2. Update `package.json` with certificate details

### Auto-Updates

To implement auto-updates:
1. Use `electron-updater` package
2. Set up a release server or use GitHub releases
3. Configure update settings in `main.js`

## Performance Tips

1. **Minimize bundle size:**
   - Only include necessary dependencies
   - Use dynamic imports for large components

2. **Optimize Next.js build:**
   - Enable webpack caching
   - Use production builds

3. **Memory management:**
   - Close unused windows
   - Clear large data structures when not needed

## Support

For issues or questions:
1. Check the Electron documentation: https://www.electronjs.org/docs
2. Check electron-builder documentation: https://www.electron.build
3. Review Next.js documentation: https://nextjs.org/docs

## License

See the main project LICENSE file for details.
