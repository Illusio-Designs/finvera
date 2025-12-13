@echo off
REM Electron Setup Script for Finvera (Windows)
REM This script helps set up the Electron development environment

echo ==================================
echo Finvera Electron Setup
echo ==================================
echo.

REM Check Node.js version
echo Checking Node.js version...
node -v
echo.

REM Check if we're in the frontend directory
if not exist package.json (
    echo Error: package.json not found!
    echo Please run this script from the frontend directory.
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    exit /b 1
)

echo.
echo ==================================
echo Setup completed successfully!
echo ==================================
echo.
echo Next steps:
echo.
echo 1. Add application icons to electron\assets\:
echo    - icon.icns (for macOS)
echo    - icon.ico (for Windows)
echo    - icon.png (for Linux)
echo.
echo 2. To start development:
echo    npm run electron:dev
echo.
echo 3. To build for production:
echo    npm run electron:build        # Build for all platforms
echo    npm run electron:build:mac    # Build for macOS only
echo    npm run electron:build:win    # Build for Windows only
echo.
echo See ELECTRON-README.md for detailed documentation.
echo.
pause
