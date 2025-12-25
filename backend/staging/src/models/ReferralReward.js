module.exports = (sequelize, DataTypes) => {
  const ReferralReward = sequelize.define(
    'ReferralReward',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      referrer_type: DataTypes.STRING,
      referrer_id: { type: DataTypes.UUID, allowNull: false },
      referee_tenant_id: DataTypes.UUID,
      referral_code_id: DataTypes.UUID,
      reward_type: DataTypes.STRING,
      reward_amount: DataTypes.DECIMAL(15, 2),
      reward_status: DataTypes.STRING,
      subscription_plan: DataTypes.STRING,
      reward_date: DataTypes.DATE,
      payment_date: DataTypes.DATE,
      notes: DataTypes.TEXT,
    },
    { tableName: 'referral_rewards', timestamps: true },
  );

  ReferralReward.associate = (models) => {
    ReferralReward.belongsTo(models.ReferralCode, { foreignKey: 'referral_code_id' });
  };

  return ReferralReward;
};


