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
        company_name: 'System',
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    console.log('✓ Default tenant created');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('tenants', { company_name: 'System' }, {});
  },
};
