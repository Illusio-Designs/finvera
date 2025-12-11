const { Router } = require('express');
const commissionController = require('../controllers/commissionController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.SUPER_ADMIN));

router.get('/', commissionController.list);
router.get('/:id', commissionController.getById);
router.post('/calculate', commissionController.calculate);
router.put('/:id/approve', commissionController.approve);
router.put('/:id/cancel', commissionController.cancel);

module.exports = router;

