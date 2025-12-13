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

    // Clear seeded data in correct order (children first, then parents)
    // 1. Delete users (child of tenants)
    await sequelize.query("DELETE FROM users WHERE email = 'Rishi@finvera.com'");
    console.log('✓ Deleted admin user');

    // 2. Delete account groups (child of tenants)
    await sequelize.query('DELETE FROM account_groups WHERE is_system = true');
    console.log('✓ Deleted account groups');

    // 3. Delete tenants (parent)
    await sequelize.query("DELETE FROM tenants WHERE company_name = 'System'");
    console.log('✓ Deleted default tenant');

    // 4. Delete subscription plans (independent)
    await sequelize.query('DELETE FROM subscription_plans');
    console.log('✓ Deleted subscription plans');

    console.log('✅ Reset complete! Restart your server.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  }
}

resetSeeds();
