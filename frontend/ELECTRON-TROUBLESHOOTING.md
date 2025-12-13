# Electron Troubleshooting Guide

Common issues and solutions for the Finvera Electron desktop application.

## Installation Issues

### Error: Cannot find module 'electron'

**Problem:** Electron is not installed.

**Solution:**
```bash
npm install
```

### Error: electron-builder not found

**Problem:** Build dependencies are not installed.

**Solution:**
```bash
npm install --save-dev electron-builder
```

### Permission denied when running setup.sh

**Problem:** Setup script is not executable.

**Solution:**
```bash
chmod +x electron/setup.sh
./electron/setup.sh
```

## Development Issues

### Error: Port 3000 is already in use

**Problem:** Another application is using port 3000.

**Solutions:**

1. **Stop the other application using port 3000:**
   ```bash
   # Find process using port 3000
   lsof -i :3000  # macOS/Linux
   netstat -ano | findstr :3000  # Windows
   
   # Kill the process
   kill -9 <PID>  # macOS/Linux
   taskkill /PID <PID> /F  # Windows
   ```

2. **Change the port in package.json:**
   ```json
   "electron:dev": "concurrently \"next dev -p 3001\" \"wait-on http://localhost:3001 && electron .\""
   ```

### Electron window doesn't open

**Problem:** Electron is waiting for the Next.js server that hasn't started.

**Solutions:**

1. Check terminal output for errors
2. Try running Next.js separately:
   ```bash
   npm run dev
   # In another terminal:
   electron .
   ```
3. Clear cache:
   ```bash
   rm -rf .next node_modules
   npm install
   ```

### DevTools won't open

**Problem:** DevTools are disabled or blocked.

**Solution:** In `electron/main.js`, ensure this line exists:
```javascript
if (isDev) {
  mainWindow.webContents.openDevTools();
}
```

### Changes not reflecting in Electron app

**Problem:** Cache is not being cleared.

**Solution:**
1. Hard reload: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Restart the app: `npm run electron:dev`
3. Clear cache:
   ```bash
   rm -rf .next
   ```

## Build Issues

### Error: Building for macOS on Windows/Linux

**Problem:** Cannot build macOS apps on non-macOS systems without special configuration.

**Solution:**

1. **Use a macOS machine or VM** for macOS builds
2. **Use CI/CD** (GitHub Actions) to build on different platforms
3. **Cross-compilation** (advanced, requires additional setup)

### Error: No entitlements file found (macOS)

**Problem:** macOS entitlements file is missing.

**Solution:** Ensure `electron/entitlements.mac.plist` exists and is properly formatted.

### Error: Icon file not found

**Problem:** Application icons are missing.

**Solution:**

1. Create icons for your platform:
   - macOS: `electron/assets/icon.icns`
   - Windows: `electron/assets/icon.ico`
   - Linux: `electron/assets/icon.png`

2. See `electron/assets/README.md` for icon creation instructions

3. Temporarily remove icon references from `package.json` to test:
   ```json
   "mac": {
     // Remove or comment out:
     // "icon": "electron/assets/icon.icns"
   }
   ```

### Error: Application not signed (macOS)

**Problem:** macOS requires code signing for distribution.

**Solution:**

1. **For development:** Disable Gatekeeper temporarily:
   ```bash
   sudo spctl --master-disable
   ```

2. **For distribution:** Get an Apple Developer certificate and configure signing:
   ```json
   "mac": {
     "identity": "Developer ID Application: Your Name (TEAM_ID)"
   }
   ```

### Error: NSIS error during Windows build

**Problem:** NSIS installer creation failed.

**Solution:**

1. Build portable version instead:
   ```bash
   npm run electron:build:win -- --win portable
   ```

2. Check disk space (builds require significant space)

3. Try building as administrator on Windows

### Build succeeds but app won't start

**Problem:** Misconfigured build or missing dependencies.

**Solutions:**

1. **Check the console:**
   - Run the built app from terminal to see errors
   - macOS: `./dist/mac/Finvera.app/Contents/MacOS/Finvera`
   - Windows: Run the .exe from command prompt

