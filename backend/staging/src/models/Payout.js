module.exports = (sequelize, DataTypes) => {
  const Payout = sequelize.define(
    'Payout',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      distributor_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'distributors',
          key: 'id',
        },
      },
      salesman_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'salesmen',
          key: 'id',
        },
      },
      payout_type: {
        type: DataTypes.STRING,
        allowNull: false,
      }, // distributor, salesman
      total_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
      },
      payment_method: DataTypes.STRING,
      payment_reference: DataTypes.STRING,
      paid_date: DataTypes.DATE,
      notes: DataTypes.TEXT,
    },
    {
      tableName: 'payouts',
      timestamps: true,
    }
  );

  Payout.associate = (models) => {
    Payout.belongsTo(models.Distributor, { foreignKey: 'distributor_id' });
    Payout.belongsTo(models.Salesman, { foreignKey: 'salesman_id' });
  };

  return Payout;
};

