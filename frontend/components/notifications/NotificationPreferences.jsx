import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ToggleSwitch from '../ui/ToggleSwitch';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';
import { NOTIFICATION_TYPES, getNotificationConfig } from '../../lib/notificationConfig';
import { notify } from '../ui/Toast';
import { FiSave, FiRefreshCw } from 'react-icons/fi';
import { initDesktopNotifications, requestNotificationPermission } from '../../lib/desktopNotificationService';

export default function NotificationPreferences() {
  const { preferences, loading, updatePreferences, shouldShowNotification } = useNotificationPreferences();
  const [localPreferences, setLocalPreferences] = useState(null);
  const [saving, setSaving] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState('default');

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
    // Check desktop notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setDesktopPermission(Notification.permission);
    }
  }, [preferences]);

  const handleGlobalToggle = (key) => {
    if (!localPreferences) return;
    setLocalPreferences({
      ...localPreferences,
      [key]: !localPreferences[key],
    });
  };

  const handleTypeToggle = (type, channel) => {
    if (!localPreferences) return;
    const typePrefs = { ...(localPreferences.type_preferences || {}) };
    if (!typePrefs[type]) {
      typePrefs[type] = {
        in_app: true,
        email: true,
        desktop: true,
        sound: true,
      };
    }
    typePrefs[type] = {
      ...typePrefs[type],
      [channel]: !typePrefs[type][channel],
    };
    setLocalPreferences({
      ...localPreferences,
      type_preferences: typePrefs,
    });
  };

  const handleSave = async () => {
    if (!localPreferences) return;
    try {
      setSaving(true);
      await updatePreferences(localPreferences);
      notify.success('Notification preferences saved successfully');
    } catch (error) {
      notify.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDesktopPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setDesktopPermission('granted');
      notify.success('Desktop notifications enabled');
    } else {
      setDesktopPermission('denied');
      notify.error('Desktop notifications permission denied');
    }
  };

  // Group notification types by category
  const notificationGroups = {
    'User & Account': [
      NOTIFICATION_TYPES.NEW_USER_ADDED,
      NOTIFICATION_TYPES.USER_PROFILE_UPDATED,
      NOTIFICATION_TYPES.PASSWORD_CHANGED,
      NOTIFICATION_TYPES.ACCOUNT_ACTIVATED,
      NOTIFICATION_TYPES.ACCOUNT_DEACTIVATED,
      NOTIFICATION_TYPES.LOGIN_ALERT,
    ],
    'Subscription & Payment': [
      NOTIFICATION_TYPES.SUBSCRIPTION_ACTIVATED,
      NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL_DUE,
      NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED,
      NOTIFICATION_TYPES.SUBSCRIPTION_UPGRADED,
      NOTIFICATION_TYPES.SUBSCRIPTION_DOWNGRADED,
      NOTIFICATION_TYPES.PAYMENT_RECEIVED,
      NOTIFICATION_TYPES.PAYMENT_FAILED,
    ],
    'Support Tickets': [
      NOTIFICATION_TYPES.NEW_SUPPORT_TICKET,
      NOTIFICATION_TYPES.TICKET_ASSIGNED,
      NOTIFICATION_TYPES.TICKET_STATUS_CHANGED,
      NOTIFICATION_TYPES.NEW_TICKET_MESSAGE,
      NOTIFICATION_TYPES.TICKET_RESOLVED,
      NOTIFICATION_TYPES.TICKET_CLOSED,
    ],
    'System & Admin': [
      NOTIFICATION_TYPES.SYSTEM_MAINTENANCE,
      NOTIFICATION_TYPES.SYSTEM_UPDATE,
      NOTIFICATION_TYPES.CONFIGURATION_CHANGED,
    ],
  };

  const formatTypeName = (type) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading || !localPreferences) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading preferences...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Global Notification Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">In-App Notifications</div>
                <div className="text-sm text-gray-500">Show notifications as toast messages</div>
              </div>
              <ToggleSwitch
                checked={localPreferences.in_app_enabled}
                onChange={(e) => handleGlobalToggle('in_app_enabled')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Email Notifications</div>
                <div className="text-sm text-gray-500">Send notifications via email</div>
              </div>
              <ToggleSwitch
                checked={localPreferences.email_enabled}
                onChange={(e) => handleGlobalToggle('email_enabled')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Desktop Notifications</div>
                <div className="text-sm text-gray-500">
                  Show browser desktop notifications
                  {desktopPermission === 'default' && (
                    <button
                      onClick={handleRequestDesktopPermission}
                      className="ml-2 text-primary-600 hover:text-primary-700 text-xs underline"
                    >
                      Request Permission
                    </button>
                  )}
                  {desktopPermission === 'denied' && (
                    <span className="ml-2 text-red-600 text-xs">Permission denied - enable in browser settings</span>
                  )}
                </div>
              </div>
              <ToggleSwitch
                checked={localPreferences.desktop_enabled && desktopPermission === 'granted'}
                onChange={(e) => handleGlobalToggle('desktop_enabled')}
                disabled={desktopPermission !== 'granted'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Sound Notifications</div>
                <div className="text-sm text-gray-500">Play sounds for notifications</div>
              </div>
              <ToggleSwitch
                checked={localPreferences.sound_enabled}
                onChange={(e) => handleGlobalToggle('sound_enabled')}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Type-Specific Settings */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Type Preferences</h2>
          <div className="space-y-6">
            {Object.entries(notificationGroups).map(([groupName, types]) => (
              <div key={groupName}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{groupName}</h3>
                <div className="space-y-3">
                  {types.map((type) => {
                    const config = getNotificationConfig(type);
                    const typePref = localPreferences.type_preferences?.[type] || {
                      in_app: true,
                      email: true,
                      desktop: true,
                      sound: true,
                    };
                    const isGlobalDisabled = {
                      in_app: !localPreferences.in_app_enabled,
                      email: !localPreferences.email_enabled,
                      desktop: !localPreferences.desktop_enabled || desktopPermission !== 'granted',
                      sound: !localPreferences.sound_enabled,
                    };

                    return (
                      <div key={type} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-lg">{config.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{formatTypeName(type)}</div>
                            <div className="text-xs text-gray-500">{config.category}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-gray-600 mb-1">In-App</div>
                            <ToggleSwitch
                              checked={typePref.in_app && !isGlobalDisabled.in_app}
                              onChange={(e) => handleTypeToggle(type, 'in_app')}
                              disabled={isGlobalDisabled.in_app}
                            />
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Email</div>
                            <ToggleSwitch
                              checked={typePref.email && !isGlobalDisabled.email}
                              onChange={(e) => handleTypeToggle(type, 'email')}
                              disabled={isGlobalDisabled.email}
                            />
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Desktop</div>
                            <ToggleSwitch
                              checked={typePref.desktop && !isGlobalDisabled.desktop}
                              onChange={(e) => handleTypeToggle(type, 'desktop')}
                              disabled={isGlobalDisabled.desktop}
                            />
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Sound</div>
                            <ToggleSwitch
                              checked={typePref.sound && !isGlobalDisabled.sound}
                              onChange={(e) => handleTypeToggle(type, 'sound')}
                              disabled={isGlobalDisabled.sound}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          {saving ? (
            <>
              <FiRefreshCw className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FiSave className="h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
