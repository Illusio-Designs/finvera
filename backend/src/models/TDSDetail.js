module.exports = (sequelize, DataTypes) => {
  const TDSDetail = sequelize.define(
    'TDSDetail',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenant_id: { type: DataTypes.UUID, allowNull: false },
      voucher_id: { type: DataTypes.UUID, allowNull: false },
      ledger_id: { type: DataTypes.UUID, allowNull: false },
      tds_section: { type: DataTypes.STRING(20), allowNull: false }, // 194C, 194J, etc.
      tds_rate: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      gross_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      tds_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      net_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      payment_date: { type: DataTypes.DATE, allowNull: false },
      quarter: { type: DataTypes.STRING(10), allowNull: false }, // Q1-2024, Q2-2024, etc.
      financial_year: { type: DataTypes.STRING(9), allowNull: false }, // 2024-2025
      pan_of_deductee: DataTypes.STRING(10),
      certificate_issued: { type: DataTypes.BOOLEAN, defaultValue: false },
      certificate_number: DataTypes.STRING(50),
    },
    { tableName: 'tds_details', timestamps: true }
  );

  TDSDetail.associate = (models) => {
    TDSDetail.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    TDSDetail.belongsTo(models.Voucher, { foreignKey: 'voucher_id' });
    TDSDetail.belongsTo(models.Ledger, { foreignKey: 'ledger_id' });
  };

  return TDSDetail;
};

