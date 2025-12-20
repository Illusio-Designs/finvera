/**
 * Desktop Notification Service
 * Handles browser desktop notifications (Browser Notification API)
 */

let notificationPermission = null;

/**
 * Check if desktop notifications are supported
 */
export function isDesktopNotificationSupported() {
  return 'Notification' in window;
}

/**
 * Request permission for desktop notifications
 * @returns {Promise<boolean>} True if permission granted
 */
export async function requestNotificationPermission() {
  if (!isDesktopNotificationSupported()) {
    console.warn('Desktop notifications are not supported in this browser');
    return false;
  }

  try {
    if (Notification.permission === 'granted') {
      notificationPermission = 'granted';
      return true;
    }

    if (Notification.permission === 'denied') {
      notificationPermission = 'denied';
      return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Check current notification permission status
 */
export function getNotificationPermission() {
  if (!isDesktopNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Show desktop notification
 * @param {Object} notification - Notification object
 * @param {Function} onClick - Optional click handler
 */
export function showDesktopNotification(notification, onClick = null) {
  try {
    // Check if desktop notifications are enabled in preferences
    const desktopNotificationsEnabled =
      localStorage.getItem('desktopNotificationsEnabled') !== 'false';
    if (!desktopNotificationsEnabled) {
      return;
    }

    if (!isDesktopNotificationSupported()) {
      console.warn('Desktop notifications are not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const config = notification.config || {};
    const icon = notification.icon || '/favicon.ico';
    const badge = '/favicon.ico';

    const desktopNotification = new Notification(notification.title || 'New Notification', {
      body: notification.message || '',
      icon: icon,
      badge: badge,
      tag: notification.id, // Prevent duplicate notifications with same ID
      requireInteraction: config.priority === 'critical',
      silent: false,
      data: {
        notificationId: notification.id,
        actionUrl: notification.action_url || null,
      },
    });

    // Handle click event
    if (onClick) {
      desktopNotification.onclick = (event) => {
        event.preventDefault();
        onClick(notification);
        desktopNotification.close();
      };
    } else {
      desktopNotification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (notification.action_url) {
          window.open(notification.action_url, '_blank');
        }
        desktopNotification.close();
      };
    }

    // Auto-close after duration (default 5 seconds, max 10 seconds)
    const duration = Math.min((config.duration || 5000) / 1000, 10);
    setTimeout(() => {
      desktopNotification.close();
    }, duration * 1000);

    return desktopNotification;
  } catch (error) {
    console.error('Error showing desktop notification:', error);
  }
}

/**
 * Enable/disable desktop notifications
 */
export function setDesktopNotificationsEnabled(enabled) {
  localStorage.setItem('desktopNotificationsEnabled', enabled.toString());
  if (enabled) {
    requestNotificationPermission();
  }
}

/**
 * Check if desktop notifications are enabled
 */
export function areDesktopNotificationsEnabled() {
  return localStorage.getItem('desktopNotificationsEnabled') !== 'false';
}

/**
 * Initialize desktop notifications on page load
 */
export async function initDesktopNotifications() {
  if (!isDesktopNotificationSupported()) {
    return false;
  }

  // Check if user previously enabled desktop notifications
  const desktopNotificationsEnabled = areDesktopNotificationsEnabled();
  if (desktopNotificationsEnabled && Notification.permission === 'default') {
    // Request permission if user has enabled but not yet granted
    await requestNotificationPermission();
  }

  return Notification.permission === 'granted';
}
