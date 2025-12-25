const { DataTypes } = require('sequelize');
const masterSequelize = require('../config/masterDatabase');

const Payment = masterSequelize.define('Payment', {
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
  subscription_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'subscriptions',
      key: 'id',
    },
  },
  razorpay_payment_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  razorpay_order_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  razorpay_invoice_id: {
    type: DataTypes.STRING(255),
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
  status: {
    type: DataTypes.ENUM('created', 'authorized', 'captured', 'refunded', 'failed'),
    defaultValue: 'created',
  },
  method: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'payments',
  timestamps: true,
});

module.exports = Payment;
