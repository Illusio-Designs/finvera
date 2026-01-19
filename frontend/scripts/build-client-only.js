#!/usr/bin/env node

/**
 * Build script for client-only Electron app
 * This script builds the app with client-only restrictions
 */

const { execSync } = require('child_process');

console.log('🚀 Building Finvera Client-Only Electron App...\n');

// Set environment variables for client-only build
process.env.ELECTRON_BUILD = 'true';
process.env.ELECTRON_CLIENT_ONLY = 'true';
process.env.NODE_ENV = 'production';

try {
  console.log('🔨 Building Next.js application with client-only mode...');
  execSync('next build', { stdio: 'inherit' });

  console.log('⚡ Building Electron application for Windows...');
  execSync('electron-builder --win', { stdio: 'inherit' });

  console.log('\n✅ Build completed successfully!');
  console.log('📁 Output files are in the "dist" directory');
  console.log('🎉 Your client-only Windows installer is ready!');
  console.log('\nGenerated files:');
  console.log('- Finvera-Client-Setup-{version}.exe (Installer)');
  console.log('- Finvera-Client-{version}.exe (Portable)');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}