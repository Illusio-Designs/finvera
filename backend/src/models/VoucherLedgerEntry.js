module.exports = (sequelize, DataTypes) => {
  const VoucherLedgerEntry = sequelize.define(
    'VoucherLedgerEntry',
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
      voucher_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'vouchers',
          key: 'id',
        },
      },
      ledger_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'ledgers',
          key: 'id',
        },
      },
      debit_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      credit_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
    },
    {
      tableName: 'voucher_ledger_entries',
      timestamps: true,
    }
  );

  VoucherLedgerEntry.associate = (models) => {
    VoucherLedgerEntry.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    VoucherLedgerEntry.belongsTo(models.Voucher, { foreignKey: 'voucher_id' });
    VoucherLedgerEntry.belongsTo(models.Ledger, { foreignKey: 'ledger_id' });
  };

  return VoucherLedgerEntry;
};

