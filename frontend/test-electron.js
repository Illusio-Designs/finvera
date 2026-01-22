const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing Finvera Client Electron App...');
console.log('📁 App location:', path.join(__dirname, 'dist-electron/win-unpacked/Finvera Client.exe'));

// Test if the EXE exists
const fs = require('fs');
const exePath = path.join(__dirname, 'dist-electron/win-unpacked/Finvera Client.exe');

if (fs.existsSync(exePath)) {
  console.log('✅ EXE file exists');
  
  // Check file size
  const stats = fs.statSync(exePath);
  console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  console.log('🚀 Starting Electron app...');
  console.log('💡 The app should open and show the client login page');
  console.log('🔍 Check that:');
  console.log('   - App opens without white screen');
  console.log('   - Shows client login page');
  console.log('   - Window controls (minimize, maximize, close) work');
  console.log('   - Navigation is restricted to client pages only');
  
} else {
  console.log('❌ EXE file not found');
  console.log('🔧 Run "npm run electron:build" to build the app');
}