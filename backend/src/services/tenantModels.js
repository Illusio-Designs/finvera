const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const models = {};

  models.User = sequelize.define('User', { /* ... existing User definition ... */ });

  models.Ledger = sequelize.define('Ledger', { /* ... existing Ledger definition ... */ });

  models.GSTIN = sequelize.define('GSTIN', { /* ... existing GSTIN definition ... */ });

  models.Voucher = sequelize.define('Voucher', { /* ... existing Voucher definition ... */ });

  models.VoucherItem = sequelize.define('VoucherItem', { /* ... existing VoucherItem definition ... */ });

  models.VoucherLedgerEntry = sequelize.define('VoucherLedgerEntry', { /* ... existing VoucherLedgerEntry definition ... */ });

  models.InventoryItem = sequelize.define('InventoryItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    item_key: {
      type: DataTypes.STRING(300),
      allowNull: false,
      unique: true,
      comment: 'Stable key (item_code if present else item_description)',
    },
    item_code: DataTypes.STRING(100),
    item_name: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    barcode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      comment: 'Product barcode (EAN-13, UPC, etc.)',
    },
    parent_item_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'inventory_items',
        key: 'id',
      },
      comment: 'FK to self for product variants. NULL indicates a parent/template product.',
    },
    attributes: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON object for variant attributes, e.g. {"Size": "M", "Color": "Blue"}',
    },
    hsn_sac_code: DataTypes.STRING(20),
    uqc: DataTypes.STRING(20),
    gst_rate: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    quantity_on_hand: {
      type: DataTypes.DECIMAL(15, 3),
      defaultValue: 0,
    },
    avg_cost: {
      type: DataTypes.DECIMAL(15, 4),
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'inventory_items',
    timestamps: true,
  });

  models.StockMovement = sequelize.define('StockMovement', { /* ... existing StockMovement definition ... */ });

  models.Warehouse = sequelize.define('Warehouse', { /* ... existing Warehouse definition ... */ });

  models.WarehouseStock = sequelize.define('WarehouseStock', { /* ... existing WarehouseStock definition ... */ });

  models.EWayBill = sequelize.define('EWayBill', { /* ... existing EWayBill definition ... */ });

  models.BillWiseDetail = sequelize.define('BillWiseDetail', { /* ... existing BillWiseDetail definition ... */ });

  models.BillAllocation = sequelize.define('BillAllocation', { /* ... existing BillAllocation definition ... */ });

  models.GSTRReturn = sequelize.define('GSTRReturn', { /* ... existing GSTRReturn definition ... */ });

  models.TDSDetail = sequelize.define('TDSDetail', { /* ... existing TDSDetail definition ... */ });

  models.EInvoice = sequelize.define('EInvoice', { /* ... existing EInvoice definition ... */ });

  models.AuditLog = sequelize.define('AuditLog', { /* ... existing AuditLog definition ... */ });

  models.FinBoxConsent = sequelize.define('FinBoxConsent', { /* ... existing FinBoxConsent definition ... */ });

  // NEW: Product Attribute models
  models.ProductAttribute = require('../models/ProductAttribute')(sequelize);
  models.ProductAttributeValue = require('../models/ProductAttributeValue')(sequelize);

  // Define associations
  // ... existing associations ...

  // NEW: Inventory Item self-referencing for variants
  models.InventoryItem.belongsTo(models.InventoryItem, { as: 'ParentItem', foreignKey: 'parent_item_id' });
  models.InventoryItem.hasMany(models.InventoryItem, { as: 'Variants', foreignKey: 'parent_item_id' });

  // NEW: Product Attribute Associations
  models.ProductAttribute.hasMany(models.ProductAttributeValue, { foreignKey: 'product_attribute_id', as: 'values', onDelete: 'CASCADE' });
  models.ProductAttributeValue.belongsTo(models.ProductAttribute, { foreignKey: 'product_attribute_id', as: 'attribute' });

  models.FinBoxConsent.belongsTo(models.User, { foreignKey: 'user_id' });

  return models;
};