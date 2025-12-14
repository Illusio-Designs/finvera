#!/usr/bin/env node

/**
 * Fix Commissions Table Script
 * 
 * This script will drop only the commissions table and let Sequelize recreate it.
 * This is a less destructive alternative to resetting the entire database.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

async function fixCommissionsTable() {
  const connection = new Sequelize({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'finvera_db',
    dialect: 'mysql',
    logging: console.log,
  });

  try {
    console.log('🔄 Connecting to database...');
    await connection.authenticate();
    console.log('✅ Connected to database');

    // Check if commissions table exists
    const [tables] = await connection.query(`SHOW TABLES LIKE 'commissions'`);
    
    if (tables.length === 0) {
      console.log('ℹ️  Commissions table does not exist. Nothing to fix.');
      return;
    }

    console.log('\n🔍 Checking foreign key constraints on commissions table...');
    const [constraints] = await connection.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'finvera_db'}' 
        AND TABLE_NAME = 'commissions' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    if (constraints.length > 0) {
      console.log(`\n📋 Found ${constraints.length} foreign key constraint(s):`);
      constraints.forEach(c => console.log(`   - ${c.CONSTRAINT_NAME}`));
    }

    console.log('\n⚠️  This will drop the commissions table (all commission data will be lost)');
    console.log('⏳ Dropping in 3 seconds... Press Ctrl+C to cancel');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n🗑️  Dropping commissions table...');
    await connection.query('DROP TABLE IF EXISTS `commissions`');
    console.log('✅ Commissions table dropped');

    console.log('\n✅ Fix complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start your server: npm start');
    console.log('   2. The server will automatically recreate the commissions table with correct schema');

  } catch (error) {
    console.error('\n❌ Error fixing commissions table:', error.message);
    process.exit(1);
  } finally {
    await connection.close();
  }
}

// Run if called directly
if (require.main === module) {
  fixCommissionsTable()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = fixCommissionsTable;
