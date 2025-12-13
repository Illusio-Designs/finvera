/**
 * Reset all seeders and data
 * Run: node reset-seeds.js
 */

require('dotenv').config();
const sequelize = require('./src/config/database');

async function resetSeeds() {
  try {
    console.log('🔄 Resetting seeders...');

    // Disable foreign key checks temporarily
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Clear seeder tracking
    await sequelize.query('DELETE FROM seeder_meta');
    console.log('✓ Cleared seeder tracking');

    // Clear seeded data (by identifying criteria, not IDs)
    await sequelize.query("DELETE FROM users WHERE email = 'Rishi@finvera.com'");
    console.log('✓ Deleted admin user');

    await sequelize.query('DELETE FROM account_groups WHERE is_system = true');
    console.log('✓ Deleted account groups');

    await sequelize.query("DELETE FROM tenants WHERE company_name = 'System'");
    console.log('✓ Deleted default tenant');

    await sequelize.query("DELETE FROM subscription_plans WHERE plan_code IN ('FREE', 'STARTER')");
    console.log('✓ Deleted subscription plans');

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Reset complete! Restart your server.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    // Re-enable foreign key checks even on error
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (e) {
      // Ignore
    }
    process.exit(1);
  }
}

resetSeeds();
