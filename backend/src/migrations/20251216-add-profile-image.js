'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add profile_image column to users table
    // Check if column exists first to avoid errors on re-run
    const tableDescription = await queryInterface.describeTable('users');
    
    if (!tableDescription.profile_image) {
      await queryInterface.addColumn('users', 'profile_image', {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Path to user profile image',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove profile_image column from users table
    const tableDescription = await queryInterface.describeTable('users');
    
    if (tableDescription.profile_image) {
      await queryInterface.removeColumn('users', 'profile_image');
    }
  },
};
