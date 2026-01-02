module.exports = (sequelize, DataTypes) => {
  const Salesman = sequelize.define(
    'Salesman',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      distributor_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'distributors',
          key: 'id',
        },
      },
      salesman_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      full_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      gstin: {
        type: DataTypes.STRING(15),
        allowNull: true,
        comment: 'GSTIN for invoicing',
      },
      territory: DataTypes.JSON,
      commission_rate: DataTypes.DECIMAL(5, 2),
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'salesmen',
      timestamps: true,
    }
  );

  Salesman.associate = (models) => {
    Salesman.belongsTo(models.User, { foreignKey: 'user_id' });
    Salesman.belongsTo(models.Distributor, { foreignKey: 'distributor_id' });
    Salesman.hasMany(models.Lead, { foreignKey: 'salesman_id' });
    Salesman.hasMany(models.Commission, { foreignKey: 'salesman_id' });
    Salesman.hasMany(models.Payout, { foreignKey: 'salesman_id' });
    Salesman.hasMany(models.Target, { foreignKey: 'salesman_id' });
  };

  return Salesman;
};
