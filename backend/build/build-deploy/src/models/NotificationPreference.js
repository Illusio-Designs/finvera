module.exports = (sequelize, DataTypes) => {
  const NotificationPreference = sequelize.define(
    'NotificationPreference',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        comment: 'User ID for preferences',
      },
      in_app_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Enable in-app notifications',
      },
      email_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Enable email notifications',
      },
      desktop_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Enable desktop notifications',
      },
      sound_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Enable sound notifications',
      },
      type_preferences: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: 'Type-specific preferences { type: { in_app: bool, email: bool, desktop: bool, sound: bool } }',
      },
    },
    {
      tableName: 'notification_preferences',
      timestamps: true,
      indexes: [{ fields: ['user_id'], unique: true }],
    }
  );

  NotificationPreference.associate = (models) => {
    NotificationPreference.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return NotificationPreference;
};
