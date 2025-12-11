const { Router } = require('express');
const payoutController = require('../controllers/payoutController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.SUPER_ADMIN));

router.get('/', payoutController.list);
router.get('/:id', payoutController.getById);
router.post('/', payoutController.create);
router.post('/:id/process', payoutController.process);
router.put('/:id', payoutController.update);

module.exports = router;

