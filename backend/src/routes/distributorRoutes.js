const { Router } = require('express');
const distributorController = require('../controllers/distributorController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.SUPER_ADMIN));

router.get('/', distributorController.list);
router.post('/', distributorController.create);
router.get('/:id', distributorController.getById);
router.put('/:id', distributorController.update);
router.delete('/:id', distributorController.delete);
router.get('/:id/performance', distributorController.getPerformance);

module.exports = router;

