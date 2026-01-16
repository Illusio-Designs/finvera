
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductAttributeValue = sequelize.define('ProductAttributeValue', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The actual value, e.g., "Red", "Medium", "Cotton".',
    },
    product_attribute_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'product_attributes',
        key: 'id',
      },
      unique: 'attribute_value_unique', // Ensures a value is unique per attribute
    },
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'attribute_value_unique',
    },
  }, {
    tableName: 'product_attribute_values',
    timestamps: true,
    comment: 'Stores the possible values for a given product attribute.',
  });

  ProductAttributeValue.associate = (models) => {
    ProductAttributeValue.belongsTo(models.ProductAttribute, {
      foreignKey: 'product_attribute_id',
      as: 'attribute',
    });
  };

  return ProductAttributeValue;
};
