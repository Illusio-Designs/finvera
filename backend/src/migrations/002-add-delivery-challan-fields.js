/**
 * Migration: Add Delivery Challan fields to vouchers table
 * 
 * This migration adds:
 * - purpose: enum field for delivery challan purpose (job_work, stock_transfer, sample)
 * - converted_to_invoice_id: UUID field for tracking conversions to sales invoices
 * 
 * Requirements: 8.1, 8.3, 8.4
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add purpose field for Delivery Challan
      await queryInterface.addColumn(
        'vouchers',
        'purpose',
        {
          type: Sequelize.ENUM('job_work', 'stock_transfer', 'sample'),
          allowNull: true,
          comment: 'Purpose of delivery challan (job_work, stock_transfer, sample)',
        },
        { transaction }
      );
      
      // Add converted_to_invoice_id field for tracking conversions
      await queryInterface.addColumn(
        'vouchers',
        'converted_to_invoice_id',
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'vouchers',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          comment: 'Reference to sales invoice if this voucher was converted',
        },
        { transaction }
      );
      
      // Add index on converted_to_invoice_id for efficient lookups
      await queryInterface.addIndex(
        'vouchers',
        ['converted_to_invoice_id'],
        {
          name: 'idx_vouchers_converted_to_invoice_id',
          transaction,
        }
      );
      
      // Add index on purpose for filtering delivery challans
      await queryInterface.addIndex(
        'vouchers',
        ['purpose'],
        {
          name: 'idx_vouchers_purpose',
          transaction,
        }
      );
      
      await transaction.commit();
      console.log('✅ Successfully added Delivery Challan fields to vouchers table');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error adding Delivery Challan fields:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove indexes
      await queryInterface.removeIndex(
        'vouchers',
        'idx_vouchers_purpose',
        { transaction }
      );
      
      await queryInterface.removeIndex(
        'vouchers',
        'idx_vouchers_converted_to_invoice_id',
        { transaction }
      );
      
      // Remove columns
      await queryInterface.removeColumn('vouchers', 'converted_to_invoice_id', { transaction });
      await queryInterface.removeColumn('vouchers', 'purpose', { transaction });
      
      // Drop the ENUM type
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_vouchers_purpose";',
        { transaction }
      );
      
      await transaction.commit();
      console.log('✅ Successfully removed Delivery Challan fields from vouchers table');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing Delivery Challan fields:', error);
      throw error;
    }
  },
};