2. **Verify Next.js build:**
   ```bash
   npm run build
   # Check that .next directory is created
   ```

3. **Check file paths in main.js:**
   ```javascript
   // Ensure paths are correct for production
   const startURL = isDev
     ? 'http://localhost:3000'
     : `file://${path.join(__dirname, '../.next/server/app/index.html')}`;
   ```

## Runtime Issues

### Cannot connect to API

**Problem:** Desktop app cannot reach the backend API.

**Solutions:**

1. **Check API URL configuration:**
   - Set `API_URL` in `.env` or environment variables
   - Ensure backend is running

2. **CORS issues:**
   - Configure backend to allow requests from `file://` protocol
   - Use a local proxy in Electron

3. **Network issues:**
   - Check firewall settings
   - Test API connectivity in browser first

### Persistent storage not working

**Problem:** electron-store is not saving data.

**Solutions:**

1. **Check permissions:**
   - App needs write access to user data directory
   - Check: `await electronApp.getPath('userData')`

2. **Verify electron-store is installed:**
   ```bash
   npm install electron-store
   ```

3. **Clear corrupt data:**
   ```javascript
   await electronStore.clear();
   ```

### External links not opening

**Problem:** Links don't open in default browser.

**Solution:** Ensure this code is in `electron/main.js`:
```javascript
mainWindow.webContents.setWindowOpenHandler(({ url }) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  }
  return { action: 'allow' };
});
```

### App is very slow

**Problem:** Performance issues in Electron app.

**Solutions:**

1. **Build for production instead of development:**
   ```bash
   npm run electron:build
   ```

2. **Disable DevTools in production** (check `electron/main.js`)

3. **Optimize Next.js build:**
   - Enable webpack caching
   - Use production build

4. **Check system resources:**
   - Close other applications
   - Check for memory leaks

## Platform-Specific Issues

### macOS: "App is damaged and can't be opened"

**Problem:** macOS Gatekeeper is blocking the app.

**Solution:**
```bash
# Remove quarantine attribute
xattr -cr /path/to/Finvera.app

# Or disable Gatekeeper temporarily
sudo spctl --master-disable
```

### macOS: "App can't be opened because Apple cannot check it"

**Problem:** App is not notarized.

**Solution:**

1. **For development:** Right-click the app and select "Open"
2. **For distribution:** Get app notarized through Apple

### Windows: SmartScreen warning

**Problem:** Windows doesn't recognize the publisher.

**Solution:**

1. **For development:** Click "More info" → "Run anyway"
2. **For distribution:** Sign the app with a valid certificate

### Windows: App won't install

**Problem:** Installation blocked by Windows.

**Solution:**

1. Run installer as Administrator
2. Check Windows Defender logs
3. Use portable version instead

### Linux: Permission denied

**Problem:** AppImage doesn't have execute permission.

**Solution:**
```bash
chmod +x Finvera-*.AppImage
./Finvera-*.AppImage
```

## Validation

### Run setup validation

```bash
node electron/validate-setup.js
```

This script checks:
- Required files exist
- Dependencies are installed
- Scripts are configured
- Icons are present (optional)

## Getting Help

If you're still experiencing issues:

1. **Check the logs:**
   - macOS: `~/Library/Logs/Finvera/`
   - Windows: `%APPDATA%\Finvera\logs\`
   - Linux: `~/.config/Finvera/logs/`

2. **Run with debug output:**
   ```bash
   DEBUG=* npm run electron:dev
   ```

3. **Check Electron version compatibility:**
   ```bash
   npm list electron
   ```

4. **Consult official documentation:**
   - Electron: https://www.electronjs.org/docs
   - electron-builder: https://www.electron.build
   - Next.js: https://nextjs.org/docs

5. **Search for similar issues:**
   - Electron GitHub Issues
   - electron-builder GitHub Issues
   - Stack Overflow

## Clean Slate

If all else fails, start fresh:

```bash
# Remove everything
rm -rf node_modules dist .next

# Reinstall
npm install

# Try development mode
npm run electron:dev

# Or try building
npm run electron:build
```
