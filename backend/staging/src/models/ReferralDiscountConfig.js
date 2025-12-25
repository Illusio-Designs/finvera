module.exports = (sequelize, DataTypes) => {
  const ReferralDiscountConfig = sequelize.define(
    'ReferralDiscountConfig',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      discount_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 10.00,
        comment: 'Discount percentage for referral code users',
      },
      effective_from: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Date from which this discount percentage is effective',
      },
      effective_until: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date until which this discount percentage is effective (null = indefinite)',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'referral_discount_configs',
      timestamps: true,
    }
  );

  return ReferralDiscountConfig;
};
