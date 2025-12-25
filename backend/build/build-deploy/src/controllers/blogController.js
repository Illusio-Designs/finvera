const { Blog, BlogCategory, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

module.exports = {
  // List all blogs
  async listBlogs(req, res, next) {
    try {
      const { page = 1, limit = 20, status, category_id, search } = req.query;
      const offset = (page - 1) * limit;
      const where = {};

      if (status) {
        where.status = status;
      }

      if (category_id) {
        where.category_id = category_id;
      }

      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { excerpt: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Blog.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['published_at', 'DESC']],
        include: [
          { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
          { model: BlogCategory, as: 'category', attributes: ['id', 'name', 'slug'] },
        ],
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      logger.error('List blogs error:', error);
      next(error);
    }
  },

  // Get single blog
  async getBlog(req, res, next) {
    try {
      const { id } = req.params;

      const blog = await Blog.findByPk(id, {
        include: [
          { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
          { model: BlogCategory, as: 'category' },
        ],
      });

      if (!blog) {
        return res.status(404).json({ success: false, error: 'Blog not found' });
      }

      // Increment views
      await blog.increment('views_count');

      res.json({ success: true, data: blog });
    } catch (error) {
      logger.error('Get blog error:', error);
      next(error);
    }
  },

  // Create blog
  async createBlog(req, res, next) {
    try {
      const author_id = req.user_id || req.user?.id || req.user?.user_id || req.user?.sub;
      
      if (!author_id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const blog = await Blog.create({
        ...req.body,
        author_id,
      });

      res.status(201).json({ success: true, data: blog });
    } catch (error) {
      logger.error('Create blog error:', error);
      next(error);
    }
  },

  // Update blog
  async updateBlog(req, res, next) {
    try {
      const { id } = req.params;

      const blog = await Blog.findByPk(id);
      if (!blog) {
        return res.status(404).json({ success: false, error: 'Blog not found' });
      }

      await blog.update(req.body);

      res.json({ success: true, data: blog });
    } catch (error) {
      logger.error('Update blog error:', error);
      next(error);
    }
  },

  // Delete blog
  async deleteBlog(req, res, next) {
    try {
      const { id } = req.params;

      const blog = await Blog.findByPk(id);
      if (!blog) {
        return res.status(404).json({ success: false, error: 'Blog not found' });
      }

      await blog.destroy();

      res.json({ success: true, message: 'Blog deleted successfully' });
    } catch (error) {
      logger.error('Delete blog error:', error);
      next(error);
    }
  },

  // List blog categories
  async listCategories(req, res, next) {
    try {
      const categories = await BlogCategory.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']],
      });

      res.json({ success: true, data: categories });
    } catch (error) {
      logger.error('List categories error:', error);
      next(error);
    }
  },

  // Create blog category
  async createCategory(req, res, next) {
    try {
      const { name, slug } = req.body;

      // Check for duplicate name
      if (name) {
        const existingName = await BlogCategory.findOne({ where: { name } });
        if (existingName) {
          return res.status(409).json({
            success: false,
            error: 'Category name already exists',
          });
        }
      }

      // Check for duplicate slug
      if (slug) {
        const existingSlug = await BlogCategory.findOne({ where: { slug } });
        if (existingSlug) {
          return res.status(409).json({
            success: false,
            error: 'Category slug already exists',
          });
        }
      }

      const category = await BlogCategory.create(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      logger.error('Create category error:', error);
      next(error);
    }
  },
};
