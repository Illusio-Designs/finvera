@echo off
REM Git cleanup script for Finvera project (Windows)
REM This script removes files that should be ignored but might already be tracked

echo 🧹 Cleaning up Git repository...

REM Remove files from Git index that should be ignored
echo 📁 Removing build artifacts from Git...
git rm -r --cached frontend/node_modules/ 2>nul
git rm -r --cached backend/node_modules/ 2>nul
git rm -r --cached frontend/.next/ 2>nul
git rm -r --cached frontend/out/ 2>nul
git rm -r --cached frontend/dist/ 2>nul
git rm -r --cached frontend/dist-electron/ 2>nul
git rm -r --cached backend/dist/ 2>nul
git rm -r --cached backend/build/ 2>nul

echo 📄 Removing log files from Git...
git rm --cached backend/logs/*.log 2>nul
git rm --cached frontend/*.log 2>nul
git rm --cached *.log 2>nul

echo 🔐 Removing environment files from Git...
git rm --cached backend/.env 2>nul
git rm --cached frontend/.env 2>nul
git rm --cached .env 2>nul
git rm --cached backend/.env.local 2>nul
git rm --cached frontend/.env.local 2>nul
git rm --cached .env.local 2>nul

echo 📦 Removing upload directories from Git...
git rm -r --cached backend/uploads/ 2>nul
git rm -r --cached frontend/uploads/ 2>nul

echo 🗂️ Removing OS files from Git...
git rm --cached .DS_Store 2>nul
git rm --cached */.DS_Store 2>nul
git rm --cached */*/.DS_Store 2>nul
git rm --cached Thumbs.db 2>nul
git rm --cached */Thumbs.db 2>nul

echo 🔧 Removing IDE files from Git...
git rm -r --cached .vscode/settings.json 2>nul
git rm -r --cached .idea/ 2>nul

echo 📊 Removing coverage reports from Git...
git rm -r --cached coverage/ 2>nul
git rm -r --cached frontend/coverage/ 2>nul
git rm -r --cached backend/coverage/ 2>nul

echo 🎯 Removing Electron build artifacts from Git...
git rm --cached frontend/*.dmg 2>nul
git rm --cached frontend/*.exe 2>nul
git rm --cached frontend/*.AppImage 2>nul
git rm --cached *.dmg 2>nul
git rm --cached *.exe 2>nul
git rm --cached *.AppImage 2>nul

echo ✅ Git cleanup complete!
echo.
echo 📋 Next steps:
echo 1. Review the changes: git status
echo 2. Commit the cleanup: git add . ^&^& git commit -m "chore: update .gitignore and remove tracked files that should be ignored"
echo 3. Push changes: git push
echo.
echo ⚠️  Note: This script only removes files from Git tracking.
echo    The actual files remain on your local filesystem.

pause