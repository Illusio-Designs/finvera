module.exports = (sequelize, DataTypes) => {
  const BillWiseDetail = sequelize.define(
    'BillWiseDetail',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenant_id: { type: DataTypes.UUID, allowNull: false },
      voucher_id: { type: DataTypes.UUID, allowNull: false },
      ledger_id: { type: DataTypes.UUID, allowNull: false },
      bill_number: DataTypes.STRING(100),
      bill_date: DataTypes.DATE,
      bill_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      due_date: DataTypes.DATE,
      status: {
        type: DataTypes.STRING,
        defaultValue: 'open',
      },
    },
    { tableName: 'bill_wise_details', timestamps: true }
  );

  BillWiseDetail.associate = (models) => {
    BillWiseDetail.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    BillWiseDetail.belongsTo(models.Voucher, { foreignKey: 'voucher_id' });
    BillWiseDetail.belongsTo(models.Ledger, { foreignKey: 'ledger_id' });
    BillWiseDetail.hasMany(models.BillAllocation, { foreignKey: 'bill_wise_detail_id' });
  };

  return BillWiseDetail;
};

