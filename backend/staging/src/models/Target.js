module.exports = (sequelize, DataTypes) => {
  const Target = sequelize.define(
    'Target',
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
      target_type: DataTypes.STRING, // subscription, revenue
      target_period: DataTypes.STRING, // monthly, quarterly, yearly
      target_value: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      achieved_value: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      start_date: DataTypes.DATE,
      end_date: DataTypes.DATE,
    },
    {
      tableName: 'targets',
      timestamps: true,
    }
  );

  Target.associate = (models) => {
    Target.belongsTo(models.Distributor, { foreignKey: 'distributor_id' });
    Target.belongsTo(models.Salesman, { foreignKey: 'salesman_id' });
  };

  return Target;
};

