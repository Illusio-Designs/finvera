const { Router } = require('express');
const eWayBillController = require('../controllers/eWayBillController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant, resolveTenant } = require('../middleware/tenant');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);
router.use(resolveTenant);

router.get('/', eWayBillController.list);
router.post('/generate', eWayBillController.generate);
router.get('/voucher/:voucher_id', eWayBillController.getByVoucher);
router.post('/cancel/:voucher_id', eWayBillController.cancel);

module.exports = router;

