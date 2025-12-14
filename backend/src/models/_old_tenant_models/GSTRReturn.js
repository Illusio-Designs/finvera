module.exports = (sequelize, DataTypes) => {
  const GSTRReturn = sequelize.define(
    'GSTRReturn',
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
      },
      return_type: {
        type: DataTypes.STRING(10),
        allowNull: false,
      }, // GSTR1, GSTR3B, GSTR9
      return_period: {
        type: DataTypes.STRING(7),
        allowNull: false,
      }, // MM-YYYY format
      filing_status: {
        type: DataTypes.STRING(20),
        defaultValue: 'draft',
      },
      total_taxable_value: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_tax: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      json_data: DataTypes.JSON,
      json_file: DataTypes.STRING, // Path to JSON file
      filed_date: DataTypes.DATE,
      acknowledgment_number: DataTypes.STRING(50),
    },
    {
      tableName: 'gstr_returns',
      timestamps: true,
    }
  );

  GSTRReturn.associate = (models) => {
    GSTRReturn.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    // Note: gstin is stored as string, not foreign key to GSTIN table
  };

  return GSTRReturn;
};
