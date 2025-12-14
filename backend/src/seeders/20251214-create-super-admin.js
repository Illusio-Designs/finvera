'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Check if super admin already exists
    const existingAdmin = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@finvera.com'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingAdmin.length > 0) {
      console.log('ℹ️  Super admin already exists');
      return;
    }

    const uuid = require('uuid');

    // Hash the password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // Create super admin user (platform-wide admin, no tenant_id)
    await queryInterface.bulkInsert('users', [
      {
        id: uuid.v4(),
        email: 'admin@finvera.com',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'super_admin',
        phone: null,
        is_active: true,
        last_login: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    console.log('✓ Super admin created: admin@finvera.com (Password: Admin@123)');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@finvera.com' }, {});
  },
};
