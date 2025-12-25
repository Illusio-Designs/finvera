const { Router } = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const razorpayWebhookController = require('../controllers/razorpayWebhookController');
const { authenticate } = require('../middleware/auth');

const router = Router();

// Webhook endpoint (no authentication - uses signature verification)
router.post('/webhook', razorpayWebhookController.handleWebhook);

// Protected routes (require authentication)
// Note: Subscriptions are stored in master DB, so we don't need full tenant resolution
router.use(authenticate);

// Subscription management
router.post('/subscriptions', subscriptionController.createSubscription);
router.get('/subscriptions/current', subscriptionController.getCurrentSubscription);
router.post('/subscriptions/cancel', subscriptionController.cancelSubscription);

// Payment management
router.post('/payments/verify', subscriptionController.verifyPayment);
router.get('/payments/history', subscriptionController.getPaymentHistory);

module.exports = router;
