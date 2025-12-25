const { SEO } = require('../models');
const logger = require('../utils/logger');

module.exports = {
  // List all SEO settings
  async listSEO(req, res, next) {
    try {
      const { page_type, is_active } = req.query;
      const where = {};

      if (page_type) {
        where.page_type = page_type;
      }

      if (is_active !== undefined) {
        where.is_active = is_active === 'true';
      }

      const seoSettings = await SEO.findAll({
        where,
        order: [['page_path', 'ASC']],
      });

      res.json({ success: true, data: seoSettings });
    } catch (error) {
      logger.error('List SEO error:', error);
      next(error);
    }
  },

  // Get SEO by page path
  async getSEO(req, res, next) {
    try {
      const { path } = req.params;

      const seo = await SEO.findOne({
        where: { page_path: path, is_active: true },
      });

      if (!seo) {
        return res.status(404).json({ success: false, error: 'SEO settings not found' });
      }

      res.json({ success: true, data: seo });
    } catch (error) {
      logger.error('Get SEO error:', error);
      next(error);
    }
  },

  // Create SEO settings
  async createSEO(req, res, next) {
    try {
      const seo = await SEO.create(req.body);
      res.status(201).json({ success: true, data: seo });
    } catch (error) {
      logger.error('Create SEO error:', error);
      next(error);
    }
  },

  // Update SEO settings
  async updateSEO(req, res, next) {
    try {
      const { id } = req.params;

      const seo = await SEO.findByPk(id);
      if (!seo) {
        return res.status(404).json({ success: false, error: 'SEO settings not found' });
      }

      await seo.update(req.body);

      res.json({ success: true, data: seo });
    } catch (error) {
      logger.error('Update SEO error:', error);
      next(error);
    }
  },

  // Delete SEO settings
  async deleteSEO(req, res, next) {
    try {
      const { id } = req.params;

      const seo = await SEO.findByPk(id);
      if (!seo) {
        return res.status(404).json({ success: false, error: 'SEO settings not found' });
      }

      await seo.destroy();

      res.json({ success: true, message: 'SEO settings deleted successfully' });
    } catch (error) {
      logger.error('Delete SEO error:', error);
      next(error);
    }
  },
};
