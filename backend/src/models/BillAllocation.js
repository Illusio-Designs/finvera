module.exports = (sequelize, DataTypes) => {
  const BillAllocation = sequelize.define(
    'BillAllocation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenant_id: { type: DataTypes.UUID, allowNull: false },
      payment_voucher_id: { type: DataTypes.UUID, allowNull: false },
      bill_id: { type: DataTypes.UUID, allowNull: false },
      allocated_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    },
    { tableName: 'bill_allocations', timestamps: true }
  );

  BillAllocation.associate = (models) => {
    BillAllocation.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    BillAllocation.belongsTo(models.Voucher, { foreignKey: 'payment_voucher_id', as: 'paymentVoucher' });
    BillAllocation.belongsTo(models.BillWiseDetail, { foreignKey: 'bill_id', as: 'bill' });
  };

  return BillAllocation;
};

