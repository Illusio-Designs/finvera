'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Check if admin user already exists
    const existingAdmin = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'Rishi@finvera.com'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingAdmin.length > 0) {
      return;
    }

    // Get the first tenant (admin user will be associated with first tenant)
    const tenants = await queryInterface.sequelize.query(
      `SELECT id FROM tenants LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tenants.length === 0) {
      console.log('⚠ No tenants found. Create a tenant first to add admin user.');
      return;
    }

    const tenantId = tenants[0].id;

    const uuid = require('uuid');

    // Hash the password
    const hashedPassword = await bcrypt.hash('Rishi@1995', 10);

    // Create admin user
    await queryInterface.bulkInsert('users', [
      {
        id: uuid.v4(),
        tenant_id: tenantId,
        email: 'Rishi@finvera.com',
        password_hash: hashedPassword,
        full_name: 'Rishi Kumar',
        role: 'admin',
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    console.log('✓ Admin user: Rishi@finvera.com');
  },

  async down(queryInterface) {
    // Remove admin user
    await queryInterface.bulkDelete('users', { email: 'Rishi@finvera.com' }, {});
  },
};
