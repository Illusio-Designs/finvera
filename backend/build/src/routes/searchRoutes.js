const { Router } = require('express');
const searchController = require('../controllers/searchController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

// Universal search endpoint - works for both admin and client contexts
// Tenant context is optional and handled within the controller
router.get('/', searchController.universalSearch);

module.exports = router;
