module.exports = (sequelize, DataTypes) => {
  const Voucher = sequelize.define(
    'Voucher',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id',
        },
      },
      voucher_type_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'voucher_types',
          key: 'id',
        },
      },
      voucher_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      voucher_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      reference_number: DataTypes.STRING,
      narration: DataTypes.TEXT,
      total_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'draft',
      },
      posted_at: DataTypes.DATE,
      posted_by: DataTypes.UUID,
    },
    {
      tableName: 'vouchers',
      timestamps: true,
    }
  );

  Voucher.associate = (models) => {
    Voucher.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    Voucher.belongsTo(models.VoucherType, { foreignKey: 'voucher_type_id', as: 'voucherType' });
    Voucher.hasMany(models.VoucherItem, { foreignKey: 'voucher_id' });
    Voucher.hasMany(models.VoucherLedgerEntry, { foreignKey: 'voucher_id' });
    Voucher.hasMany(models.BillWiseDetail, { foreignKey: 'voucher_id' });
    Voucher.hasMany(models.EInvoice, { foreignKey: 'voucher_id' });
    Voucher.hasMany(models.TDSDetail, { foreignKey: 'voucher_id' });
  };

  return Voucher;
};

