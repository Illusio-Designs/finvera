const { Router } = require('express');
const { upload } = require('../config/multer');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant } = require('../middleware/tenant');
const fileController = require('../controllers/fileController');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);

router.post('/upload', upload.single('file'), fileController.upload);

module.exports = router;


