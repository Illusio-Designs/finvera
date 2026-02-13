/**
 * Migration: Add TDS/TCS enablement settings to company_master
 * Phase 1: Foundation Layer - Company Level Settings
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add TDS/TCS enablement flags to company_master
      await queryInterface.addColumn(
        'company_master',
        'is_tds_enabled',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Enable TDS (Tax Deducted at Source) compliance',
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'company_master',
        'is_tcs_enabled',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Enable TCS (Tax Collected at Source) compliance',
        },
        { transaction }
      );

      await transaction.commit();
      console.log('✅ TDS/TCS company settings migration completed');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ TDS/TCS company settings migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.removeColumn('company_master', 'is_tcs_enabled', { transaction });
      await queryInterface.removeColumn('company_master', 'is_tds_enabled', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
