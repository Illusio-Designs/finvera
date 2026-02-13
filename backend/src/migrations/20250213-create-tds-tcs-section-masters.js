/**
 * Migration: Create TDS/TCS Section Master tables
 * Phase 1: Foundation Layer - Section Configuration
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // TDS Section Master (Master DB)
      await queryInterface.createTable(
        'tds_section_master',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          section_code: {
            type: Sequelize.STRING(20),
            allowNull: false,
            unique: true,
            comment: 'Section code (194C, 194J, etc.)',
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: false,
            comment: 'Description of the section',
          },
          rate_individual: {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: false,
            comment: 'TDS rate for individuals (%)',
          },
          rate_company: {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: false,
            comment: 'TDS rate for companies (%)',
          },
          threshold_limit: {
            type: Sequelize.DECIMAL(18, 2),
            allowNull: true,
            comment: 'Threshold limit for TDS applicability',
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          },
        },
        { transaction }
      );

      // TCS Section Master (Master DB)
      await queryInterface.createTable(
        'tcs_section_master',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          section_code: {
            type: Sequelize.STRING(20),
            allowNull: false,
            unique: true,
            comment: 'Section code (206C1H, etc.)',
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: false,
            comment: 'Description of the section',
          },
          rate: {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: false,
            comment: 'TCS rate (%)',
          },
          threshold_limit: {
            type: Sequelize.DECIMAL(18, 2),
            allowNull: true,
            comment: 'Threshold limit for TCS applicability',
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          },
        },
        { transaction }
      );

      // Insert default TDS sections
      await queryInterface.bulkInsert(
        'tds_section_master',
        [
          {
            section_code: '194C',
            description: 'Payment to contractors and sub-contractors',
            rate_individual: 1.00,
            rate_company: 2.00,
            threshold_limit: 30000.00,
          },
          {
            section_code: '194J',
            description: 'Fees for professional or technical services',
            rate_individual: 10.00,
            rate_company: 10.00,
            threshold_limit: 30000.00,
          },
          {
            section_code: '194H',
            description: 'Commission or brokerage',
            rate_individual: 5.00,
            rate_company: 5.00,
            threshold_limit: 15000.00,
          },
          {
            section_code: '194I',
            description: 'Rent',
            rate_individual: 10.00,
            rate_company: 10.00,
            threshold_limit: 240000.00,
          },
          {
            section_code: '194Q',
            description: 'Payment for purchase of goods',
            rate_individual: 0.10,
            rate_company: 0.10,
            threshold_limit: 5000000.00,
          },
        ],
        { transaction }
      );

      // Insert default TCS sections
      await queryInterface.bulkInsert(
        'tcs_section_master',
        [
          {
            section_code: '206C1H',
            description: 'Sale of goods',
            rate: 0.10,
            threshold_limit: 5000000.00,
          },
        ],
        { transaction }
      );

      await transaction.commit();
      console.log('✅ TDS/TCS section masters created with default data');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ TDS/TCS section masters migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.dropTable('tcs_section_master', { transaction });
      await queryInterface.dropTable('tds_section_master', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
