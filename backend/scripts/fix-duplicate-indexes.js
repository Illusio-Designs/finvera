#!/usr/bin/env node

/**
 * Fix Duplicate Indexes Script
 * 
 * This script identifies and removes duplicate indexes that can accumulate
 * from repeated Sequelize sync operations, preventing the MySQL 64-index limit error.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDuplicateIndexes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_ROOT_USER || process.env.DB_USER || 'root',
    password: process.env.DB_ROOT_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.MASTER_DB_NAME || 'finvera_master'
  });

  try {
    console.log('🔍 Checking for tables with excessive indexes...');

    // Find tables with too many indexes
    const [tables] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        COUNT(*) as INDEX_COUNT
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = ?
      GROUP BY TABLE_NAME
      HAVING COUNT(*) > 10
      ORDER BY INDEX_COUNT DESC
    `, [process.env.MASTER_DB_NAME || 'finvera_master']);

    if (tables.length === 0) {
      console.log('✅ No tables with excessive indexes found.');
      return;
    }

    console.log('📊 Tables with many indexes:');
    tables.forEach(table => {
      console.log(`   ${table.TABLE_NAME}: ${table.INDEX_COUNT} indexes`);
    });

    // Fix each problematic table
    for (const table of tables) {
      if (table.INDEX_COUNT >= 50) {
        console.log(`\n🔧 Fixing ${table.TABLE_NAME}...`);
        await fixTableIndexes(connection, table.TABLE_NAME);
      }
    }

    console.log('\n✅ Index cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing indexes:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function fixTableIndexes(connection, tableName) {
  // Get all indexes for the table
  const [indexes] = await connection.execute(`
    SELECT DISTINCT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
    ORDER BY INDEX_NAME
  `, [process.env.MASTER_DB_NAME || 'finvera_master', tableName]);

  // Group indexes by base name to identify duplicates
  const indexGroups = {};
  indexes.forEach(index => {
    if (index.INDEX_NAME === 'PRIMARY') return; // Never drop PRIMARY key
    
    // Extract base name (remove _2, _3, etc. suffixes)
    const baseName = index.INDEX_NAME.replace(/_\d+$/, '');
    
    if (!indexGroups[baseName]) {
      indexGroups[baseName] = [];
    }
    indexGroups[baseName].push(index);
  });

  // Drop duplicate indexes (keep only the first one of each group)
  for (const [baseName, group] of Object.entries(indexGroups)) {
    if (group.length > 1) {
      console.log(`   Removing ${group.length - 1} duplicate indexes for ${baseName}`);
      
      // Keep the first index, drop the rest
      for (let i = 1; i < group.length; i++) {
        const indexName = group[i].INDEX_NAME;
        try {
          await connection.execute(`ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\``);
          console.log(`     ✓ Dropped ${indexName}`);
        } catch (error) {
          console.log(`     ⚠️  Could not drop ${indexName}: ${error.message}`);
        }
      }
    }
  }
}

// Run the script
if (require.main === module) {
  fixDuplicateIndexes()
    .then(() => {
      console.log('\n🎉 All done! Your database indexes are now optimized.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { fixDuplicateIndexes };