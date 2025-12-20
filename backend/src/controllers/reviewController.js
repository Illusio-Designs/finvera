const masterModels = require('../models/masterModels');
const { TenantReview, TenantMaster } = masterModels;
const { Op } = require('sequelize');
const logger = require('../utils/logger');

module.exports = {
  /**
   * Submit a review (for authenticated tenants)
   */
  async submitReview(req, res, next) {
    try {
      const { tenant_id } = req; // From auth middleware
      const {
        rating,
        title,
        comment,
        reviewer_name,
        reviewer_designation,
        reviewer_company,
      } = req.body;

      // Validate required fields
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Rating is required and must be between 1 and 5',
        });
      }

      if (!reviewer_name) {
        return res.status(400).json({
          success: false,
          error: 'Reviewer name is required',
        });
      }

      // Check if tenant already submitted a review
      const existingReview = await TenantReview.findOne({
        where: { tenant_id },
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          error: 'You have already submitted a review. You can update your existing review.',
        });
      }

      // Get tenant info for defaults
      const tenant = await TenantMaster.findByPk(tenant_id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found',
        });
      }

      // Create review
      const review = await TenantReview.create({
        tenant_id,
        user_id: req.user?.id || null,
        rating,
        title: title || null,
        comment: comment || null,
        reviewer_name,
        reviewer_designation: reviewer_designation || null,
        reviewer_company: reviewer_company || tenant.company_name,
        is_approved: false, // Requires admin approval
        is_featured: false,
      });

      res.status(201).json({
        success: true,
        data: review,
        message: 'Thank you for your review! It will be published after admin approval.',
      });
    } catch (error) {
      logger.error('Submit review error:', error);
      next(error);
    }
  },

  /**
   * Update existing review
   */
  async updateReview(req, res, next) {
    try {
      const { tenant_id } = req;
      const { id } = req.params;
      const {
        rating,
        title,
        comment,
        reviewer_name,
        reviewer_designation,
        reviewer_company,
      } = req.body;

      const review = await TenantReview.findOne({
        where: { id, tenant_id },
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found',
        });
      }

      // Update fields
      if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
          return res.status(400).json({
            success: false,
            error: 'Rating must be between 1 and 5',
          });
        }
        review.rating = rating;
      }

      if (title !== undefined) review.title = title;
      if (comment !== undefined) review.comment = comment;
      if (reviewer_name !== undefined) review.reviewer_name = reviewer_name;
      if (reviewer_designation !== undefined) review.reviewer_designation = reviewer_designation;
      if (reviewer_company !== undefined) review.reviewer_company = reviewer_company;

      // Reset approval status when review is updated
      review.is_approved = false;

      await review.save();

      res.json({
        success: true,
        data: review,
        message: 'Review updated successfully. It will be republished after admin approval.',
      });
    } catch (error) {
      logger.error('Update review error:', error);
      next(error);
    }
  },

  /**
   * Get public reviews (for website display)
   */
  async getPublicReviews(req, res, next) {
    try {
      const { limit = 10, featured_only = false } = req.query;

      const where = {
        is_approved: true,
      };

      if (featured_only === 'true') {
        where.is_featured = true;
      }

      const reviews = await TenantReview.findAll({
        where,
        include: [
          {
            model: TenantMaster,
            as: 'tenant',
            attributes: ['company_name', 'subdomain'],
          },
        ],
        order: [
          ['is_featured', 'DESC'],
          ['created_at', 'DESC'],
        ],
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      logger.error('Get public reviews error:', error);
      next(error);
    }
  },

  /**
   * Get tenant's own review
   */
  async getMyReview(req, res, next) {
    try {
      const { tenant_id } = req;

      const review = await TenantReview.findOne({
        where: { tenant_id },
        include: [
          {
            model: TenantMaster,
            as: 'tenant',
            attributes: ['company_name', 'subdomain'],
          },
        ],
      });

      res.json({
        success: true,
        data: review,
      });
    } catch (error) {
      logger.error('Get my review error:', error);
      next(error);
    }
  },

  /**
   * Admin: Get all reviews
   */
  async getAllReviews(req, res, next) {
    try {
      const { page = 1, limit = 20, is_approved, is_featured, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {};

      if (is_approved !== undefined) {
        where.is_approved = is_approved === 'true';
      }

      if (is_featured !== undefined) {
        where.is_featured = is_featured === 'true';
      }

      if (search) {
        where[Op.or] = [
          { reviewer_name: { [Op.like]: `%${search}%` } },
          { reviewer_company: { [Op.like]: `%${search}%` } },
          { comment: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await TenantReview.findAndCountAll({
        where,
        include: [
          {
            model: TenantMaster,
            as: 'tenant',
            attributes: ['id', 'company_name', 'subdomain', 'email'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      logger.error('Get all reviews error:', error);
      next(error);
    }
  },

  /**
   * Admin: Approve/reject review
   */
  async approveReview(req, res, next) {
    try {
      const { id } = req.params;
      const { is_approved, is_featured } = req.body;

      const review = await TenantReview.findByPk(id);
      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found',
        });
      }

      if (is_approved !== undefined) {
        review.is_approved = is_approved === true;
      }

      if (is_featured !== undefined) {
        review.is_featured = is_featured === true;
      }

      await review.save();

      res.json({
        success: true,
        data: review,
        message: `Review ${review.is_approved ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error) {
      logger.error('Approve review error:', error);
      next(error);
    }
  },

  /**
   * Admin: Delete review
   */
  async deleteReview(req, res, next) {
    try {
      const { id } = req.params;

      const review = await TenantReview.findByPk(id);
      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found',
        });
      }

      await review.destroy();

      res.json({
        success: true,
        message: 'Review deleted successfully',
      });
    } catch (error) {
      logger.error('Delete review error:', error);
      next(error);
    }
  },
};
