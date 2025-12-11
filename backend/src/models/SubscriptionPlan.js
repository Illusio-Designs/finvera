module.exports = (sequelize, DataTypes) => {
  const SubscriptionPlan = sequelize.define(
    'SubscriptionPlan',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      plan_code: { type: DataTypes.STRING, unique: true, allowNull: false },
      plan_name: { type: DataTypes.STRING, allowNull: false },
      description: DataTypes.TEXT,
      billing_cycle: DataTypes.STRING,
      base_price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      discounted_price: DataTypes.DECIMAL(15, 2),
      currency: { type: DataTypes.STRING(3), defaultValue: 'INR' },
      trial_days: { type: DataTypes.INTEGER, defaultValue: 0 },
      max_users: DataTypes.INTEGER,
      max_invoices_per_month: DataTypes.INTEGER,
      max_companies: { type: DataTypes.INTEGER, defaultValue: 1 },
      storage_limit_gb: DataTypes.INTEGER,
      features: DataTypes.JSON,
      salesman_commission_rate: DataTypes.DECIMAL(5, 2),
      distributor_commission_rate: DataTypes.DECIMAL(5, 2),
      renewal_commission_rate: DataTypes.DECIMAL(5, 2),
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      is_visible: { type: DataTypes.BOOLEAN, defaultValue: true },
      is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
      display_order: DataTypes.INTEGER,
      valid_from: DataTypes.DATE,
      valid_until: DataTypes.DATE,
    },
    { tableName: 'subscription_plans', timestamps: true },
  );

  return SubscriptionPlan;
};


