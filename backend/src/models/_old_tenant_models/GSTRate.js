module.exports = (sequelize, DataTypes) => {
  const GSTRate = sequelize.define(
    'GSTRate',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      hsn_sac: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      description: DataTypes.TEXT,
      cgst_rate: DataTypes.DECIMAL(5, 2),
      sgst_rate: DataTypes.DECIMAL(5, 2),
      igst_rate: DataTypes.DECIMAL(5, 2),
      cess_rate: DataTypes.DECIMAL(5, 2),
      effective_from: DataTypes.DATE,
      effective_to: DataTypes.DATE,
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'gst_rates',
      timestamps: true,
    }
  );

  GSTRate.associate = (models) => {
    // No associations needed for GST rates
  };

  return GSTRate;
};
