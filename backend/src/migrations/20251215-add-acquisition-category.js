/**
 * Migration to add acquisition_category field to tenant_master table
 * Run this on the master database
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column already exists
    const [results] = await queryInterface.sequelize.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'tenant_master' 
       AND COLUMN_NAME = 'acquisition_category'`
    );

    if (results.length === 0) {
      // Add the column
      await queryInterface.addColumn('tenant_master', 'acquisition_category', {
        type: Sequelize.ENUM('distributor', 'salesman', 'referral', 'organic'),
        defaultValue: 'organic',
        allowNull: false,
        comment: 'How the tenant was acquired: distributor (from distributor), salesman (from salesman), referral (from referral code), organic (direct from website)',
      });

      // Add index for faster queries
      await queryInterface.addIndex('tenant_master', ['acquisition_category'], {
        name: 'tenant_master_acquisition_category',
      });

      console.log('✅ Added acquisition_category column to tenant_master table');
    } else {
      console.log('ℹ️  acquisition_category column already exists');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove index first
    await queryInterface.removeIndex('tenant_master', 'tenant_master_acquisition_category');
    
    // Remove the column
    await queryInterface.removeColumn('tenant_master', 'acquisition_category');
    
    console.log('✅ Removed acquisition_category column from tenant_master table');
  },
};
