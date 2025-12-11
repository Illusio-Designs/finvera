module.exports = (sequelize, DataTypes) => {
  const ReferralCode = sequelize.define(
    'ReferralCode',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: { type: DataTypes.STRING, unique: true, allowNull: false },
      owner_type: DataTypes.STRING,
      owner_id: { type: DataTypes.UUID, allowNull: false },
      discount_type: DataTypes.STRING,
      discount_value: DataTypes.DECIMAL(10, 2),
      free_trial_days: DataTypes.INTEGER,
      max_uses: DataTypes.INTEGER,
      current_uses: { type: DataTypes.INTEGER, defaultValue: 0 },
      valid_from: DataTypes.DATE,
      valid_until: DataTypes.DATE,
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: 'referral_codes', timestamps: true },
  );

  ReferralCode.associate = (models) => {
    ReferralCode.hasMany(models.ReferralReward, { foreignKey: 'referral_code_id' });
  };

  return ReferralCode;
};


