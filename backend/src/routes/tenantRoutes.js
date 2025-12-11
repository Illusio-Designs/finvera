const { Router } = require('express');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const tenantController = require('../controllers/tenantController');

const router = Router();

router.get('/profile', auth, tenant, tenantController.getProfile);
router.put('/profile', auth, tenant, tenantController.updateProfile);

module.exports = router;


