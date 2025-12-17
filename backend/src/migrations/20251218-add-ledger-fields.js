'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add missing columns to ledgers table
    const tableName = 'ledgers';
    
    // Check if columns exist before adding (to make migration idempotent)
    const tableDescription = await queryInterface.describeTable(tableName);
    
    if (!tableDescription.currency) {
      await queryInterface.addColumn(tableName, 'currency', {
        type: Sequelize.STRING(3),
        allowNull: true,
        defaultValue: 'INR',
        after: 'email',
      });
    }
    
    if (!tableDescription.opening_balance_date) {
      await queryInterface.addColumn(tableName, 'opening_balance_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        after: 'opening_balance_type',
      });
    }
    
    if (!tableDescription.description) {
      await queryInterface.addColumn(tableName, 'description', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'email',
      });
    }
    
    if (!tableDescription.additional_fields) {
      await queryInterface.addColumn(tableName, 'additional_fields', {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Stores dynamic fields based on account group type',
        after: 'description',
      });
    }

    // Add country field if it doesn't exist (for address)
    if (!tableDescription.country) {
      await queryInterface.addColumn(tableName, 'country', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'pincode',
      });
    }

    // Add bank detail fields if they don't exist
    if (!tableDescription.bank_name) {
      await queryInterface.addColumn(tableName, 'bank_name', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'email',
      });
    }

    if (!tableDescription.bank_account_number) {
      await queryInterface.addColumn(tableName, 'bank_account_number', {
        type: Sequelize.STRING(50),
        allowNull: true,
        after: 'bank_name',
      });
    }

    if (!tableDescription.bank_ifsc_code) {
      await queryInterface.addColumn(tableName, 'bank_ifsc_code', {
        type: Sequelize.STRING(11),
        allowNull: true,
        after: 'bank_account_number',
      });
    }

    if (!tableDescription.bank_branch) {
      await queryInterface.addColumn(tableName, 'bank_branch', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'bank_ifsc_code',
      });
    }

    if (!tableDescription.bank_account_type) {
      await queryInterface.addColumn(tableName, 'bank_account_type', {
        type: Sequelize.STRING(50),
        allowNull: true,
        after: 'bank_branch',
      });
    }

    // Add shipping location fields if they don't exist
    if (!tableDescription.shipping_location_name) {
      await queryInterface.addColumn(tableName, 'shipping_location_name', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'bank_account_type',
      });
    }

    if (!tableDescription.shipping_address) {
      await queryInterface.addColumn(tableName, 'shipping_address', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'shipping_location_name',
      });
    }

    if (!tableDescription.shipping_city) {
      await queryInterface.addColumn(tableName, 'shipping_city', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'shipping_address',
      });
    }

    if (!tableDescription.shipping_state) {
      await queryInterface.addColumn(tableName, 'shipping_state', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'shipping_city',
      });
    }

    if (!tableDescription.shipping_pincode) {
      await queryInterface.addColumn(tableName, 'shipping_pincode', {
        type: Sequelize.STRING(10),
        allowNull: true,
        after: 'shipping_state',
      });
    }

    if (!tableDescription.shipping_country) {
      await queryInterface.addColumn(tableName, 'shipping_country', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'shipping_pincode',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableName = 'ledgers';
    
    // Remove columns in reverse order
    const columnsToRemove = [
      'shipping_country',
      'shipping_pincode',
      'shipping_state',
      'shipping_city',
      'shipping_address',
      'shipping_location_name',
      'bank_account_type',
      'bank_branch',
      'bank_ifsc_code',
      'bank_account_number',
      'bank_name',
      'country',
      'additional_fields',
      'description',
      'opening_balance_date',
      'currency',
    ];

    for (const column of columnsToRemove) {
      try {
        await queryInterface.removeColumn(tableName, column);
      } catch (error) {
        // Ignore if column doesn't exist
        if (!error.message.includes("doesn't exist") && !error.message.includes('Unknown column')) {
          throw error;
        }
      }
    }
  },
};
