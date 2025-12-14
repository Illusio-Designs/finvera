module.exports = (sequelize, DataTypes) => {
  const GSTIN = sequelize.define(
    'GSTIN',
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
      gstin: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
      },
      legal_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      trade_name: DataTypes.STRING(255),
      business_name: DataTypes.STRING(255), // Alias for trade_name
      registration_type: {
        type: DataTypes.STRING(50),
        defaultValue: 'Regular',
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      state_code: {
        type: DataTypes.STRING(2),
        allowNull: false,
      },
      registration_date: DataTypes.DATE,
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      e_invoice_applicable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      e_way_bill_applicable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'gstins',
      timestamps: true,
    }
  );

  GSTIN.associate = (models) => {
    GSTIN.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    // Note: GSTRReturn uses gstin as string, not foreign key
  };

  return GSTIN;
};
