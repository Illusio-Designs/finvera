#!/usr/bin/env node

/**
 * Electron Setup Validation Script
 * Checks if all required files and dependencies are in place
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - Missing: ${filePath}`, 'red');
    return false;
  }
}

function checkPackageScript(scriptName, description) {
  const packageJson = require('../package.json');
  if (packageJson.scripts && packageJson.scripts[scriptName]) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - Missing script: ${scriptName}`, 'red');
    return false;
  }
}

function checkDependency(depName, isDev = false) {
  const packageJson = require('../package.json');
  const deps = isDev ? packageJson.devDependencies : packageJson.dependencies;
  if (deps && deps[depName]) {
    log(`✓ ${depName} (${deps[depName]})`, 'green');
    return true;
  } else {
    log(`✗ ${depName} - Not installed`, 'red');
    return false;
  }
}

console.log('\n' + '='.repeat(50));
log('Finvera Electron Setup Validation', 'blue');
console.log('='.repeat(50) + '\n');

let allChecks = true;

// Check core Electron files
log('\nChecking Core Electron Files:', 'yellow');
allChecks &= checkFile('electron/main.js', 'Main process file');
allChecks &= checkFile('electron/preload.js', 'Preload script');
allChecks &= checkFile('electron/entitlements.mac.plist', 'macOS entitlements');

// Check configuration files
log('\nChecking Configuration Files:', 'yellow');
allChecks &= checkFile('package.json', 'Package configuration');
allChecks &= checkFile('next.config.js', 'Next.js configuration');

// Check utility files
log('\nChecking Utility Files:', 'yellow');
allChecks &= checkFile('lib/electron.js', 'Electron utilities');
allChecks &= checkFile('components/ElectronInfo.jsx', 'ElectronInfo component');

// Check scripts
log('\nChecking Package Scripts:', 'yellow');
allChecks &= checkPackageScript('electron:dev', 'Development script');
allChecks &= checkPackageScript('electron:build', 'Build script');
allChecks &= checkPackageScript('electron:build:mac', 'macOS build script');
allChecks &= checkPackageScript('electron:build:win', 'Windows build script');

// Check dependencies
log('\nChecking Runtime Dependencies:', 'yellow');
allChecks &= checkDependency('electron-is-dev');
allChecks &= checkDependency('electron-store');

// Check dev dependencies
log('\nChecking Development Dependencies:', 'yellow');
allChecks &= checkDependency('electron', true);
allChecks &= checkDependency('electron-builder', true);
allChecks &= checkDependency('concurrently', true);
allChecks &= checkDependency('wait-on', true);

// Check for icons
log('\nChecking Application Icons:', 'yellow');
const iconPath = path.join(__dirname, 'assets');
const hasIcns = fs.existsSync(path.join(iconPath, 'icon.icns'));
const hasIco = fs.existsSync(path.join(iconPath, 'icon.ico'));
const hasPng = fs.existsSync(path.join(iconPath, 'icon.png'));

if (hasIcns) {
  log('✓ macOS icon (icon.icns)', 'green');
} else {
  log('⚠ macOS icon (icon.icns) - Optional but recommended', 'yellow');
}

if (hasIco) {
  log('✓ Windows icon (icon.ico)', 'green');
} else {
  log('⚠ Windows icon (icon.ico) - Optional but recommended', 'yellow');
}

if (hasPng) {
  log('✓ Linux icon (icon.png)', 'green');
} else {
  log('⚠ Linux icon (icon.png) - Optional but recommended', 'yellow');
}

// Summary
console.log('\n' + '='.repeat(50));
if (allChecks) {
  log('✓ All required components are installed!', 'green');
  log('\nYou can now run:', 'blue');
  log('  npm run electron:dev     - Start development', 'blue');
  log('  npm run electron:build   - Build for production', 'blue');
} else {
  log('✗ Some components are missing!', 'red');
  log('\nPlease run:', 'yellow');
  log('  npm install', 'yellow');
  log('\nOr use the setup script:', 'yellow');
  log('  ./electron/setup.sh (Mac/Linux)', 'yellow');
  log('  electron\\setup.bat (Windows)', 'yellow');
}
console.log('='.repeat(50) + '\n');

process.exit(allChecks ? 0 : 1);
