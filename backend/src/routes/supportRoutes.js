const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { setTenantContext, requireTenant } = require('../middleware/tenant');

// Public routes (clients can create tickets) - with optional authentication
router.post('/tickets', (req, res, next) => {
  // Try to authenticate if token is provided, but don't fail if not
  if (req.headers.authorization) {
    authenticate(req, res, (err) => {
      if (err) {
        // If authentication fails, continue without user context
        req.user = null;
        supportController.createTicket(req, res, next);
      } else {
        // If authentication succeeds, set tenant context
        setTenantContext(req, res, (tenantErr) => {
          if (tenantErr) {
            console.error('🎫 Tenant context error:', tenantErr);
            // Continue without tenant context if it fails
          }
          supportController.createTicket(req, res, next);
        });
      }
    });
  } else {
    // No token provided, continue without user context
    req.user = null;
    supportController.createTicket(req, res, next);
  }
});

// Client routes (authenticated clients can manage their own tickets)
router.get(
  '/my-tickets',
  authenticate,
  supportController.listMyTickets
);

router.get(
  '/my-tickets/:id',
  authenticate,
  supportController.getMyTicket
);

router.post('/tickets/:id/messages', supportController.addMessage); // Client can reply (public or authenticated)

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
