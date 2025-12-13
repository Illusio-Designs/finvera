'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Check if any tenant exists
    const existingTenants = await queryInterface.sequelize.query(
      'SELECT id FROM tenants LIMIT 1',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingTenants.length > 0) {
      return;
    }

    // Create a default tenant for the system
    await queryInterface.bulkInsert('tenants', [
      {
        id: '00000000-0000-0000-0000-000000000001',
        company_name: 'System',
        subscription_plan: '00000000-0000-0000-0000-000000000001', // FREE plan
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    console.log('✓ Default tenant created');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('tenants', { id: '00000000-0000-0000-0000-000000000001' }, {});
  },
};
