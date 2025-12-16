#!/usr/bin/env node

/**
 * Initialize Master Database
 * Creates the master database and runs migrations
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const masterSequelize = require('../config/masterDatabase');
const TenantMaster = require('../models/TenantMaster');
const logger = require('../utils/logger');

async function initMasterDatabase() {
  console.log('🚀 Initializing Master Database...\n');

  try {
    // Create master database if it doesn't exist
    const rootConnection = new Sequelize('', process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
    });

    const masterDbName = process.env.MASTER_DB_NAME || 'finvera_master';
    
    console.log(`📦 Creating database: ${masterDbName}`);
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${masterDbName}\``);
    await rootConnection.close();
    console.log('✅ Master database created\n');

    // Sync master database models
    console.log('🔄 Syncing master database tables...');
    await masterSequelize.sync({ alter: true });
    console.log('✅ Master database tables synced\n');

    // Verify connection
    await masterSequelize.authenticate();
    console.log('✅ Master database connection verified\n');

    console.log('✨ Master database initialization complete!\n');
    console.log('Next steps:');
    console.log('1. Create your first tenant using the API or admin panel');
    console.log('2. Each tenant will get their own separate database\n');

    process.exit(0);
  } catch (error) {
    logger.error('Failed to initialize master database:', error);
    console.error('❌ Initialization failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initMasterDatabase();
}

module.exports = initMasterDatabase;
