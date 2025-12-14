#!/usr/bin/env node

/**
 * Import Old Account Groups
 * 
 * This script imports your old 200+ account groups into finvera_master
 */

const masterModels = require('../src/models/masterModels');
require('dotenv').config();

async function importAccountGroups() {
  try {
    console.log('🔄 Starting account groups import...\n');

    // OPTION 1: Import from SQL file
    // If you have a SQL dump of your old account_groups table
    const importFromSQL = async (sqlFilePath) => {
      const fs = require('fs');
      const { masterSequelize } = require('../src/config/masterDatabase');
      
      const sql = fs.readFileSync(sqlFilePath, 'utf8');
      await masterSequelize.query(sql);
      
      console.log('✅ Imported from SQL file');
    };

    // OPTION 2: Import from JSON file
    const importFromJSON = async (jsonFilePath) => {
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
      
      let count = 0;
      for (const group of data) {
        await masterModels.AccountGroup.findOrCreate({
          where: { group_code: group.group_code || group.code },
          defaults: {
            group_code: group.group_code || group.code,
            name: group.name || group.group_name,
            parent_id: group.parent_id,
            nature: group.nature || group.group_type,
            affects_gross_profit: group.affects_gross_profit === '1' || group.affects_gross_profit === true,
            is_system: group.is_system === '1' || group.is_system === true || true,
          }
        });
        count++;
      }
      
      console.log(`✅ Imported ${count} account groups from JSON`);
    };

    // OPTION 3: Import from CSV file
    const importFromCSV = async (csvFilePath) => {
      const fs = require('fs');
      const csv = require('csv-parser');
      const groups = [];
      
      return new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
          .pipe(csv())
          .on('data', (row) => {
            groups.push({
              group_code: row.code || row.group_code,
              name: row.name || row.group_name,
              parent_id: row.parent_id || null,
              nature: row.nature || row.group_type,
              affects_gross_profit: row.affects_gross_profit === '1' || row.affects_gross_profit === 'true',
              is_system: true,
            });
          })
          .on('end', async () => {
            for (const group of groups) {
              await masterModels.AccountGroup.findOrCreate({
                where: { group_code: group.group_code },
                defaults: group
              });
            }
            console.log(`✅ Imported ${groups.length} account groups from CSV`);
            resolve();
          })
          .on('error', reject);
      });
    };

    // OPTION 4: Direct MySQL import from old database
    const importFromOldDatabase = async () => {
      const { Sequelize } = require('sequelize');
      
      // Connect to your old database
      const oldDb = new Sequelize(
        process.env.OLD_DB_NAME || 'old_finvera_db',
        process.env.OLD_DB_USER || process.env.DB_USER,
        process.env.OLD_DB_PASSWORD || process.env.DB_PASSWORD,
        {
          host: process.env.OLD_DB_HOST || process.env.DB_HOST,
          port: process.env.OLD_DB_PORT || process.env.DB_PORT,
          dialect: 'mysql',
          logging: false,
        }
      );

      // Fetch all account groups from old database
      const [oldGroups] = await oldDb.query(`
        SELECT 
          id,
          code,
          name as group_name,
          parent_id,
          LOWER(group_type) as nature,
          affects_gross_profit,
          is_system
        FROM account_groups
        ORDER BY code
      `);

      console.log(`📦 Found ${oldGroups.length} account groups in old database\n`);

      let imported = 0;
      let skipped = 0;

      for (const group of oldGroups) {
        const [record, created] = await masterModels.AccountGroup.findOrCreate({
          where: { group_code: group.code },
          defaults: {
            group_code: group.code,
            name: group.group_name,
            parent_id: group.parent_id,
            nature: group.nature,
            affects_gross_profit: group.affects_gross_profit === '1' || group.affects_gross_profit === 1,
            is_system: group.is_system === '1' || group.is_system === 1 || true,
          }
        });

        if (created) {
          imported++;
          if (imported % 50 === 0) {
            console.log(`   Progress: ${imported}/${oldGroups.length} imported...`);
          }
        } else {
          skipped++;
        }
      }

      await oldDb.close();

      console.log('\n✅ Import complete!');
      console.log(`   - Imported: ${imported}`);
      console.log(`   - Skipped (already exists): ${skipped}`);
      console.log(`   - Total: ${oldGroups.length}`);

      return { imported, skipped, total: oldGroups.length };
    };

    // Detect which method to use
    const args = process.argv.slice(2);
    
    if (args[0] === '--sql' && args[1]) {
      await importFromSQL(args[1]);
    } else if (args[0] === '--json' && args[1]) {
      await importFromJSON(args[1]);
    } else if (args[0] === '--csv' && args[1]) {
      await importFromCSV(args[1]);
    } else if (args[0] === '--from-old-db') {
      await importFromOldDatabase();
    } else {
      console.log('📋 Usage:');
      console.log('');
      console.log('  Option 1 - From old database:');
      console.log('    node scripts/importOldAccountGroups.js --from-old-db');
      console.log('');
      console.log('  Option 2 - From SQL file:');
      console.log('    node scripts/importOldAccountGroups.js --sql /path/to/account_groups.sql');
      console.log('');
      console.log('  Option 3 - From JSON file:');
      console.log('    node scripts/importOldAccountGroups.js --json /path/to/account_groups.json');
      console.log('');
      console.log('  Option 4 - From CSV file:');
      console.log('    node scripts/importOldAccountGroups.js --csv /path/to/account_groups.csv');
      console.log('');
      console.log('💡 Set OLD_DB_* environment variables in .env for --from-old-db option');
      console.log('');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  importAccountGroups()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Error:', err);
      process.exit(1);
    });
}

module.exports = importAccountGroups;
