# Installation Instructions for Electron Desktop App

## Prerequisites

- **Node.js**: Version 16 or higher
- **npm**: Version 7 or higher
- **Platform Requirements:**
  - macOS: macOS 10.15+ with Xcode Command Line Tools
  - Windows: Windows 10 or higher
  - Linux: Any modern distribution

## Installation Steps

### 1. Install Dependencies

Navigate to the frontend directory and install all dependencies:

```bash
cd frontend
npm install
```

This will install:
- Electron and electron-builder (for desktop app)
- Next.js and React (for the web app)
- All supporting libraries

### 2. Verify Installation

Run the validation script to ensure everything is set up correctly:

```bash
node electron/validate-setup.js
```

You should see all green checkmarks (✓) for required components.

### 3. Configure Environment (Optional)

Copy the Electron environment file:

```bash
cp .env.electron.example .env.electron
```

Edit `.env.electron` to customize your configuration if needed.

## Usage

### Development Mode

To run the app in development mode with hot reloading:

```bash
npm run electron:dev
```

This will:
1. Start the Next.js dev server on port 3000
2. Launch the Electron desktop application
3. Enable hot module reloading
4. Open DevTools automatically

**Note:** Keep the terminal window open while developing.

### Building for Production

#### Build for All Platforms (Mac & Windows)

```bash
npm run electron:build
```

#### Build for Specific Platform

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

### Build Output Location

Built applications will be in the `dist/` directory:

```
dist/
├── Finvera-1.0.0.dmg              # macOS installer
├── Finvera-1.0.0-mac.zip          # macOS app (zipped)
├── Finvera Setup 1.0.0.exe        # Windows installer
├── Finvera 1.0.0.exe              # Windows portable
├── Finvera-1.0.0.AppImage         # Linux AppImage
└── finvera_1.0.0_amd64.deb        # Debian package
```

## Adding Application Icons

For a professional look, add custom icons:

1. Create icons in the required formats:
   - macOS: `icon.icns` (512x512px minimum)
   - Windows: `icon.ico` (256x256px minimum)
   - Linux: `icon.png` (512x512px)

2. Place them in `electron/assets/` directory

3. See `electron/assets/README.md` for detailed instructions on creating icons

## Troubleshooting

### Common Issues

**Issue: Port 3000 already in use**
```bash
# Find and kill process using port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Issue: Electron won't start**
```bash
# Clear cache and reinstall
rm -rf node_modules .next dist
npm install
```

**Issue: Build fails**
```bash
# Ensure you have enough disk space
# Try building for specific platform first
npm run electron:build:mac  # or :win or :linux
```

**Issue: Module not found errors**
```bash
# Reinstall dependencies
npm install
npm run postinstall
```

For more troubleshooting, see [ELECTRON-TROUBLESHOOTING.md](ELECTRON-TROUBLESHOOTING.md)

## Testing Your Installation

1. **Run in development:**
   ```bash
   npm run electron:dev
   ```

2. **Visit the demo page** (in the Electron app):
   - Navigate to `http://localhost:3000/electron-demo`
   - Test storage features
   - Check app information

3. **Build and test:**
   ```bash
   npm run electron:build:mac  # or :win
   # Find the built app in dist/ and run it
   ```

## Setup Scripts

We provide helper scripts for easy setup:

### Unix/macOS
```bash
./electron/setup.sh
```

### Windows
```bash
electron\setup.bat
```

These scripts will:
- Check your Node.js version
- Install all dependencies
- Provide next steps

## Post-Installation

After successful installation:

1. ✅ All dependencies are installed
2. ✅ Electron configuration is in place
3. ✅ Build scripts are ready
4. ✅ You can start developing

### Next Steps

- Read [ELECTRON-QUICKSTART.md](ELECTRON-QUICKSTART.md) for quick start guide
- See [ELECTRON-README.md](ELECTRON-README.md) for complete documentation
- Check [ELECTRON-SUMMARY.md](ELECTRON-SUMMARY.md) for an overview

## Uninstallation

To remove Electron support:

```bash
# Remove node_modules and build artifacts
rm -rf node_modules dist .next

# Optionally remove Electron files
rm -rf electron/
```

Then reinstall without Electron:
```bash
npm install --omit=dev
```

## Need Help?

- 📖 Documentation: Check all `ELECTRON-*.md` files
- 🔍 Validation: Run `node electron/validate-setup.js`
- 🐛 Issues: See [ELECTRON-TROUBLESHOOTING.md](ELECTRON-TROUBLESHOOTING.md)
- 💬 Support: Check official Electron docs at https://electronjs.org

## Success!

If you've completed all steps successfully, you can now:

✅ Develop your desktop app with hot reloading  
✅ Build native apps for macOS and Windows  
✅ Use Electron features in your React components  
✅ Deploy desktop applications to users  

Happy coding! 🚀
