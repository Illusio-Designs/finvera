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

    // Check if admin tenant exists
    let adminTenant = await queryInterface.sequelize.query(
      `SELECT id FROM tenants WHERE company_name = 'Finvera Admin'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    let tenantId;
    if (adminTenant.length === 0) {
      // Create admin tenant
      const tenantUuid = '00000000-0000-0000-0000-000000000099';
      await queryInterface.bulkInsert('tenants', [
        {
          id: tenantUuid,
          company_name: 'Finvera Admin',
          subscription_plan: 'ADMIN',
          is_active: true,
          email: 'admin@finvera.com',
          createdAt: now,
          updatedAt: now,
        },
      ]);
      tenantId = tenantUuid;
      console.log('✓ Admin tenant created');
    } else {
      tenantId = adminTenant[0].id;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('Rishi@1995', 10);

    // Create admin user
    await queryInterface.bulkInsert('users', [
      {
        id: '00000000-0000-0000-0000-000000000098',
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
    
    // Optionally remove admin tenant if no other users are associated
    await queryInterface.bulkDelete('tenants', { company_name: 'Finvera Admin' }, {});
  },
};
