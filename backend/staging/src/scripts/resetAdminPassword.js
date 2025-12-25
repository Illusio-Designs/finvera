/**
 * Script to reset admin user passwords
 * Run with: node src/scripts/resetAdminPassword.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function resetAdminPasswords() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    const now = new Date();

    // Reset admin@finvera.com password
    const adminPasswordHash = await bcrypt.hash('admin@123', 10);
    const [adminResult] = await sequelize.query(
      `UPDATE users SET password = ?, updatedAt = ? WHERE email = 'admin@finvera.com'`,
      {
        replacements: [adminPasswordHash, now],
        type: QueryTypes.UPDATE,
      }
    );
    console.log('✓ Password reset for admin@finvera.com');
    console.log('  - Email: admin@finvera.com');
    console.log('  - New Password: admin@123');

    // Reset Rishi@finvera.com password
    const rishiPasswordHash = await bcrypt.hash('Rishi@1995', 10);
    const [rishiResult] = await sequelize.query(
      `UPDATE users SET password = ?, updatedAt = ? WHERE email = 'Rishi@finvera.com'`,
      {
        replacements: [rishiPasswordHash, now],
        type: QueryTypes.UPDATE,
      }
    );
    console.log('✓ Password reset for Rishi@finvera.com');
    console.log('  - Email: Rishi@finvera.com');
    console.log('  - New Password: Rishi@1995');

    console.log('\n✅ Admin passwords reset successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting admin passwords:', error);
    process.exit(1);
  }
}

resetAdminPasswords();
