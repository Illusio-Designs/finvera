const { Router } = require('express');
const salesmanController = require('../controllers/salesmanController');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/role');

const router = Router();

router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/', salesmanController.list);
router.post('/', salesmanController.create);
router.get('/:id', salesmanController.getById);
router.put('/:id', salesmanController.update);
router.delete('/:id', salesmanController.delete);
router.get('/:id/performance', salesmanController.getPerformance);
router.get('/:id/leads', salesmanController.getLeads);

module.exports = router;

