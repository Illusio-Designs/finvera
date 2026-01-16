const { DataTypes } = require('sequelize');
const masterSequelize = require('../config/masterDatabase');

const Subscription = masterSequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tenant_master',
      key: 'id',
    },
  },
  subscription_plan_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'subscription_plans',
      key: 'id',
    },
  },
  razorpay_subscription_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    // Removed unique: true to avoid MySQL 64-index limit
    // Uniqueness should be enforced at application level
  },
  razorpay_plan_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired'),
    defaultValue: 'created',
  },
  plan_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  plan_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  plan_type: {
    type: DataTypes.ENUM('multi-company', 'multi-branch'),
    defaultValue: 'multi-company',
    comment: 'Consumer selected plan type: multi-company or multi-branch',
  },
  billing_cycle: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  base_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  discounted_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR',
  },
  trial_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  max_users: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  max_invoices_per_month: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  max_companies: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  max_branches: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Maximum branches allowed for this subscription',
  },
  storage_limit_gb: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  features: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  salesman_commission_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  distributor_commission_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  renewal_commission_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  is_visible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  display_order: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  valid_from: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  valid_until: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  current_period_start: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  current_period_end: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'subscriptions',
  timestamps: true,
});

module.exports = Subscription;
