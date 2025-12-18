'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add inventory_item_id and warehouse_id to voucher_items table
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if inventory_item_id column exists
      const [inventoryItemIdCheck] = await queryInterface.sequelize.query(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'voucher_items' 
         AND COLUMN_NAME = 'inventory_item_id'`,
        { transaction }
      );

      if (inventoryItemIdCheck.length === 0) {
        await queryInterface.addColumn(
          'voucher_items',
          'inventory_item_id',
          {
            type: Sequelize.UUID,
            allowNull: true,
            comment: 'Reference to inventory item if selected from inventory',
          },
          { transaction }
        );
      }

      // Check if warehouse_id column exists
      const [warehouseIdCheck] = await queryInterface.sequelize.query(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'voucher_items' 
         AND COLUMN_NAME = 'warehouse_id'`,
        { transaction }
      );

      if (warehouseIdCheck.length === 0) {
        await queryInterface.addColumn(
          'voucher_items',
          'warehouse_id',
          {
            type: Sequelize.UUID,
            allowNull: true,
            comment: 'Warehouse from which stock is taken (for sales) or added to (for purchase)',
          },
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if inventory_item_id column exists before removing
      const [inventoryItemIdCheck] = await queryInterface.sequelize.query(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'voucher_items' 
         AND COLUMN_NAME = 'inventory_item_id'`,
        { transaction }
      );

      if (inventoryItemIdCheck.length > 0) {
        await queryInterface.removeColumn('voucher_items', 'inventory_item_id', { transaction });
      }

      // Check if warehouse_id column exists before removing
      const [warehouseIdCheck] = await queryInterface.sequelize.query(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'voucher_items' 
         AND COLUMN_NAME = 'warehouse_id'`,
        { transaction }
      );

      if (warehouseIdCheck.length > 0) {
        await queryInterface.removeColumn('voucher_items', 'warehouse_id', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
