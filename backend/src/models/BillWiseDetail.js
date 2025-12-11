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
      bill_number: { type: DataTypes.STRING(100), allowNull: false },
      bill_date: { type: DataTypes.DATE, allowNull: false },
      bill_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
      }, // Debit, Credit
      bill_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      pending_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      due_date: DataTypes.DATE,
      overdue_days: { type: DataTypes.INTEGER, defaultValue: 0 },
      is_fully_paid: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { tableName: 'bill_wise_details', timestamps: true }
  );

  BillWiseDetail.associate = (models) => {
    BillWiseDetail.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    BillWiseDetail.belongsTo(models.Voucher, { foreignKey: 'voucher_id' });
    BillWiseDetail.belongsTo(models.Ledger, { foreignKey: 'ledger_id' });
    BillWiseDetail.hasMany(models.BillAllocation, { foreignKey: 'bill_id' });
  };

  return BillWiseDetail;
};

