
const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { isAuthenticated, isTenantUser } = require('../middleware/auth');

router.post('/', isAuthenticated, isTenantUser, branchController.create);
router.get('/company/:company_id', isAuthenticated, isTenantUser, branchController.list);
router.get('/:id', isAuthenticated, isTenantUser, branchController.getById);
router.put('/:id', isAuthenticated, isTenantUser, branchController.update);
router.delete('/:id', isAuthenticated, isTenantUser, branchController.remove);

module.exports = router;
