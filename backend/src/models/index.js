const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const db = {};

/**
 * Main Database Models (finvera_main)
 * ONLY admin/system/platform models
 * 
 * Master DB models are in: src/models/masterModels.js
 * Tenant DB models are in: src/services/tenantModels.js
 */

// Admin/System Models ONLY - load explicitly to avoid confusion
const adminModels = [
  'User',          // Admin users
  'Salesman',      // Salesmen
  'Distributor',   // Distributors
  'SubscriptionPlan', // Subscription plans
  'ReferralCode',  // Referral codes
  'ReferralReward', // Referral rewards
  'Commission',    // Commissions
  'Payout',        // Payouts
  'Lead',          // Leads
  'LeadActivity',  // Lead activities
  'Target',        // Targets
  'Blog',          // Blog posts
  'BlogCategory',  // Blog categories
  'SEO',           // SEO settings
  'SupportTicket', // Support tickets
  'TicketMessage', // Ticket messages
  'SupportAgentReview', // Support agent reviews
  'ReferralDiscountConfig', // Referral discount configurations
  'Notification', // Notifications
  'NotificationPreference', // Notification preferences
];

// Load only admin/system models
adminModels.forEach((modelName) => {
  try {
    const modelFile = `./${modelName}.js`;
    const modelModule = require(modelFile);
    
    if (typeof modelModule === 'function') {
      const model = modelModule(sequelize, DataTypes);
      if (model && model.name) {
        db[model.name] = model;
      }
    }
  } catch (error) {
    console.error(`Error loading model ${modelName}:`, error.message);
  }
});

// Run associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

module.exports = db;
