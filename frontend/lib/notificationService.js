import { notify } from '../components/ui/Toast';
import { getNotificationConfig } from './notificationConfig';

/**
 * Notification Service
 * Helper functions for handling and displaying notifications
 */

/**
 * Display a notification as a toast
 * @param {Object} notification - Notification object from backend
 * @param {Object} options - Additional options
 */
export function displayNotification(notification, options = {}) {
  if (!notification || !notification.type) {
    console.warn('Invalid notification object:', notification);
    return;
  }

  return notify.showNotification(notification, options);
}

/**
 * Format notification message for display
 * @param {Object} notification - Notification object
 * @returns {Object} Formatted notification with display properties
 */
export function formatNotification(notification) {
  const config = getNotificationConfig(notification.type);
  
  return {
    ...notification,
    config,
    displayTitle: notification.title || 'Notification',
    displayMessage: notification.message || '',
    category: config.category,
    icon: config.icon,
    color: config.color,
    bgColor: config.bgColor,
    borderColor: config.borderColor,
    priority: notification.priority || config.priority || 'medium',
  };
}

/**
 * Get notification action URL based on type and metadata
 * @param {Object} notification - Notification object
 * @returns {string|null} Action URL or null
 */
export function getNotificationActionUrl(notification) {
  // If action_url is provided, use it
  if (notification.action_url) {
    return notification.action_url;
  }

  // Otherwise, determine based on type and metadata
  const { type, metadata } = notification;

  switch (type) {
    case 'user_profile_updated':
    case 'password_changed':
      return '/client/profile';
    
    case 'subscription_activated':
    case 'subscription_expired':
    case 'subscription_renewal_due':
    case 'subscription_upgraded':
    case 'subscription_downgraded':
    case 'payment_received':
    case 'payment_failed':
      return '/client/settings?tab=subscription';
    
    case 'new_support_ticket':
    case 'ticket_assigned':
    case 'ticket_status_changed':
    case 'new_ticket_message':
    case 'ticket_resolved':
    case 'ticket_closed':
      if (metadata?.ticket_id) {
        return `/client/support?ticket=${metadata.ticket_id}`;
      }
      return '/client/support';
    
    case 'system_maintenance':
    case 'system_update':
      return '/client/settings?tab=system';
    
    case 'new_user_added':
      return '/client/settings?tab=users';
    
    default:
      return null;
  }
}

/**
 * Check if notification should be displayed as toast
 * @param {Object} notification - Notification object
 * @returns {boolean} Whether to display as toast
 */
export function shouldDisplayAsToast(notification) {
  // Don't display if already read
  if (notification.is_read) {
    return false;
  }

  // Don't display if it's a low priority info notification
  const config = getNotificationConfig(notification.type);
  if (config.priority === 'low' && config.category === 'info') {
    return false;
  }

  return true;
}

/**
 * Process and display a new notification
 * @param {Object} notification - Notification object from backend
 * @param {Object} options - Display options
 */
export function processNotification(notification, options = {}) {
  const { autoToast = true } = options;

  if (!notification) return null;

  const formatted = formatNotification(notification);
  const actionUrl = getNotificationActionUrl(notification);

  // Display as toast if enabled and should display
  if (autoToast && shouldDisplayAsToast(notification)) {
    displayNotification(notification);
  }

  return {
    ...formatted,
    actionUrl,
  };
}

/**
 * Process multiple notifications
 * @param {Array} notifications - Array of notification objects
 * @param {Object} options - Display options
 * @returns {Array} Processed notifications
 */
export function processNotifications(notifications, options = {}) {
  if (!Array.isArray(notifications)) {
    return [];
  }

  return notifications.map((notification) => processNotification(notification, { ...options, autoToast: false }));
}
