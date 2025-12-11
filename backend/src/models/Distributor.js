module.exports = (sequelize, DataTypes) => {
  const Distributor = sequelize.define(
    'Distributor',
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
      distributor_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      company_name: DataTypes.STRING,
      territory: DataTypes.JSON,
      commission_rate: DataTypes.DECIMAL(5, 2),
      payment_terms: DataTypes.STRING,
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'distributors',
      timestamps: true,
    }
  );

  Distributor.associate = (models) => {
    Distributor.belongsTo(models.User, { foreignKey: 'user_id' });
    Distributor.hasMany(models.Salesman, { foreignKey: 'distributor_id' });
    Distributor.hasMany(models.Commission, { foreignKey: 'distributor_id' });
    Distributor.hasMany(models.Payout, { foreignKey: 'distributor_id' });
  };

  return Distributor;
};
