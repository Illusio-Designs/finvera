module.exports = (sequelize, DataTypes) => {
  const Commission = sequelize.define(
    'Commission',
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
      distributor_id: DataTypes.UUID,
      salesman_id: DataTypes.UUID,
      commission_type: DataTypes.STRING, // subscription, renewal, referral
      subscription_plan: DataTypes.STRING,
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      commission_rate: DataTypes.DECIMAL(5, 2),
      status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
      },
      payout_id: DataTypes.UUID,
      commission_date: DataTypes.DATE,
      notes: DataTypes.TEXT,
    },
    {
      tableName: 'commissions',
      timestamps: true,
    }
  );

  Commission.associate = (models) => {
    Commission.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    Commission.belongsTo(models.Distributor, { foreignKey: 'distributor_id' });
    Commission.belongsTo(models.Salesman, { foreignKey: 'salesman_id' });
  };

  return Commission;
};

