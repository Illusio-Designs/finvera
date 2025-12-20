import { useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../lib/api';
import { NOTIFICATION_TYPES } from '../lib/notificationConfig';

/**
 * Custom hook for managing notification preferences
 */
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch user notification preferences
   */
  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationAPI.getPreferences();
      const data = response.data?.data || response.data || null;
      setPreferences(data);
      return data;
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      setError(err.response?.data?.message || 'Failed to fetch preferences');
      // Return default preferences on error
      return getDefaultPreferences();
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(async (updates) => {
    try {
      setError(null);
      const response = await notificationAPI.updatePreferences(updates);
      const data = response.data?.data || response.data || null;
      setPreferences(data);
      return data;
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      setError(err.response?.data?.message || 'Failed to update preferences');
      throw err;
    }
  }, []);

  /**
   * Check if a notification type should be shown
   */
  const shouldShowNotification = useCallback(
    (notificationType, channel = 'in_app') => {
      if (!preferences) {
        return true; // Default to showing if preferences not loaded
      }

      // Check global enable/disable
      if (channel === 'in_app' && preferences.in_app_enabled === false) {
        return false;
      }
      if (channel === 'email' && preferences.email_enabled === false) {
        return false;
      }
      if (channel === 'desktop' && preferences.desktop_enabled === false) {
        return false;
      }
      if (channel === 'sound' && preferences.sound_enabled === false) {
        return false;
      }

      // Check type-specific preferences
      const typePrefs = preferences.type_preferences || {};
      const typePref = typePrefs[notificationType];

      if (typePref) {
        if (channel === 'in_app' && typePref.in_app === false) {
          return false;
        }
        if (channel === 'email' && typePref.email === false) {
          return false;
        }
        if (channel === 'desktop' && typePref.desktop === false) {
          return false;
        }
        if (channel === 'sound' && typePref.sound === false) {
          return false;
        }
      }

      return true;
    },
    [preferences]
  );

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    updatePreferences,
    shouldShowNotification,
  };
}

/**
 * Get default notification preferences
 */
export function getDefaultPreferences() {
  const allTypes = Object.values(NOTIFICATION_TYPES);
  const typePreferences = {};

  // Enable all types by default for all channels
  allTypes.forEach((type) => {
    typePreferences[type] = {
      in_app: true,
      email: true,
      desktop: true,
      sound: true,
    };
  });

  return {
    in_app_enabled: true,
    email_enabled: true,
    desktop_enabled: true,
    sound_enabled: true,
    type_preferences: typePreferences,
  };
}
