const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const pricingController = require('../controllers/pricingController');
const { ROLES } = require('../config/constants');

const router = Router();

router.get('/', pricingController.listPlans);
router.get('/:id', pricingController.getPlan);
router.post('/', authenticate, requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), pricingController.createPlan);
router.put('/:id', authenticate, requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), pricingController.updatePlan);
router.delete('/:id', authenticate, requireRole(ROLES.SUPER_ADMIN), pricingController.deletePlan);

module.exports = router;


