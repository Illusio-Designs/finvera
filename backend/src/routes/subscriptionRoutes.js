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
router.post('/', subscriptionController.createSubscription);
router.get('/current', subscriptionController.getCurrentSubscription);
router.put('/:id', subscriptionController.updateSubscription);
router.post('/cancel', subscriptionController.cancelSubscription);

// Payment management
router.post('/payments/verify', subscriptionController.verifyPayment);
router.get('/payments/history', subscriptionController.getPaymentHistory);

module.exports = router;
