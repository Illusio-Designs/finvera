module.exports = (sequelize, DataTypes) => {
  const TicketMessage = sequelize.define(
    'TicketMessage',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      ticket_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      sender_type: {
        type: DataTypes.ENUM('client', 'agent', 'system'),
        allowNull: false,
      },
      sender_id: {
        type: DataTypes.UUID,
        comment: 'User ID if sender is agent, null if client',
      },
      sender_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      attachments: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: 'Array of file URLs/paths',
      },
      is_internal: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Internal notes not visible to client',
      },
    },
    {
      tableName: 'ticket_messages',
      timestamps: true,
      indexes: [
        { fields: ['ticket_id'] },
        { fields: ['sender_type'] },
      ],
    }
  );

  TicketMessage.associate = (models) => {
    TicketMessage.belongsTo(models.SupportTicket, { 
      foreignKey: 'ticket_id', 
      as: 'ticket' 
    });
    TicketMessage.belongsTo(models.User, { 
      foreignKey: 'sender_id', 
      as: 'sender' 
    });
  };

  return TicketMessage;
};
