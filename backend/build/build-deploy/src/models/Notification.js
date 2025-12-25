module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'User who should receive this notification',
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Notification type (e.g., target_achieved, commission_approved)',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
        defaultValue: 'medium',
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      action_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'URL to navigate when notification is clicked',
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: 'Additional data related to the notification',
      },
      sent_email: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether email notification was sent',
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When notification was sent',
      },
    },
    {
      tableName: 'notifications',
      timestamps: true,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['is_read'] },
        { fields: ['type'] },
        { fields: ['createdAt'] },
      ],
    }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Notification;
};
