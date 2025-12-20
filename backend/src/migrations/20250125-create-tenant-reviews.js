/**
 * Migration to create tenant_reviews table in master database
 * Run this on the master database
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tenant_reviews', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Tenant who submitted the review',
        references: {
          model: 'tenant_master',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'User ID who submitted the review (optional)',
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Rating from 1 to 5 stars',
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Review title/headline',
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Review comment/feedback',
      },
      reviewer_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Name of the reviewer (can be different from tenant name)',
      },
      reviewer_designation: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Designation/role of reviewer (e.g., CEO, Finance Manager)',
      },
      reviewer_company: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Company name (if different from tenant company_name)',
      },
      is_approved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether the review is approved for public display',
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether to feature this review prominently',
      },
      helpful_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of people who found this review helpful',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes (optimized - using composite indexes where possible)
    await queryInterface.addIndex('tenant_reviews', ['tenant_id'], {
      name: 'idx_tenant_reviews_tenant_id',
    });
    // Composite index for common query patterns
    await queryInterface.addIndex('tenant_reviews', ['is_approved', 'is_featured', 'created_at'], {
      name: 'idx_tenant_reviews_approved_featured_created',
    });
    await queryInterface.addIndex('tenant_reviews', ['rating'], {
      name: 'idx_tenant_reviews_rating',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tenant_reviews');
  },
};
