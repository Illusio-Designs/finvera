module.exports = (sequelize, DataTypes) => {
  const SupportAgentReview = sequelize.define(
    'SupportAgentReview',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      ticket_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        comment: 'One review per ticket',
      },
      agent_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Support agent being reviewed',
      },
      tenant_id: {
        type: DataTypes.UUID,
        comment: 'Tenant who gave the review',
      },
      client_name: {
        type: DataTypes.STRING(100),
      },
      client_email: {
        type: DataTypes.STRING(255),
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
        comment: 'Rating from 1 to 5 stars',
      },
      comment: {
        type: DataTypes.TEXT,
        comment: 'Review comment',
      },
      resolution_speed: {
        type: DataTypes.ENUM('very_slow', 'slow', 'average', 'fast', 'very_fast'),
        comment: 'How quickly was the issue resolved',
      },
      communication: {
        type: DataTypes.INTEGER,
        validate: {
          min: 1,
          max: 5,
        },
        comment: 'Communication quality rating',
      },
      knowledge: {
        type: DataTypes.INTEGER,
        validate: {
          min: 1,
          max: 5,
        },
        comment: 'Technical knowledge rating',
      },
      friendliness: {
        type: DataTypes.INTEGER,
        validate: {
          min: 1,
          max: 5,
        },
        comment: 'Friendliness rating',
      },
      would_recommend: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'support_agent_reviews',
      timestamps: true,
      indexes: [
        { fields: ['ticket_id'], unique: true },
        { fields: ['agent_id'] },
        { fields: ['rating'] },
      ],
    }
  );

  SupportAgentReview.associate = (models) => {
    SupportAgentReview.belongsTo(models.SupportTicket, { 
      foreignKey: 'ticket_id', 
      as: 'ticket' 
    });
    SupportAgentReview.belongsTo(models.User, { 
      foreignKey: 'agent_id', 
      as: 'agent' 
    });
  };

  return SupportAgentReview;
};
