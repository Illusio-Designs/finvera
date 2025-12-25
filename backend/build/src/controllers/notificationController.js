const { Notification } = require('../models');
const notificationService = require('../services/notificationService');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

module.exports = {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(req, res, next) {
    try {
      const { is_read, type, limit = 50, offset = 0 } = req.query;
      const userId = req.user_id || req.user?.id || req.user?.user_id || req.user?.sub;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const where = { user_id: userId };
      if (is_read !== undefined) {
        where.is_read = is_read === 'true';
      }
      if (type) {
        where.type = type;
      }

      const { count, rows } = await Notification.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        data: rows,
        pagination: {
          total: count,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      });
    } catch (error) {
      logger.error('Get notifications error:', error);
      next(error);
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user_id || req.user?.id || req.user?.user_id || req.user?.sub;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }
      
      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      logger.error('Get unread count error:', error);
      next(error);
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user_id || req.user?.id || req.user?.user_id || req.user?.sub;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const notification = await notificationService.markAsRead(id, userId);
      res.json({ data: notification });
    } catch (error) {
      logger.error('Mark as read error:', error);
      if (error.message === 'Notification not found') {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user_id || req.user?.id || req.user?.user_id || req.user?.sub;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }
      
      await notificationService.markAllAsRead(userId);
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      logger.error('Mark all as read error:', error);
      next(error);
    }
  },

  /**
   * Delete notification
   */
  async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user_id || req.user?.id || req.user?.user_id || req.user?.sub;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const notification = await Notification.findOne({
        where: { id, user_id: userId },
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      await notification.destroy();
      res.json({ message: 'Notification deleted' });
    } catch (error) {
      logger.error('Delete notification error:', error);
      next(error);
    }
  },
};
