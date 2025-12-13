/**
 * Electron Builder Script
 * This script handles the build process for Electron applications
 */

const { build } = require('electron-builder');
const path = require('path');

const buildElectron = async () => {
  console.log('Starting Electron build process...');
  
  const config = {
    config: {
      appId: 'com.finvera.app',
      productName: 'Finvera',
      directories: {
        output: 'dist',
      },
      files: [
        'electron/**/*',
        '.next/**/*',
        'public/**/*',
        'node_modules/**/*',
        'package.json',
      ],
      mac: {
        category: 'public.app-category.finance',
        target: ['dmg', 'zip'],
      },
      win: {
        target: ['nsis', 'portable'],
      },
    },
  };

  try {
    await build(config);
    console.log('Electron build completed successfully!');
  } catch (error) {
    console.error('Electron build failed:', error);
    process.exit(1);
  }
};

buildElectron();
