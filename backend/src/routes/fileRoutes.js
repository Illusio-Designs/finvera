const { Router } = require('express');
const upload = require('../config/multer');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const fileController = require('../controllers/fileController');

const router = Router();

router.post('/upload', auth, tenant, upload.single('file'), fileController.upload);

module.exports = router;


