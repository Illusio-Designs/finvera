const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { setTenantContext, requireTenant } = require('../middleware/tenant');
const reviewController = require('../controllers/reviewController');
const { ROLES } = require('../config/constants');

const router = Router();

// Public routes - get approved reviews for website
router.get('/public', reviewController.getPublicReviews);

// Tenant routes - submit/update their own review
router.post('/', authenticate, setTenantContext, requireTenant, reviewController.submitReview);
router.get('/my', authenticate, setTenantContext, requireTenant, reviewController.getMyReview);
router.put('/my/:id', authenticate, setTenantContext, requireTenant, reviewController.updateReview);

// Admin routes - manage all reviews
router.get('/', authenticate, requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), reviewController.getAllReviews);
router.put('/:id/approve', authenticate, requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), reviewController.approveReview);
router.delete('/:id', authenticate, requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), reviewController.deleteReview);

module.exports = router;
