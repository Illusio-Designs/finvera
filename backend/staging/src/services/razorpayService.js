const Razorpay = require('razorpay');
const logger = require('../utils/logger');

class RazorpayService {
  constructor() {
    this.instance = null;
    this.init();
  }

  init() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      logger.warn('Razorpay keys not configured. Subscription features will not work.');
      return;
    }

    this.instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  /**
   * Create a Razorpay customer
   */
  async createCustomer(customerData) {
    if (!this.instance) {
      throw new Error('Razorpay is not configured');
    }

    try {
      const customer = await this.instance.customers.create({
        name: customerData.name,
        email: customerData.email,
        contact: customerData.contact,
        notes: customerData.notes || {},
      });

      return customer;
    } catch (error) {
      logger.error('Razorpay createCustomer error:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId) {
    if (!this.instance) {
      throw new Error('Razorpay is not configured');
    }

    try {
      const customer = await this.instance.customers.fetch(customerId);
      return customer;
    } catch (error) {
      logger.error('Razorpay getCustomer error:', error);
      throw error;
    }
  }

  /**
   * Create a Razorpay order for one-time payment
   */
  async createOrder(orderData) {
    if (!this.instance) {
      throw new Error('Razorpay is not configured');
    }

    try {
      const order = await this.instance.orders.create({
        amount: orderData.amount * 100, // Convert to paise
        currency: orderData.currency || 'INR',
        receipt: orderData.receipt,
        notes: orderData.notes || {},
        partial_payment: orderData.partial_payment || false,
      });

      return order;
    } catch (error) {
      logger.error('Razorpay createOrder error:', error);
      throw error;
    }
  }

  /**
   * Create a Razorpay plan (for subscriptions)
   */
  async createPlan(planData) {
    if (!this.instance) {
      throw new Error('Razorpay is not configured');
    }

    try {
      const plan = await this.instance.plans.create({
        period: planData.billing_cycle === 'yearly' ? 'yearly' : 'monthly',
        interval: 1,
        item: {
          name: planData.name,
          amount: planData.amount * 100, // Convert to paise
          currency: planData.currency || 'INR',
          description: planData.description,
        },
        notes: planData.notes || {},
      });

      return plan;
    } catch (error) {
      logger.error('Razorpay createPlan error:', error);
      throw error;
    }
  }

  /**
   * Create a Razorpay subscription
   */
  async createSubscription(subscriptionData) {
    if (!this.instance) {
      throw new Error('Razorpay is not configured');
    }

    try {
      const subscription = await this.instance.subscriptions.create({
        plan_id: subscriptionData.plan_id,
        customer_notify: subscriptionData.customer_notify !== false ? 1 : 0,
        total_count: subscriptionData.total_count || 12, // Number of billing cycles
        start_at: subscriptionData.start_at || Math.floor(Date.now() / 1000) + 60, // Start 60 seconds from now
        notes: subscriptionData.notes || {},
      });

      return subscription;
    } catch (error) {
      logger.error('Razorpay createSubscription error:', error);
      throw error;
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId) {
    if (!this.instance) {
      throw new Error('Razorpay is not configured');
    }

    try {
      const subscription = await this.instance.subscriptions.fetch(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Razorpay getSubscription error:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId, cancelAtEnd = false) {
    if (!this.instance) {
      throw new Error('Razorpay is not configured');
    }

    try {
      const subscription = await this.instance.subscriptions.cancel(subscriptionId, {
        cancel_at_cycle_end: cancelAtEnd ? 1 : 0,
      });

      return subscription;
    } catch (error) {
      logger.error('Razorpay cancelSubscription error:', error);
      throw error;
    }
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(subscriptionId, pauseAt = null) {
    if (!this.instance) {
      throw new Error('Razorpay is not configured');
    }

    try {
      const subscription = await this.instance.subscriptions.pause({
        subscription_id: subscriptionId,
        pause_at: pauseAt || 'now',
      });

      return subscription;
    } catch (error) {
      logger.error('Razorpay pauseSubscription error:', error);
      throw error;
    }
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(subscriptionId, resumeAt = null) {
    if (!this.instance) {
      throw new Error('Razorpay is not configured');
    }

    try {
      const subscription = await this.instance.subscriptions.resume({
        subscription_id: subscriptionId,
        resume_at: resumeAt || 'now',
      });

      return subscription;
    } catch (error) {
      logger.error('Razorpay resumeSubscription error:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId) {
    if (!this.instance) {
      throw new Error('Razorpay is not configured');
    }

    try {
      const payment = await this.instance.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      logger.error('Razorpay getPayment error:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(razorpaySignature, razorpayOrderId, razorpayPaymentId) {
    if (!this.instance || !process.env.RAZORPAY_WEBHOOK_SECRET) {
      throw new Error('Razorpay webhook secret not configured');
    }

    const crypto = require('crypto');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const signature = crypto.createHmac('sha256', secret).update(text).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(razorpaySignature),
      Buffer.from(signature)
    );
  }

  /**
   * Verify payment signature (for payment success)
   */
  verifyPaymentSignature(orderId, paymentId, signature) {
    if (!this.instance) {
      throw new Error('Razorpay is not configured');
    }

    const crypto = require('crypto');
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto.createHmac('sha256', secret).update(text).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(generatedSignature)
    );
  }
}

// Export singleton instance
module.exports = new RazorpayService();
