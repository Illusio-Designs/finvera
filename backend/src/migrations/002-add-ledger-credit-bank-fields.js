'use strict';

/**
 * Migration: Add missing credit and bank fields to ledgers table
 * Adds: credit_limit, credit_days, bank_name, bank_account_number, bank_ifsc, bank_branch
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Adding missing fields to ledgers table...');

    try {
      const tableDesc = await queryInterface.describeTable('ledgers');

      // Add credit_limit if missing
      if (!tableDesc.credit_limit) {
        await queryInterface.addColumn('ledgers', 'credit_limit', {
          type: Sequelize.DECIMAL(15, 2),
          defaultValue: 0,
          comment: 'Credit limit for the ledger',
        });
        console.log('✓ Added credit_limit column to ledgers');
      }

      // Add credit_days if missing
      if (!tableDesc.credit_days) {
        await queryInterface.addColumn('ledgers', 'credit_days', {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          comment: 'Credit period in days',
        });
        console.log('✓ Added credit_days column to ledgers');
      }

      // Add bank_name if missing
      if (!tableDesc.bank_name) {
        await queryInterface.addColumn('ledgers', 'bank_name', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Bank name for bank ledgers',
        });
        console.log('✓ Added bank_name column to ledgers');
      }

      // Add bank_account_number if missing
      if (!tableDesc.bank_account_number) {
        await queryInterface.addColumn('ledgers', 'bank_account_number', {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Bank account number',
        });
        console.log('✓ Added bank_account_number column to ledgers');
      }

      // Add bank_ifsc if missing
      if (!tableDesc.bank_ifsc) {
        await queryInterface.addColumn('ledgers', 'bank_ifsc', {
          type: Sequelize.STRING(20),
          allowNull: true,
          comment: 'Bank IFSC code',
        });
        console.log('✓ Added bank_ifsc column to ledgers');
      }

      // Add bank_branch if missing
      if (!tableDesc.bank_branch) {
        await queryInterface.addColumn('ledgers', 'bank_branch', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Bank branch name',
        });
        console.log('✓ Added bank_branch column to ledgers');
      }

      console.log('✅ Successfully added missing fields to ledgers table');
    } catch (error) {
      console.error('❌ Error adding fields to ledgers table:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Removing added fields from ledgers table...');

    try {
      const tableDesc = await queryInterface.describeTable('ledgers');

      if (tableDesc.credit_limit) {
        await queryInterface.removeColumn('ledgers', 'credit_limit');
        console.log('✓ Removed credit_limit column from ledgers');
      }

      if (tableDesc.credit_days) {
        await queryInterface.removeColumn('ledgers', 'credit_days');
        console.log('✓ Removed credit_days column from ledgers');
      }

      if (tableDesc.bank_name) {
        await queryInterface.removeColumn('ledgers', 'bank_name');
        console.log('✓ Removed bank_name column from ledgers');
      }

      if (tableDesc.bank_account_number) {
        await queryInterface.removeColumn('ledgers', 'bank_account_number');
        console.log('✓ Removed bank_account_number column from ledgers');
      }

      if (tableDesc.bank_ifsc) {
        await queryInterface.removeColumn('ledgers', 'bank_ifsc');
        console.log('✓ Removed bank_ifsc column from ledgers');
      }

      if (tableDesc.bank_branch) {
        await queryInterface.removeColumn('ledgers', 'bank_branch');
        console.log('✓ Removed bank_branch column from ledgers');
      }

      console.log('✅ Successfully removed fields from ledgers table');
    } catch (error) {
      console.error('❌ Error removing fields from ledgers table:', error.message);
      throw error;
    }
  }
};
