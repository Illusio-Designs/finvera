module.exports = (sequelize, DataTypes) => {
  const SupportTicket = sequelize.define(
    'SupportTicket',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      ticket_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Auto-generated ticket number (e.g., TKT-2024-0001)',
      },
      tenant_id: {
        type: DataTypes.UUID,
        comment: 'Tenant who raised the ticket',
      },
      client_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      client_email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      client_phone: {
        type: DataTypes.STRING(15),
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM('technical', 'billing', 'feature_request', 'bug_report', 'general', 'other'),
        defaultValue: 'general',
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
      },
      status: {
        type: DataTypes.ENUM('open', 'assigned', 'in_progress', 'waiting_client', 'resolved', 'closed'),
        defaultValue: 'open',
      },
      assigned_to: {
        type: DataTypes.UUID,
        comment: 'Support agent assigned to this ticket',
      },
      attachments: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: 'Array of file URLs/paths',
      },
      resolved_at: {
        type: DataTypes.DATE,
      },
      closed_at: {
        type: DataTypes.DATE,
      },
      resolution_note: {
        type: DataTypes.TEXT,
        comment: 'Final resolution note by support agent',
      },
      tags: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: 'Tags for categorization',
      },
    },
    {
      tableName: 'support_tickets',
      timestamps: true,
      indexes: [
        { fields: ['ticket_number'], unique: true },
        { fields: ['status'] },
        { fields: ['assigned_to'] },
        { fields: ['tenant_id'] },
        { fields: ['priority'] },
      ],
      hooks: {
        beforeCreate: async (ticket) => {
          // Auto-generate ticket number
          if (!ticket.ticket_number) {
            const year = new Date().getFullYear();
            const count = await sequelize.models.SupportTicket.count();
            ticket.ticket_number = `TKT-${year}-${String(count + 1).padStart(4, '0')}`;
          }
        },
      },
    }
  );

  SupportTicket.associate = (models) => {
    SupportTicket.belongsTo(models.User, { 
      foreignKey: 'assigned_to', 
      as: 'assignedAgent' 
    });
    SupportTicket.hasMany(models.TicketMessage, { 
      foreignKey: 'ticket_id', 
      as: 'messages' 
    });
    SupportTicket.hasOne(models.SupportAgentReview, { 
      foreignKey: 'ticket_id', 
      as: 'review' 
    });
  };

  return SupportTicket;
};
