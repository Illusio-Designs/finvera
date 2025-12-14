const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seoController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

// SEO routes (website_manager can manage)
router.get('/seo', seoController.listSEO);
router.get('/seo/:path', seoController.getSEO);
router.post('/seo', authenticate, authorize(['super_admin', 'website_manager']), seoController.createSEO);
router.put('/seo/:id', authenticate, authorize(['super_admin', 'website_manager']), seoController.updateSEO);
router.delete('/seo/:id', authenticate, authorize(['super_admin', 'website_manager']), seoController.deleteSEO);

module.exports = router;
