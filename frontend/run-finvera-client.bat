@echo off
echo Starting Finvera Client...
echo.

REM Check if the exe exists
if exist "dist-electron\win-unpacked\Finvera Client.exe" (
    echo Found Finvera Client executable
    echo Starting application...
    echo.
    start "" "dist-electron\win-unpacked\Finvera Client.exe"
    echo Finvera Client started successfully!
) else (
    echo ERROR: Finvera Client.exe not found!
    echo Please run the build process first:
    echo   npm run electron:pack
    echo.
    pause
)