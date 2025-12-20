const { NotificationPreference, User } = require('../models');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

module.exports = {
  /**
   * Get user notification preferences
   */
  async getPreferences(req, res, next) {
    try {
      const userId = req.user.id;

      let preferences = await NotificationPreference.findOne({
        where: { user_id: userId },
      });

      // Create default preferences if not found
      if (!preferences) {
        preferences = await NotificationPreference.create({
          user_id: userId,
          in_app_enabled: true,
          email_enabled: true,
          desktop_enabled: true,
          sound_enabled: true,
          type_preferences: {},
        });
      }

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
      const userId = req.user.id;
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
        preferences = await NotificationPreference.create({
          user_id: userId,
          in_app_enabled: in_app_enabled !== undefined ? in_app_enabled : true,
          email_enabled: email_enabled !== undefined ? email_enabled : true,
          desktop_enabled: desktop_enabled !== undefined ? desktop_enabled : true,
          sound_enabled: sound_enabled !== undefined ? sound_enabled : true,
          type_preferences: type_preferences || {},
        });
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
