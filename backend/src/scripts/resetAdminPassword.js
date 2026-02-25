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

    // Reset rishi@fintranzact.com password
    const rishiPasswordHash = await bcrypt.hash('Rishi@1995', 10);
    const [rishiResult] = await sequelize.query(
      `UPDATE users SET password = ?, updatedAt = ? WHERE email = 'rishi@fintranzact.com'`,
      {
        replacements: [rishiPasswordHash, now],
        type: QueryTypes.UPDATE,
      }
    );
    console.log('✓ Password reset for rishi@fintranzact.com');
    console.log('  - Email: rishi@fintranzact.com');
    console.log('  - New Password: Rishi@1995');

    console.log('\n✅ Admin password reset successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting admin passwords:', error);
    process.exit(1);
  }
}

resetAdminPasswords();
