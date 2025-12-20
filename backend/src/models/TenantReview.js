const { DataTypes } = require('sequelize');
const masterSequelize = require('../config/masterDatabase');

/**
 * Tenant Review Model
 * Stored in the master database
 * Reviews submitted by tenants about the platform
 */
const TenantReview = masterSequelize.define(
  'TenantReview',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Tenant who submitted the review',
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User ID who submitted the review (optional)',
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Review title/headline',
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Review comment/feedback',
    },
    reviewer_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Name of the reviewer (can be different from tenant name)',
    },
    reviewer_designation: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Designation/role of reviewer (e.g., CEO, Finance Manager)',
    },
    reviewer_company: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Company name (if different from tenant company_name)',
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the review is approved for public display',
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether to feature this review prominently',
    },
    helpful_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of people who found this review helpful',
    },
  },
  {
    tableName: 'tenant_reviews',
    timestamps: true,
    indexes: [
      { fields: ['tenant_id'], name: 'idx_tenant_reviews_tenant_id' },
      { fields: ['is_approved', 'is_featured', 'created_at'], name: 'idx_tenant_reviews_approved_featured_created' },
      { fields: ['rating'], name: 'idx_tenant_reviews_rating' },
    ],
  }
);

TenantReview.associate = (models) => {
  TenantReview.belongsTo(models.TenantMaster, {
    foreignKey: 'tenant_id',
    as: 'tenant',
  });
};

module.exports = TenantReview;
