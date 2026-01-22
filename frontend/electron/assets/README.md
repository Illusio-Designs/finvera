# Finvera Client Icons

This directory contains the application icons for the Finvera Client desktop app.

## Icon Files

- `icon.svg` - Source vector icon (512x512)
- `icon.png` - PNG format for Linux (512x512)
- `icon.ico` - Windows icon format (multi-size)
- `icon.icns` - macOS icon format (multi-size)

## Icon Design

The icon features:
- Modern square design with rounded corners (90px radius)
- Blue gradient background (#2563eb to #1d4ed8)
- White "F" letter in bold Arial font
- Subtle accent elements and inner shadow
- Optimized for both light and dark themes

## Generating Icons

### Method 1: Using the HTML Converter (Recommended)
1. Open `../../scripts/icon-converter.html` in a web browser
2. Click "Generate Icons" to create PNG versions at different sizes
3. Download the generated PNGs
4. Use online converters to create ICO and ICNS files:
   - ICO: https://convertio.co/png-ico/
   - ICNS: https://convertio.co/png-icns/

### Method 2: Manual Conversion
1. Open `icon.svg` in a vector graphics editor (Inkscape, Adobe Illustrator)
2. Export as PNG at 512x512 pixels
3. Use the PNG to create other formats using online tools or desktop software

### Method 3: Command Line (if you have the tools)
```bash
# Install required tools first
npm install -g svg2png-cli
npm install -g png2icons-cli

# Generate PNG
svg2png icon.svg --width=512 --height=512 --output=icon.png

# Generate ICO (Windows)
png2icons icon.png --icns --ico --output=./

# Generate ICNS (macOS) 
png2icons icon.png --icns --output=./
```

## Icon Sizes

The ICO and ICNS files should include these sizes:
- 16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512
- For macOS: also include 1024x1024

## Testing Icons

After updating icons:
1. Rebuild the Electron app: `npm run electron:build`
2. Check the icon appears correctly in:
   - Window title bar
   - Taskbar/Dock
   - Alt+Tab/Cmd+Tab switcher
   - Desktop shortcut
   - Start menu/Applications folder

## Notes

- Icons are automatically included in the build process via electron-builder
- The build configuration in package.json references these icon files
- Make sure all icon files are present before building for distribution