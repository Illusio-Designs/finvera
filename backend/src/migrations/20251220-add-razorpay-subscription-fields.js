'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to safely add column
    const addColumnIfNotExists = async (tableName, columnName, columnDefinition) => {
      try {
        const tableDescription = await queryInterface.describeTable(tableName);
        if (!tableDescription[columnName]) {
          await queryInterface.addColumn(tableName, columnName, columnDefinition);
          console.log(`✓ Added column ${columnName} to ${tableName}`);
        } else {
          console.log(`ℹ️  Column ${columnName} already exists in ${tableName}, skipping...`);
        }
      } catch (error) {
        if (error.message.includes('Duplicate column name') || error.message.includes('already exists')) {
          console.log(`ℹ️  Column ${columnName} already exists in ${tableName}, skipping...`);
        } else {
          throw error;
        }
      }
    };

    // Helper function to safely add index
    const addIndexIfNotExists = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
      } catch (error) {
        if (error.message.includes('Duplicate key name') || 
            error.message.includes('already exists') ||
            error.original?.code === 'ER_DUP_KEYNAME') {
          console.warn(`⚠️  Index already exists on ${tableName}, skipping...`);
          return;
        }
        if (error.message.includes('Too many keys') || 
            error.original?.code === 'ER_TOO_MANY_KEYS') {
          console.warn(`⚠️  Skipping index creation on ${tableName}: Too many keys (MySQL limit: 64)`);
          return;
        }
        throw error;
      }
    };

    // Add Razorpay-related fields to tenant_master table (safe - checks if exists)
    await addColumnIfNotExists('tenant_master', 'razorpay_customer_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Razorpay Customer ID',
    });

    await addColumnIfNotExists('tenant_master', 'razorpay_subscription_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Active Razorpay Subscription ID',
    });

    // Check if subscriptions table already exists
    const [subscriptionsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'subscriptions'");
    if (subscriptionsTable.length === 0) {
    // Create subscriptions table for tracking Razorpay subscriptions
    await queryInterface.createTable('subscriptions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('(UUID())'),
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenant_master',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      subscription_plan_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'subscription_plans',
          key: 'id',
        },
      },
      razorpay_subscription_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      razorpay_plan_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Razorpay Plan ID if using Razorpay Plans',
      },
      status: {
        type: Sequelize.ENUM('created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired'),
        defaultValue: 'created',
      },
      plan_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      billing_cycle: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'monthly, yearly',
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'INR',
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      current_period_start: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      current_period_end: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional metadata from Razorpay',
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
      console.log('✓ Created subscriptions table');
    } else {
      console.log('✓ subscriptions table already exists, skipping creation');
    }

    // Check if payments table already exists
    const [paymentsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'payments'");
    if (paymentsTable.length === 0) {
    // Create payments table for tracking Razorpay payments
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('(UUID())'),
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenant_master',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      subscription_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'subscriptions',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      razorpay_payment_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      razorpay_order_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      razorpay_invoice_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'INR',
      },
      status: {
        type: Sequelize.ENUM('created', 'authorized', 'captured', 'refunded', 'failed'),
        defaultValue: 'created',
      },
      method: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'card, netbanking, wallet, upi, etc.',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      notes: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional metadata from Razorpay',
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
      console.log('✓ Created payments table');
    } else {
      console.log('✓ payments table already exists, skipping creation');
    }

    // Add indexes (safe - will skip if already exist)
    await addIndexIfNotExists('subscriptions', ['tenant_id'], { name: 'idx_subscriptions_tenant_id' });
    await addIndexIfNotExists('subscriptions', ['razorpay_subscription_id'], { name: 'idx_subscriptions_razorpay_id', unique: true });
    await addIndexIfNotExists('subscriptions', ['status'], { name: 'idx_subscriptions_status' });
    await addIndexIfNotExists('payments', ['tenant_id'], { name: 'idx_payments_tenant_id' });
    await addIndexIfNotExists('payments', ['subscription_id'], { name: 'idx_payments_subscription_id' });
    await addIndexIfNotExists('payments', ['razorpay_payment_id'], { name: 'idx_payments_razorpay_id', unique: true });
    await addIndexIfNotExists('payments', ['status'], { name: 'idx_payments_status' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
    await queryInterface.dropTable('subscriptions');
    await queryInterface.removeColumn('tenant_master', 'razorpay_subscription_id');
    await queryInterface.removeColumn('tenant_master', 'razorpay_customer_id');
  },
};
