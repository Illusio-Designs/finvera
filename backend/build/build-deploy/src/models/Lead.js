module.exports = (sequelize, DataTypes) => {
  const Lead = sequelize.define(
    'Lead',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      salesman_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'salesmen',
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
      company_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contact_person: DataTypes.STRING,
      email: DataTypes.STRING,
      phone: DataTypes.STRING(15),
      status: {
        type: DataTypes.STRING,
        defaultValue: 'new',
      },
      source: DataTypes.STRING,
      notes: DataTypes.TEXT,
    },
    {
      tableName: 'leads',
      timestamps: true,
    }
  );

  Lead.associate = (models) => {
    Lead.belongsTo(models.Salesman, { foreignKey: 'salesman_id' });
    Lead.belongsTo(models.Distributor, { foreignKey: 'distributor_id' });
    Lead.hasMany(models.LeadActivity, { foreignKey: 'lead_id' });
  };

  return Lead;
};

