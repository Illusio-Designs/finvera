
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductAttribute = sequelize.define('ProductAttribute', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'tenant_attribute_name',
      comment: 'The name of the attribute, e.g., "Color", "Size".',
    },
    tenant_id: {
      type: DataTypes.STRING, // Keep it consistent with how tenant ID is stored elsewhere
      allowNull: false,
      unique: 'tenant_attribute_name',
    },
  }, {
    tableName: 'product_attributes',
    timestamps: true,
    comment: 'Stores reusable attribute types for a tenant, like Size or Color.',
  });

  ProductAttribute.associate = (models) => {
    ProductAttribute.hasMany(models.ProductAttributeValue, {
      foreignKey: 'product_attribute_id',
      as: 'values',
      onDelete: 'CASCADE',
    });
  };

  return ProductAttribute;
};
