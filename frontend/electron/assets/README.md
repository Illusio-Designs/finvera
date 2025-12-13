# Electron Application Icons

This directory contains the application icons for different platforms.

## Required Icons

### macOS
- **icon.icns** - macOS application icon (at least 512x512px)
  - You can create this from a PNG file using the `iconutil` command on macOS

### Windows
- **icon.ico** - Windows application icon (at least 256x256px)
  - You can create this from a PNG file using online tools or ImageMagick

### Linux
- **icon.png** - Linux application icon (512x512px recommended)

## Creating Icons

### From PNG to ICNS (macOS)
```bash
# Create iconset directory
mkdir icon.iconset

# Create required sizes
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

# Create ICNS file
iconutil -c icns icon.iconset
```

### From PNG to ICO (Windows)
Use online tools like:
- https://convertio.co/png-ico/
- https://www.icoconverter.com/

Or use ImageMagick:
```bash
convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
```

## Placeholder Icons

Until you provide custom icons, you can use placeholder icons or create simple ones using:
- Figma, Sketch, or Adobe Illustrator
- Online icon generators like https://icon.kitchen/

## Notes

- Icons should have a transparent background
- Recommended base size: 1024x1024px
- Save as PNG with transparency
- Use simple, recognizable designs that work at small sizes
