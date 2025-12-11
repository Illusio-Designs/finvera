module.exports = (sequelize, DataTypes) => {
  const BillAllocation = sequelize.define(
    'BillAllocation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      bill_wise_detail_id: { type: DataTypes.UUID, allowNull: false },
      voucher_id: { type: DataTypes.UUID, allowNull: false },
      allocated_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      allocation_date: DataTypes.DATE,
    },
    { tableName: 'bill_allocations', timestamps: true }
  );

  BillAllocation.associate = (models) => {
    BillAllocation.belongsTo(models.BillWiseDetail, { foreignKey: 'bill_wise_detail_id', as: 'billWiseDetail' });
    BillAllocation.belongsTo(models.Voucher, { foreignKey: 'voucher_id', as: 'voucher' });
  };

  return BillAllocation;
};

