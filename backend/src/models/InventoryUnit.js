/**
 * InventoryUnit Model
 * 
 * Represents individual units of serialized inventory items.
 * Each unit has a unique barcode and can be tracked individually.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InventoryUnit = sequelize.define('InventoryUnit', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    inventory_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'inventory_items',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    unit_barcode: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Unique barcode for this individual unit',
    },
    serial_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Manufacturer serial number (optional)',
    },
    imei_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'IMEI for mobile devices (optional)',
    },
    status: {
      type: DataTypes.ENUM('in_stock', 'sold', 'damaged', 'returned', 'transferred'),
      defaultValue: 'in_stock',
      allowNull: false,
    },
    warehouse_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'warehouses',
        key: 'id',
      },
    },
    purchase_voucher_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Voucher ID when this unit was purchased',
    },
    purchase_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    purchase_rate: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Purchase price of this specific unit',
    },
    sales_voucher_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Voucher ID when this unit was sold',
    },
    sales_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sales_rate: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Sales price of this specific unit',
    },
    warranty_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Warranty expiry date',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about this unit',
    },
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'inventory_units',
    timestamps: true,
    indexes: [
      { fields: ['inventory_item_id'] },
      { fields: ['status'] },
      { fields: ['warehouse_id'] },
      { fields: ['purchase_voucher_id'] },
      { fields: ['sales_voucher_id'] },
    ],
  });

  InventoryUnit.associate = (models) => {
    InventoryUnit.belongsTo(models.InventoryItem, {
      foreignKey: 'inventory_item_id',
      as: 'item',
    });
    
    InventoryUnit.belongsTo(models.Warehouse, {
      foreignKey: 'warehouse_id',
      as: 'warehouse',
    });
  };

  return InventoryUnit;
};
