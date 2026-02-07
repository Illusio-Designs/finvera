#!/usr/bin/env node

/**
 * Update IP Address Script
 * Automatically detects your local IP and updates all configuration files
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get local IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return null;
}

// Update .env files
function updateEnvFile(filePath, newIp) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Replace IP addresses in URLs
  content = content.replace(
    /EXPO_PUBLIC_API_URL=http:\/\/[\d.]+:3000\/api/g,
    `EXPO_PUBLIC_API_URL=http://${newIp}:3000/api`
  );
  content = content.replace(
    /EXPO_PUBLIC_API_BASE_URL=http:\/\/[\d.]+:3000/g,
    `EXPO_PUBLIC_API_BASE_URL=http://${newIp}:3000`
  );
  content = content.replace(
    /EXPO_PUBLIC_UPLOADS_BASE_URL=http:\/\/[\d.]+:3000/g,
    `EXPO_PUBLIC_UPLOADS_BASE_URL=http://${newIp}:3000`
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${path.basename(filePath)}`);
    return true;
  }
  
  console.log(`ℹ️  No changes needed: ${path.basename(filePath)}`);
  return false;
}

// Update app.json
function updateAppJson(filePath, newIp) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const appJson = JSON.parse(content);
  
  let updated = false;
  
  if (appJson.expo && appJson.expo.extra) {
    const extra = appJson.expo.extra;
    
    if (extra.EXPO_PUBLIC_API_URL) {
      extra.EXPO_PUBLIC_API_URL = `http://${newIp}:3000/api`;
      updated = true;
    }
    
    if (extra.EXPO_PUBLIC_API_BASE_URL) {
      extra.EXPO_PUBLIC_API_BASE_URL = `http://${newIp}:3000`;
      updated = true;
    }
    
    if (extra.EXPO_PUBLIC_UPLOADS_BASE_URL) {
      extra.EXPO_PUBLIC_UPLOADS_BASE_URL = `http://${newIp}:3000`;
      updated = true;
    }
  }
  
  if (updated) {
    fs.writeFileSync(filePath, JSON.stringify(appJson, null, 2), 'utf8');
    console.log(`✅ Updated: ${path.basename(filePath)}`);
    return true;
  }
  
  console.log(`ℹ️  No changes needed: ${path.basename(filePath)}`);
  return false;
}

// Main function
function main() {
  console.log('🔍 Detecting local IP address...\n');
  
  const localIp = getLocalIpAddress();
  
  if (!localIp) {
    console.error('❌ Could not detect local IP address');
    console.error('Please ensure you are connected to a network');
    process.exit(1);
  }
  
  console.log(`📡 Detected IP: ${localIp}\n`);
  console.log('📝 Updating configuration files...\n');
  
  const appDir = path.join(__dirname, '..');
  
  // Update files
  const files = [
    { path: path.join(appDir, '.env'), updater: updateEnvFile },
    { path: path.join(appDir, '.env.development'), updater: updateEnvFile },
    { path: path.join(appDir, 'app.json'), updater: updateAppJson },
  ];
  
  let anyUpdated = false;
  
  files.forEach(({ path: filePath, updater }) => {
    if (updater(filePath, localIp)) {
      anyUpdated = true;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (anyUpdated) {
    console.log('✅ Configuration updated successfully!');
    console.log(`\n📱 API URL: http://${localIp}:3000/api`);
    console.log('\n⚠️  IMPORTANT: Restart your Expo development server for changes to take effect:');
    console.log('   1. Stop the current server (Ctrl+C)');
    console.log('   2. Run: npm start');
    console.log('   3. Clear cache if needed: npm start -- --clear');
  } else {
    console.log('ℹ️  All files are already up to date');
  }
  
  console.log('='.repeat(50) + '\n');
}

// Run the script
main();
