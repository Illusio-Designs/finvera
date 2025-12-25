module.exports = (sequelize, DataTypes) => {
  const LeadActivity = sequelize.define(
    'LeadActivity',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      lead_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'leads',
          key: 'id',
        },
      },
      activity_type: DataTypes.STRING,
      description: DataTypes.TEXT,
      activity_date: DataTypes.DATE,
    },
    {
      tableName: 'lead_activities',
      timestamps: true,
    }
  );

  LeadActivity.associate = (models) => {
    LeadActivity.belongsTo(models.Lead, { foreignKey: 'lead_id' });
  };

  return LeadActivity;
};

