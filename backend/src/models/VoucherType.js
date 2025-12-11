module.exports = (sequelize, DataTypes) => {
  const VoucherType = sequelize.define(
    'VoucherType',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      type_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      prefix: DataTypes.STRING(10),
      numbering_method: DataTypes.STRING,
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'voucher_types',
      timestamps: true,
    }
  );

  VoucherType.associate = (models) => {
    VoucherType.hasMany(models.Voucher, { foreignKey: 'voucher_type_id' });
  };

  return VoucherType;
};

