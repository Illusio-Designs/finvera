const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

// Public routes (clients can create tickets)
router.post('/tickets', supportController.createTicket);
router.post('/tickets/:id/messages', supportController.addMessage); // Client can reply

// Admin/Support Agent routes
router.get(
  '/tickets',
  authenticate,
  authorize(['super_admin', 'admin', 'support_agent']),
  supportController.listTickets
);

router.get(
  '/tickets/:id',
  authenticate,
  authorize(['super_admin', 'admin', 'support_agent']),
  supportController.getTicket
);

router.put(
  '/tickets/:id/assign',
  authenticate,
  authorize(['super_admin', 'admin']),
  supportController.assignTicket
);

router.put(
  '/tickets/:id/status',
  authenticate,
  authorize(['super_admin', 'admin', 'support_agent']),
  supportController.updateTicketStatus
);

router.post(
  '/tickets/:id/messages',
  authenticate,
  authorize(['super_admin', 'admin', 'support_agent']),
  supportController.addMessage
);

// Review routes
router.post('/tickets/:ticket_id/review', supportController.submitReview); // Public - client can review

router.get(
  '/agents/:agent_id/reviews',
  authenticate,
  authorize(['super_admin', 'admin']),
  supportController.getAgentReviews
);

module.exports = router;
