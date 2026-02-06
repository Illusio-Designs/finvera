/**
 * Migration: Add Proforma Invoice fields to vouchers table
 * 
 * This migration adds:
 * - validity_period: Number of days the proforma invoice is valid
 * - valid_until: Calculated date when the proforma invoice expires
 * 
 * Requirements: 9.1, 9.2, 9.5, 9.8
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add validity_period field for Proforma Invoice
      await queryInterface.addColumn(
        'vouchers',
        'validity_period',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Number of days the proforma invoice is valid (e.g., 30, 60, 90 days)',
        },
        { transaction }
      );
      
      // Add valid_until field for Proforma Invoice
      await queryInterface.addColumn(
        'vouchers',
        'valid_until',
        {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Calculated date when the proforma invoice expires (voucher_date + validity_period)',
        },
        { transaction }
      );
      
      // Add index on valid_until for efficient filtering of expired proforma invoices
      await queryInterface.addIndex(
        'vouchers',
        ['valid_until'],
        {
          name: 'idx_vouchers_valid_until',
          transaction,
        }
      );
      
      await transaction.commit();
      console.log('✅ Successfully added Proforma Invoice fields to vouchers table');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error adding Proforma Invoice fields:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove index
      await queryInterface.removeIndex(
        'vouchers',
        'idx_vouchers_valid_until',
        { transaction }
      );
      
      // Remove columns
      await queryInterface.removeColumn('vouchers', 'valid_until', { transaction });
      await queryInterface.removeColumn('vouchers', 'validity_period', { transaction });
      
      await transaction.commit();
      console.log('✅ Successfully removed Proforma Invoice fields from vouchers table');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing Proforma Invoice fields:', error);
      throw error;
    }
  }
};
