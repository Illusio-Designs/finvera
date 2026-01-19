#!/usr/bin/env node

/**
 * Build script for client-only Electron app (macOS DMG)
 * This script builds the app with client-only restrictions for macOS
 */

const { execSync } = require('child_process');

console.log('🍎 Building Finvera Client-Only Electron App for macOS...\n');

// Set environment variables for client-only build
process.env.ELECTRON_BUILD = 'true';
process.env.ELECTRON_CLIENT_ONLY = 'true';
process.env.NODE_ENV = 'production';

try {
  console.log('🔨 Building Next.js application with client-only mode...');
  console.log('Environment variables:');
  console.log('- ELECTRON_BUILD:', process.env.ELECTRON_BUILD);
  console.log('- ELECTRON_CLIENT_ONLY:', process.env.ELECTRON_CLIENT_ONLY);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  
  execSync('next build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      ELECTRON_BUILD: 'true',
      ELECTRON_CLIENT_ONLY: 'true',
      NODE_ENV: 'production'
    }
  });

  console.log('⚡ Building Electron application for macOS...');
  execSync('electron-builder --mac', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      ELECTRON_BUILD: 'true',
      ELECTRON_CLIENT_ONLY: 'true',
      NODE_ENV: 'production'
    }
  });

  console.log('\n✅ Build completed successfully!');
  console.log('📁 Output files are in the "dist" directory');
  console.log('🎉 Your client-only macOS DMG is ready!');
  console.log('\nGenerated files:');
  console.log('- Finvera Client-{version}.dmg (DMG Installer)');
  console.log('- Finvera Client-{version}-mac.zip (ZIP Archive)');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}