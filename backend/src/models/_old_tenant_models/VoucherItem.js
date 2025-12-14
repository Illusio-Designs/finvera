module.exports = (sequelize, DataTypes) => {
  const VoucherItem = sequelize.define(
    'VoucherItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      voucher_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'vouchers',
          key: 'id',
        },
      },
      item_name: DataTypes.STRING,
      hsn_sac: DataTypes.STRING(10),
      quantity: DataTypes.DECIMAL(10, 3),
      unit: DataTypes.STRING(20),
      rate: DataTypes.DECIMAL(15, 2),
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      cgst_rate: DataTypes.DECIMAL(5, 2),
      sgst_rate: DataTypes.DECIMAL(5, 2),
      igst_rate: DataTypes.DECIMAL(5, 2),
      cess_rate: DataTypes.DECIMAL(5, 2),
      cgst_amount: DataTypes.DECIMAL(15, 2),
      sgst_amount: DataTypes.DECIMAL(15, 2),
      igst_amount: DataTypes.DECIMAL(15, 2),
      cess_amount: DataTypes.DECIMAL(15, 2),
      total_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
    },
    {
      tableName: 'voucher_items',
      timestamps: true,
    }
  );

  VoucherItem.associate = (models) => {
    VoucherItem.belongsTo(models.Voucher, { foreignKey: 'voucher_id' });
  };

  return VoucherItem;
};

