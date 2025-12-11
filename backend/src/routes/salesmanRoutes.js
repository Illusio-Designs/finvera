const { Router } = require('express');
const salesmanController = require('../controllers/salesmanController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.SUPER_ADMIN));

router.get('/', salesmanController.list);
router.post('/', salesmanController.create);
router.get('/:id', salesmanController.getById);
router.put('/:id', salesmanController.update);
router.delete('/:id', salesmanController.delete);
router.get('/:id/performance', salesmanController.getPerformance);
router.get('/:id/leads', salesmanController.getLeads);

module.exports = router;

