/**
 * Migration: Add TDS/TCS fields to ledgers table
 * Phase 1: Foundation Layer - Ledger Master Enhancement
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // System-generated ledger controls
      await queryInterface.addColumn(
        'ledgers',
        'is_system_generated',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'System-generated ledgers (TDS/TCS Payable) - cannot be edited/deleted',
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'ledgers',
        'system_code',
        {
          type: Sequelize.STRING(50),
          allowNull: true,
          unique: true,
          comment: 'Unique system code (TDS_PAYABLE, TCS_PAYABLE, etc.)',
        },
        { transaction }
      );

      // TDS fields
      await queryInterface.addColumn(
        'ledgers',
        'is_tds_applicable',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Mark if TDS should be deducted for this party',
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'ledgers',
        'tds_section_code',
        {
          type: Sequelize.STRING(20),
          allowNull: true,
          comment: 'TDS Section (194C, 194J, etc.)',
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'ledgers',
        'tds_deductor_type',
        {
          type: Sequelize.ENUM('Individual', 'Company'),
          allowNull: true,
          comment: 'Type of deductor for TDS rate determination',
        },
        { transaction }
      );

      // TCS fields
      await queryInterface.addColumn(
        'ledgers',
        'is_tcs_applicable',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Mark if TCS should be collected for this party',
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'ledgers',
        'tcs_section_code',
        {
          type: Sequelize.STRING(20),
          allowNull: true,
          comment: 'TCS Section (206C1H, etc.)',
        },
        { transaction }
      );

      // PAN field (if not exists)
      const tableDescription = await queryInterface.describeTable('ledgers');
      if (!tableDescription.pan_no) {
        await queryInterface.addColumn(
          'ledgers',
          'pan_no',
          {
            type: Sequelize.STRING(20),
            allowNull: true,
            comment: 'PAN number - mandatory for TDS/TCS',
          },
          { transaction }
        );
      }

      await transaction.commit();
      console.log('✅ TDS/TCS ledger fields migration completed');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ TDS/TCS ledger fields migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.removeColumn('ledgers', 'tcs_section_code', { transaction });
      await queryInterface.removeColumn('ledgers', 'is_tcs_applicable', { transaction });
      await queryInterface.removeColumn('ledgers', 'tds_deductor_type', { transaction });
      await queryInterface.removeColumn('ledgers', 'tds_section_code', { transaction });
      await queryInterface.removeColumn('ledgers', 'is_tds_applicable', { transaction });
      await queryInterface.removeColumn('ledgers', 'system_code', { transaction });
      await queryInterface.removeColumn('ledgers', 'is_system_generated', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
