'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create warehouses table
    await queryInterface.createTable('warehouses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      warehouse_code: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },
      warehouse_name: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      pincode: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      contact_person: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      contact_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      contact_email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create warehouse_stocks table
    await queryInterface.createTable('warehouse_stocks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      inventory_item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'inventory_items',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      warehouse_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'warehouses',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      quantity: {
        type: Sequelize.DECIMAL(15, 3),
        defaultValue: 0,
        allowNull: false,
      },
      avg_cost: {
        type: Sequelize.DECIMAL(15, 4),
        defaultValue: 0,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add unique index for inventory_item_id + warehouse_id
    await queryInterface.addIndex('warehouse_stocks', ['inventory_item_id', 'warehouse_id'], {
      unique: true,
      name: 'warehouse_stocks_item_warehouse_unique',
    });

    // Add warehouse_id to stock_movements table
    const stockMovementsTableDescription = await queryInterface.describeTable('stock_movements');
    if (!stockMovementsTableDescription.warehouse_id) {
      await queryInterface.addColumn('stock_movements', 'warehouse_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'warehouses',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'Warehouse for this movement (null = aggregate/all warehouses)',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove warehouse_id from stock_movements
    const stockMovementsTableDescription = await queryInterface.describeTable('stock_movements');
    if (stockMovementsTableDescription.warehouse_id) {
      await queryInterface.removeColumn('stock_movements', 'warehouse_id');
    }

    // Drop warehouse_stocks table
    await queryInterface.dropTable('warehouse_stocks');

    // Drop warehouses table
    await queryInterface.dropTable('warehouses');
  },
};
