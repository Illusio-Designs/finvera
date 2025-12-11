const { Router } = require('express');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const pricingController = require('../controllers/pricingController');
const { roles } = require('../config/constants');

const router = Router();

router.get('/', pricingController.listPlans);
router.post('/', auth, role([roles.SUPER_ADMIN]), pricingController.createPlan);
router.put('/:id', auth, role([roles.SUPER_ADMIN]), pricingController.updatePlan);

module.exports = router;


