const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const pricingController = require('../controllers/pricingController');
const { ROLES } = require('../config/constants');

const router = Router();

router.get('/', pricingController.listPlans);
router.post('/', authenticate, requireRole(ROLES.SUPER_ADMIN), pricingController.createPlan);
router.put('/:id', authenticate, requireRole(ROLES.SUPER_ADMIN), pricingController.updatePlan);

module.exports = router;


