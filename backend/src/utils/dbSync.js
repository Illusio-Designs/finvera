const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

/**
 * Run database migrations and seeders on server start
 * Only syncs/alters tables if needed
 */
async function syncDatabase() {
  try {
    logger.info('🔄 Initializing database...');

    // First, authenticate the connection
    await sequelize.authenticate();

    // Sync models with alter: true (will alter existing tables to match models)
    // This is safer than force: true which drops tables
    await sequelize.sync({ alter: true });

    // Run seeders
    await runSeeders();

    logger.info('✅ Database ready');
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Run all seeder files
 */
async function runSeeders() {
  try {
    const seedersPath = path.join(__dirname, '../seeders');
    
    if (!fs.existsSync(seedersPath)) {
      return;
    }

    const seederFiles = fs
      .readdirSync(seedersPath)
      .filter((file) => file.endsWith('.js'))
      .sort(); // Sort to run in order

    if (seederFiles.length === 0) {
      return;
    }

    // Create a table to track which seeders have been run
    await ensureSeederTable();

    let executedCount = 0;
    let skippedCount = 0;

    for (const file of seederFiles) {
      const seederName = file.replace('.js', '');
      
      // Check if seeder has already been run
      const [results] = await sequelize.query(
        'SELECT * FROM seeder_meta WHERE name = ?',
        { replacements: [seederName], type: Sequelize.QueryTypes.SELECT }
      );

      if (results && results.length > 0) {
        skippedCount++;
        continue;
      }

      // Run the seeder
      const seeder = require(path.join(seedersPath, file));
      
      if (typeof seeder.up === 'function') {
        await seeder.up(sequelize.getQueryInterface(), Sequelize);
        
        // Mark seeder as executed
        await sequelize.query(
          'INSERT INTO seeder_meta (name, executed_at) VALUES (?, ?)',
          { replacements: [seederName, new Date()] }
        );
        
        executedCount++;
      }
    }

    if (executedCount > 0) {
      logger.info(`📦 Seeded: ${executedCount} new, ${skippedCount} skipped`);
    }
  } catch (error) {
    logger.error('❌ Seeding failed:', error.message || error);
    if (error.errors) {
      error.errors.forEach(err => {
        logger.error(`  - ${err.message || err.type}: ${err.path || ''}`);
      });
    }
    // Don't throw error - server should still start even if seeders fail
  }
}

/**
 * Ensure the seeder_meta table exists to track executed seeders
 */
async function ensureSeederTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS seeder_meta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at DATETIME NOT NULL,
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (error) {
    logger.error('Error creating seeder_meta table:', error);
    throw error;
  }
}

module.exports = { syncDatabase, runSeeders };
