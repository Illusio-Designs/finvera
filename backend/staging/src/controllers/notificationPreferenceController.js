const { NotificationPreference, User } = require('../models');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

// Ensure models are available
if (!NotificationPreference) {
  logger.error('NotificationPreference model not found');
}

module.exports = {
  /**
   * Get user notification preferences
   */
  async getPreferences(req, res, next) {
    try {
      const userId = req.user_id || req.user?.id || req.user?.user_id || req.user?.sub;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Try to find existing preferences first
      let preferences = await NotificationPreference.findOne({
        where: { user_id: userId },
      });

      // If preferences exist, return them
      if (preferences) {
        return res.json({ data: preferences });
      }

      // If no preferences found, check if user exists in main database
      const user = await User.findByPk(userId);
      
      if (user) {
        // User exists, create default preferences
        try {
        preferences = await NotificationPreference.create({
            user_id: userId,
            in_app_enabled: true,
            email_enabled: true,
            desktop_enabled: true,
            sound_enabled: true,
            type_preferences: {},
          });
          return res.json({ data: preferences });
        } catch (createError) {
          // If creation fails, return default preferences object (don't break frontend)
          logger.warn(`Cannot create notification preferences for user ${userId}: ${createError.message}`);
        }
      } else {
        logger.debug(`User ${userId} not found in main database, returning default preferences`);
      }

      // Return default preferences object if user doesn't exist or creation failed
      // This prevents frontend errors for tenant users who may not be in main DB
      return res.json({
        data: {
          id: null,
          user_id: userId,
          in_app_enabled: true,
          email_enabled: true,
          desktop_enabled: true,
          sound_enabled: true,
          type_preferences: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        });

      res.json({ data: preferences });
    } catch (error) {
      logger.error('Get notification preferences error:', error);
      next(error);
    }
  },

  /**
   * Update user notification preferences
   */
  async updatePreferences(req, res, next) {
    try {
      const userId = req.user_id || req.user?.id || req.user?.user_id || req.user?.sub;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Verify user exists in main database before creating/updating preferences
      const user = await User.findByPk(userId);
      if (!user) {
        logger.warn(`User ${userId} not found in main database when updating notification preferences`);
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const {
        in_app_enabled,
        email_enabled,
        desktop_enabled,
        sound_enabled,
        type_preferences,
      } = req.body;

      let preferences = await NotificationPreference.findOne({
        where: { user_id: userId },
      });

      if (!preferences) {
        try {
        preferences = await NotificationPreference.create({
          user_id: userId,
          in_app_enabled: in_app_enabled !== undefined ? in_app_enabled : true,
          email_enabled: email_enabled !== undefined ? email_enabled : true,
          desktop_enabled: desktop_enabled !== undefined ? desktop_enabled : true,
          sound_enabled: sound_enabled !== undefined ? sound_enabled : true,
          type_preferences: type_preferences || {},
        });
        } catch (createError) {
          // If creation fails (e.g., foreign key constraint), return error
          if (createError.name === 'SequelizeForeignKeyConstraintError') {
            logger.warn(`Cannot create notification preferences for user ${userId}: user may not exist in main database`);
            return res.status(404).json({
              success: false,
              message: 'User not found in main database',
            });
          }
          throw createError;
        }
      } else {
        const updateData = {};
        if (in_app_enabled !== undefined) updateData.in_app_enabled = in_app_enabled;
        if (email_enabled !== undefined) updateData.email_enabled = email_enabled;
        if (desktop_enabled !== undefined) updateData.desktop_enabled = desktop_enabled;
        if (sound_enabled !== undefined) updateData.sound_enabled = sound_enabled;
        if (type_preferences !== undefined) updateData.type_preferences = type_preferences;

        await preferences.update(updateData);
      }

      res.json({ data: preferences });
    } catch (error) {
      logger.error('Update notification preferences error:', error);
      next(error);
    }
  },
};
