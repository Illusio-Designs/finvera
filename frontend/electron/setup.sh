#!/bin/bash

# Electron Setup Script for Finvera
# This script helps set up the Electron development environment

echo "=================================="
echo "Finvera Electron Setup"
echo "=================================="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found!"
    echo "Please run this script from the frontend directory."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies"
    exit 1
fi

echo ""
echo "=================================="
echo "✓ Setup completed successfully!"
echo "=================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Add application icons to electron/assets/:"
echo "   - icon.icns (for macOS)"
echo "   - icon.ico (for Windows)"
echo "   - icon.png (for Linux)"
echo ""
echo "2. To start development:"
echo "   npm run electron:dev"
echo ""
echo "3. To build for production:"
echo "   npm run electron:build        # Build for all platforms"
echo "   npm run electron:build:mac    # Build for macOS only"
echo "   npm run electron:build:win    # Build for Windows only"
echo ""
echo "See ELECTRON-README.md for detailed documentation."
echo ""
