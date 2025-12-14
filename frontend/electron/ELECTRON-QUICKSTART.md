# Electron Quick Start Guide

Get your Finvera desktop app running in minutes!

## Step 1: Install Dependencies

```bash
cd frontend
npm install
```

Or use the setup script:

**On macOS/Linux:**
```bash
./electron/setup.sh
```

**On Windows:**
```bash
electron\setup.bat
```

## Step 2: Run Development Mode

```bash
npm run electron:dev
```

This will:
- Start the Next.js dev server
- Launch the Electron desktop app
- Enable hot reloading

## Step 3: Build for Production

### Build for Both Platforms
```bash
npm run electron:build
```

### Build for Specific Platform
```bash
# macOS
npm run electron:build:mac

# Windows
npm run electron:build:win

# Linux
npm run electron:build:linux
```

## Where Are My Built Apps?

Built applications will be in the `dist/` directory:
- macOS: `Finvera-{version}.dmg`
- Windows: `Finvera Setup {version}.exe`
- Linux: `Finvera-{version}.AppImage`

## Adding App Icons

1. Create your app icon (1024x1024px PNG recommended)
2. Convert to platform-specific formats:
   - macOS: `icon.icns`
   - Windows: `icon.ico`
   - Linux: `icon.png`
3. Place in `electron/assets/` directory

See `electron/assets/README.md` for conversion instructions.

## Common Issues

### Port 3000 Already in Use
Stop any other application using port 3000, or change the port in `package.json`.

### Build Fails
```bash
# Clear everything and try again
rm -rf node_modules dist .next
npm install
npm run electron:build
```

### Icons Not Showing
Make sure icon files are in `electron/assets/` with the correct names and formats.

## Next Steps

- Read the full documentation: [ELECTRON-README.md](ELECTRON-README.md)
- Check out the Electron utilities: `lib/electron.js`
- See the example component: `components/ElectronInfo.jsx`

## Need Help?

- Electron Docs: https://www.electronjs.org/docs
- electron-builder Docs: https://www.electron.build
- Next.js Docs: https://nextjs.org/docs

Happy coding! 🚀
