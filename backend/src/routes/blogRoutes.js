const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Blog routes
router.get('/blogs', blogController.listBlogs);
router.get('/blogs/:id', blogController.getBlog);
router.post('/blogs', authenticate, authorize(['super_admin', 'website_manager']), blogController.createBlog);
router.put('/blogs/:id', authenticate, authorize(['super_admin', 'website_manager']), blogController.updateBlog);
router.delete('/blogs/:id', authenticate, authorize(['super_admin', 'website_manager']), blogController.deleteBlog);

// Category routes
router.get('/blog-categories', blogController.listCategories);
router.post('/blog-categories', authenticate, authorize(['super_admin', 'website_manager']), blogController.createCategory);

module.exports = router;
