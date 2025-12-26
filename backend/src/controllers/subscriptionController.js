const razorpayService = require('../services/razorpayService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

module.exports = {
  /**
   * Create a subscription order for a tenant
   */
  async createSubscription(req, res, next) {
    try {
      const tenant_id = req.tenant_id || req.user?.tenant_id;
      const { plan_id, billing_cycle, referral_code } = req.body;

      if (!plan_id || !billing_cycle) {
        return res.status(400).json({ message: 'plan_id and billing_cycle are required' });
      }

      const masterModels = req.masterModels || require('../models/masterModels');
      const tenant = await masterModels.TenantMaster.findByPk(tenant_id);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Get subscription plan details
      const db = require('../models');
      const plan = await db.SubscriptionPlan.findByPk(plan_id);
      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }

      let basePrice = parseFloat(plan.base_price || 0);
      let amount = basePrice;
      
      // Calculate base amount based on billing cycle
      if (billing_cycle === 'yearly' && plan.discounted_price) {
        // Use discounted price for yearly
        basePrice = parseFloat(plan.discounted_price * 12); // Assuming monthly price
        amount = basePrice;
      } else if (billing_cycle === 'yearly') {
        // If no discounted price, calculate yearly as 12x monthly
        basePrice = parseFloat(plan.base_price * 12);
        amount = basePrice;
      }

      // Apply referral code discount if provided
      let discountApplied = false;
      if (referral_code) {
        try {
          const referralDiscountService = require('../services/referralDiscountService');
          const discountResult = await referralDiscountService.applyReferralDiscount(
            referral_code,
            basePrice
          );
          
          if (discountResult.discountAmount > 0) {
            amount = discountResult.discountedPrice;
            discountApplied = true;
            logger.info(`Referral discount applied to subscription: ${discountResult.discountPercentage}% (${discountResult.discountAmount})`);
          }
        } catch (error) {
          logger.warn('Failed to apply referral discount to subscription:', error.message);
          // Continue with subscription creation even if discount fails
        }
      }

      // Create or get Razorpay customer
      let razorpayCustomerId = tenant.razorpay_customer_id;
      if (!razorpayCustomerId) {
        const customer = await razorpayService.createCustomer({
          name: tenant.company_name,
          email: tenant.email,
          contact: tenant.phone,
          notes: {
            tenant_id: tenant_id,
          },
        });
        razorpayCustomerId = customer.id;

        // Update tenant with customer ID
        await tenant.update({ razorpay_customer_id: razorpayCustomerId });
      }

      // Create Razorpay plan if needed (for recurring subscriptions)
      // For now, we'll create an order for one-time payment or subscription
      let razorpayPlanId = null;
      if (billing_cycle !== 'one_time') {
        // Create a Razorpay plan for recurring subscriptions
        const razorpayPlan = await razorpayService.createPlan({
          name: `${plan.plan_name} - ${billing_cycle}`,
          amount: amount,
          currency: plan.currency || 'INR',
          description: plan.description,
          billing_cycle: billing_cycle,
          notes: {
            plan_id: plan_id,
            tenant_id: tenant_id,
          },
        });
        razorpayPlanId = razorpayPlan.id;

        // Create Razorpay subscription
        const razorpaySubscription = await razorpayService.createSubscription({
          plan_id: razorpayPlanId,
          customer_notify: true,
          total_count: billing_cycle === 'yearly' ? 12 : 1, // For monthly, charge immediately
          notes: {
            tenant_id: tenant_id,
            plan_code: plan.plan_code,
          },
        });

        // Check if subscription with this razorpay_subscription_id already exists (application-level uniqueness)
        const existingSubscription = await masterModels.Subscription.findOne({
          where: { razorpay_subscription_id: razorpaySubscription.id },
        });
        if (existingSubscription) {
          logger.warn(`Subscription with razorpay_subscription_id ${razorpaySubscription.id} already exists`);
          return res.status(409).json({ message: 'Subscription already exists for this Razorpay subscription' });
        }

        // Calculate dates
        const startDate = new Date();
        let endDate = null;
        let currentPeriodEnd = null;
        if (billing_cycle === 'monthly') {
          endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 1);
          currentPeriodEnd = endDate;
        } else if (billing_cycle === 'yearly') {
          endDate = new Date(startDate);
          endDate.setFullYear(endDate.getFullYear() + 1);
          currentPeriodEnd = new Date(startDate);
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        }

        // Save subscription to database
        const subscription = await masterModels.Subscription.create({
          tenant_id: tenant_id,
          subscription_plan_id: plan_id,
          razorpay_subscription_id: razorpaySubscription.id,
          razorpay_plan_id: razorpayPlanId,
          status: razorpaySubscription.status,
          plan_code: plan.plan_code,
          plan_name: plan.plan_name,
          description: plan.description,
          billing_cycle: billing_cycle,
          base_price: plan.base_price,
          discounted_price: plan.discounted_price,
          amount: amount,
          currency: plan.currency || 'INR',
          trial_days: plan.trial_days || 0,
          max_users: plan.max_users,
          max_invoices_per_month: plan.max_invoices_per_month,
          max_companies: plan.max_companies || 1,
          storage_limit_gb: plan.storage_limit_gb,
          features: plan.features,
          salesman_commission_rate: plan.salesman_commission_rate,
          distributor_commission_rate: plan.distributor_commission_rate,
          renewal_commission_rate: plan.renewal_commission_rate,
          is_active: plan.is_active !== undefined ? plan.is_active : true,
          is_visible: plan.is_visible !== undefined ? plan.is_visible : true,
          is_featured: plan.is_featured || false,
          display_order: plan.display_order,
          valid_from: plan.valid_from,
          valid_until: plan.valid_until,
          start_date: startDate,
          end_date: endDate,
          current_period_start: startDate,
          current_period_end: currentPeriodEnd,
          metadata: razorpaySubscription,
        });

        // Update tenant (also store referral_code if provided for reward creation on payment)
        const tenantUpdateData = {
          razorpay_subscription_id: razorpaySubscription.id,
          subscription_plan: plan.plan_code,
          subscription_start: startDate,
          subscription_end: endDate,
        };
        if (referral_code) {
          tenantUpdateData.referral_code = referral_code;
        }
        await tenant.update(tenantUpdateData);

        return res.json({
          success: true,
          subscription: {
            id: subscription.id,
            razorpay_subscription_id: razorpaySubscription.id,
            status: razorpaySubscription.status,
            amount: amount,
            currency: plan.currency || 'INR',
            auth_link: razorpaySubscription.short_url, // Link for customer to complete payment
          },
        });
      } else {
        // One-time payment - create order
        // Store referral_code in tenant if provided for reward creation on payment success
        if (referral_code) {
          await tenant.update({ referral_code: referral_code });
        }
        
        const order = await razorpayService.createOrder({
          amount: amount,
          currency: plan.currency || 'INR',
          receipt: `sub_${tenant_id}_${Date.now()}`,
          notes: {
            tenant_id: tenant_id,
            plan_id: plan_id,
            plan_code: plan.plan_code,
            referral_code: referral_code || undefined, // Store in notes too
          },
        });

        return res.json({
          success: true,
          order: {
            id: order.id,
            amount: order.amount / 100, // Convert from paise
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID, // For frontend Razorpay Checkout
          },
        });
      }
    } catch (err) {
      logger.error('Create subscription error:', err);
      next(err);
    }
  },

  /**
   * Get current subscription for tenant
   */
  async getCurrentSubscription(req, res, next) {
    try {
      const tenant_id = req.tenant_id || req.user?.tenant_id;
      const masterModels = req.masterModels || require('../models/masterModels');

      const subscription = await masterModels.Subscription.findOne({
        where: {
          tenant_id: tenant_id,
          status: { [Op.in]: ['active', 'authenticated', 'pending'] },
        },
        order: [['createdAt', 'DESC']],
        include: [
          { model: masterModels.TenantMaster, as: 'tenant', attributes: ['company_name', 'email'] },
        ],
      });

      if (!subscription) {
        return res.json({ success: true, subscription: null });
      }

      return res.json({ success: true, subscription });
    } catch (err) {
      logger.error('Get subscription error:', err);
      next(err);
    }
  },

  /**
   * Update subscription
   */
  async updateSubscription(req, res, next) {
    try {
      const { id } = req.params;
      const {
        plan_code,
        plan_name,
        description,
        billing_cycle,
        base_price,
        discounted_price,
        amount,
        currency,
        trial_days,
        max_users,
        max_invoices_per_month,
        max_companies,
        storage_limit_gb,
        features,
        salesman_commission_rate,
        distributor_commission_rate,
        renewal_commission_rate,
        is_active,
        is_visible,
        is_featured,
        display_order,
        valid_from,
        valid_until,
        start_date,
        end_date,
        current_period_start,
        current_period_end,
        status,
        notes,
        metadata,
      } = req.body;

      const masterModels = req.masterModels || require('../models/masterModels');
      const subscription = await masterModels.Subscription.findByPk(id);

      if (!subscription) {
        return res.status(404).json({ message: 'Subscription not found' });
      }

      // Build update object with only provided fields
      const updateData = {};
      if (plan_code !== undefined) updateData.plan_code = plan_code;
      if (plan_name !== undefined) updateData.plan_name = plan_name;
      if (description !== undefined) updateData.description = description;
      if (billing_cycle !== undefined) updateData.billing_cycle = billing_cycle;
      if (base_price !== undefined) updateData.base_price = base_price;
      if (discounted_price !== undefined) updateData.discounted_price = discounted_price;
      if (amount !== undefined) updateData.amount = amount;
      if (currency !== undefined) updateData.currency = currency;
      if (trial_days !== undefined) updateData.trial_days = trial_days;
      if (max_users !== undefined) updateData.max_users = max_users;
      if (max_invoices_per_month !== undefined) updateData.max_invoices_per_month = max_invoices_per_month;
      if (max_companies !== undefined) updateData.max_companies = max_companies;
      if (storage_limit_gb !== undefined) updateData.storage_limit_gb = storage_limit_gb;
      if (features !== undefined) updateData.features = features;
      if (salesman_commission_rate !== undefined) updateData.salesman_commission_rate = salesman_commission_rate;
      if (distributor_commission_rate !== undefined) updateData.distributor_commission_rate = distributor_commission_rate;
      if (renewal_commission_rate !== undefined) updateData.renewal_commission_rate = renewal_commission_rate;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (is_visible !== undefined) updateData.is_visible = is_visible;
      if (is_featured !== undefined) updateData.is_featured = is_featured;
      if (display_order !== undefined) updateData.display_order = display_order;
      if (valid_from !== undefined) updateData.valid_from = valid_from;
      if (valid_until !== undefined) updateData.valid_until = valid_until;
      if (start_date !== undefined) updateData.start_date = start_date;
      if (end_date !== undefined) updateData.end_date = end_date;
      if (current_period_start !== undefined) updateData.current_period_start = current_period_start;
      if (current_period_end !== undefined) updateData.current_period_end = current_period_end;
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (metadata !== undefined) updateData.metadata = metadata;

      await subscription.update(updateData);

      return res.json({
        success: true,
        message: 'Subscription updated successfully',
        subscription: subscription,
      });
    } catch (err) {
      logger.error('Update subscription error:', err);
      next(err);
    }
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(req, res, next) {
    try {
      const tenant_id = req.tenant_id || req.user?.tenant_id;
      const { cancel_at_end } = req.body;
      const masterModels = req.masterModels || require('../models/masterModels');

      const subscription = await masterModels.Subscription.findOne({
        where: {
          tenant_id: tenant_id,
          status: { [Op.in]: ['active', 'authenticated', 'pending'] },
        },
      });

      if (!subscription) {
        return res.status(404).json({ message: 'Active subscription not found' });
      }

      // Cancel in Razorpay
      const razorpaySubscription = await razorpayService.cancelSubscription(
        subscription.razorpay_subscription_id,
        cancel_at_end === true
      );

      // Update in database
      await subscription.update({
        status: razorpaySubscription.status,
        cancelled_at: new Date(),
      });

      const tenant = await masterModels.TenantMaster.findByPk(tenant_id);
      if (tenant) {
        await tenant.update({
          razorpay_subscription_id: null,
          subscription_end: cancel_at_end ? subscription.current_period_end : new Date(),
        });
      }

      return res.json({
        success: true,
        message: 'Subscription cancelled successfully',
        subscription: subscription,
      });
    } catch (err) {
      logger.error('Cancel subscription error:', err);
      next(err);
    }
  },

  /**
   * Verify payment and update subscription
   */
  async verifyPayment(req, res, next) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing payment verification data' });
      }

      // Verify signature
      const isValid = razorpayService.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValid) {
        return res.status(400).json({ message: 'Invalid payment signature' });
      }

      // Get payment details from Razorpay
      const payment = await razorpayService.getPayment(razorpay_payment_id);

      if (payment.status !== 'captured' && payment.status !== 'authorized') {
        return res.status(400).json({ message: `Payment not successful. Status: ${payment.status}` });
      }

      // Find subscription by order notes
      const masterModels = req.masterModels || require('../models/masterModels');
      const tenantId = payment.notes?.tenant_id;

      if (tenantId) {
        // Update tenant subscription if payment successful
        const tenant = await masterModels.TenantMaster.findByPk(tenantId);
        if (tenant) {
          // If this was a one-time payment, activate subscription
          // Or update existing subscription based on payment
          // Implementation depends on your business logic
        }
      }

      return res.json({
        success: true,
        message: 'Payment verified successfully',
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount / 100,
        },
      });
    } catch (err) {
      logger.error('Verify payment error:', err);
      next(err);
    }
  },

  /**
   * Get payment history for tenant
   */
  async getPaymentHistory(req, res, next) {
    try {
      const tenant_id = req.tenant_id || req.user?.tenant_id;
      const masterModels = req.masterModels || require('../models/masterModels');

      const payments = await masterModels.Payment.findAll({
        where: { tenant_id: tenant_id },
        order: [['createdAt', 'DESC']],
        limit: 50,
      });

      return res.json({ success: true, payments });
    } catch (err) {
      logger.error('Get payment history error:', err);
      next(err);
    }
  },
};
