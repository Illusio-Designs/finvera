module.exports = (sequelize, DataTypes) => {
  const GSTRate = sequelize.define(
    'GSTRate',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenant_id: { type: DataTypes.UUID, allowNull: true }, // null for master data
      hsn_sac_code: { type: DataTypes.STRING(8), allowNull: false },
      description: DataTypes.STRING(255),
      gst_rate: { type: DataTypes.DECIMAL(5, 2), allowNull: false }, // 0, 0.25, 3, 5, 12, 18, 28
      cess_rate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
      item_type: {
        type: DataTypes.STRING(20),
        defaultValue: 'goods',
      }, // goods, services
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      effective_from: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      effective_to: DataTypes.DATE,
    },
    { tableName: 'gst_rates', timestamps: true }
  );

  GSTRate.associate = (models) => {
    GSTRate.belongsTo(models.Tenant, { foreignKey: 'tenant_id', required: false });
  };

  return GSTRate;
};

