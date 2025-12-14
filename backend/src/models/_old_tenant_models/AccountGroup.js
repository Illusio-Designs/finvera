module.exports = (sequelize, DataTypes) => {
  const AccountGroup = sequelize.define(
    'AccountGroup',
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
      group_code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      group_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      parent_id: DataTypes.UUID,
      group_type: DataTypes.STRING, // Assets, Liabilities, Income, Expenses
      schedule_iii_category: DataTypes.STRING,
      is_system: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'account_groups',
      timestamps: true,
    }
  );

  AccountGroup.associate = (models) => {
    AccountGroup.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    AccountGroup.belongsTo(models.AccountGroup, { foreignKey: 'parent_id', as: 'parent' });
    AccountGroup.hasMany(models.AccountGroup, { foreignKey: 'parent_id', as: 'children' });
    AccountGroup.hasMany(models.Ledger, { foreignKey: 'account_group_id' });
  };

  return AccountGroup;
};

