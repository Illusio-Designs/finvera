const { Router } = require('express');
const eWayBillController = require('../controllers/eWayBillController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant, resolveTenant } = require('../middleware/tenant');
const validator = require('../middleware/validator');
const { generateEWayBillValidator, cancelEWayBillValidator, updateVehicleValidator } = require('../validators/eWayBillValidator');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);
router.use(resolveTenant);

router.get('/', eWayBillController.list);
router.post('/generate', validator(generateEWayBillValidator), eWayBillController.generate);
router.get('/voucher/:voucher_id', eWayBillController.getByVoucher);
router.post('/cancel/:voucher_id', validator(cancelEWayBillValidator), eWayBillController.cancel);
router.put('/:id/vehicle', validator(updateVehicleValidator), eWayBillController.updateVehicle);

module.exports = router;

