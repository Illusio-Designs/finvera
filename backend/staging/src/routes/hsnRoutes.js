const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant, resolveTenant } = require('../middleware/tenant');
const hsnController = require('../controllers/hsnController');

const router = Router();

// HSN/SAC master is shared; keep authenticated for now
router.use(authenticate);

// Routes that don't need tenant context (public HSN lookup)
router.get('/search', hsnController.search);
router.get('/:code', hsnController.getByCode);

// Routes that need tenant context for third-party API integration
router.use(setTenantContext);
router.use(requireTenant);
router.use(resolveTenant);

router.get('/:code/validate', hsnController.validate);

module.exports = router;

