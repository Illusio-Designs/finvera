/**
 * Reset all seeders and data
 * Run: node reset-seeds.js
 */

require('dotenv').config();
const sequelize = require('./src/config/database');

async function resetSeeds() {
  try {
    console.log('🔄 Resetting seeders...');

    // Clear seeder tracking
    await sequelize.query('DELETE FROM seeder_meta');
    console.log('✓ Cleared seeder tracking');

    // Clear seeded data
    await sequelize.query("DELETE FROM users WHERE email = 'Rishi@finvera.com'");
    await sequelize.query("DELETE FROM tenants WHERE company_name = 'System'");
    await sequelize.query('DELETE FROM account_groups WHERE is_system = true');
    await sequelize.query('DELETE FROM subscription_plans');
    console.log('✓ Cleared seeded data');

    console.log('✅ Reset complete! Restart your server.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  }
}

resetSeeds();
