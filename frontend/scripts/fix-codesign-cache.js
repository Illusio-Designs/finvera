const fs = require('fs');
const path = require('path');
const os = require('os');

// Function to fix the code signing cache issue
function fixCodeSignCache() {
  const cacheDir = path.join(os.homedir(), 'AppData', 'Local', 'electron-builder', 'Cache', 'winCodeSign');
  
  console.log('🔧 Fixing code signing cache...');
  console.log('Cache directory:', cacheDir);
  
  try {
    // Remove the entire winCodeSign cache directory
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
      console.log('✅ Removed winCodeSign cache directory');
    }
    
    // Create a dummy directory structure to prevent downloads
    fs.mkdirSync(cacheDir, { recursive: true });
    
    // Create a dummy extracted directory to fool electron-builder
    const dummyExtractDir = path.join(cacheDir, '820800831');
    fs.mkdirSync(dummyExtractDir, { recursive: true });
    
    // Create the expected directory structure without symbolic links
    const darwinDir = path.join(dummyExtractDir, 'darwin', '10.12', 'lib');
    fs.mkdirSync(darwinDir, { recursive: true });
    
    // Create dummy files instead of symbolic links
    fs.writeFileSync(path.join(darwinDir, 'libcrypto.dylib'), 'dummy');
    fs.writeFileSync(path.join(darwinDir, 'libssl.dylib'), 'dummy');
    
    // Create other expected directories
    const winDir = path.join(dummyExtractDir, 'win');
    fs.mkdirSync(winDir, { recursive: true });
    
    console.log('✅ Created dummy code signing cache structure');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to fix code signing cache:', error);
    return false;
  }
}

module.exports = { fixCodeSignCache };

// Run if called directly
if (require.main === module) {
  fixCodeSignCache();
}