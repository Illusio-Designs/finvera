module.exports = (sequelize, DataTypes) => {
  const Ledger = sequelize.define(
    'Ledger',
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
      account_group_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'account_groups',
          key: 'id',
        },
      },
      ledger_code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ledger_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      opening_balance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      opening_balance_type: DataTypes.STRING, // Dr, Cr
      balance_type: DataTypes.STRING, // debit, credit (alias for opening_balance_type)
      gstin: DataTypes.STRING(15),
      pan: DataTypes.STRING(10),
      address: DataTypes.TEXT,
      city: DataTypes.STRING(100),
      state: DataTypes.STRING(100),
      pincode: DataTypes.STRING(10),
      phone: DataTypes.STRING(15),
      email: DataTypes.STRING(255),
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'ledgers',
      timestamps: true,
    }
  );

  Ledger.associate = (models) => {
    Ledger.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    Ledger.belongsTo(models.AccountGroup, { foreignKey: 'account_group_id', as: 'account_group' });
  };

  return Ledger;
};

