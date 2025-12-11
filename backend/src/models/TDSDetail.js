module.exports = (sequelize, DataTypes) => {
  const TDSDetail = sequelize.define(
    'TDSDetail',
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
        allowNull: true,
        references: {
          model: 'vouchers',
          key: 'id',
        },
      },
      ledger_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'ledgers',
          key: 'id',
        },
      },
      tds_section: DataTypes.STRING(10),
      tds_rate: DataTypes.DECIMAL(5, 2),
      tds_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      tds_deducted_date: DataTypes.DATE,
      payment_date: DataTypes.DATE, // Alias for tds_deducted_date
      challan_number: DataTypes.STRING(50),
      challan_date: DataTypes.DATE,
      voucher_number: DataTypes.STRING, // For display purposes
    },
    {
      tableName: 'tds_details',
      timestamps: true,
    }
  );

  TDSDetail.associate = (models) => {
    TDSDetail.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    TDSDetail.belongsTo(models.Voucher, { foreignKey: 'voucher_id' });
    TDSDetail.belongsTo(models.Ledger, { foreignKey: 'ledger_id' });
  };

  return TDSDetail;
};
