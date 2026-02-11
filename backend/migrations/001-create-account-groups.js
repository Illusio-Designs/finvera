/**
 * Migration: Create Account Groups Table
 * This migration creates the account_groups table in the master database
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('account_groups', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'account_groups',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      nature: {
        type: Sequelize.ENUM('asset', 'liability', 'equity', 'income', 'expense'),
        allowNull: false,
      },
      affects_gross_profit: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_system: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      group_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
      },
      bs_category: {
        type: Sequelize.STRING(30),
        allowNull: true,
        comment: 'Balance sheet category: current_asset, fixed_asset, current_liability, noncurrent_liability, equity, tax_control',
      },
      affects_pl: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this group affects Profit & Loss statement',
      },
      is_tax_group: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this is a tax-related group (GST, TDS, etc.)',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes
    await queryInterface.addIndex('account_groups', ['parent_id']);
    await queryInterface.addIndex('account_groups', ['nature']);
    await queryInterface.addIndex('account_groups', ['group_code'], { unique: true });
    await queryInterface.addIndex('account_groups', ['affects_pl']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('account_groups');
  },
};
