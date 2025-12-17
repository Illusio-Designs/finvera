const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const hsnController = require('../controllers/hsnController');

const router = Router();

// HSN/SAC master is shared; keep authenticated for now
router.use(authenticate);

router.get('/search', hsnController.search);
router.get('/:code', hsnController.getByCode);

module.exports = router;

