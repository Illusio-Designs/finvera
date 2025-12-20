import { Toaster, toast } from 'react-hot-toast';
import { getNotificationConfig } from '../../lib/notificationConfig';

export function ToastViewport() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
          maxWidth: '420px',
        },
        success: {
          duration: 4000,
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
        loading: {
          iconTheme: {
            primary: '#3b82f6',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}

/**
 * Client-side notification service
 * Provides a centralized way to show toast notifications
 */
export const notify = {
  /**
   * Show a success notification
   * @param {string} message - The message to display
   * @param {object} options - Additional toast options
   */
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: options.duration || 4000,
      ...options,
    });
  },

  /**
   * Show an error notification
   * @param {string} message - The error message to display
   * @param {object} options - Additional toast options
   */
  error: (message, options = {}) => {
    return toast.error(message, {
      duration: options.duration || 5000,
      ...options,
    });
  },

  /**
   * Show an info notification
   * @param {string} message - The info message to display
   * @param {object} options - Additional toast options
   */
  info: (message, options = {}) => {
    return toast(message, {
      icon: 'ℹ️',
      duration: options.duration || 4000,
      ...options,
    });
  },

  /**
   * Show a warning notification
   * @param {string} message - The warning message to display
   * @param {object} options - Additional toast options
   */
  warning: (message, options = {}) => {
    return toast(message, {
      icon: '⚠️',
      duration: options.duration || 4000,
      style: {
        ...options.style,
        border: '1px solid #f59e0b',
      },
      ...options,
    });
  },

  /**
   * Show a loading notification
   * @param {string} message - The loading message to display
   * @param {object} options - Additional toast options
   * @returns {string} - Toast ID that can be used to update/dismiss
   */
  loading: (message, options = {}) => {
    return toast.loading(message, options);
  },

  /**
   * Show a promise-based notification
   * Automatically shows loading, then success/error based on promise resolution
   * @param {Promise} promise - The promise to track
   * @param {object} messages - Object with loading, success, and error messages
   * @param {object} options - Additional toast options
   */
  promise: (promise, messages, options = {}) => {
    return toast.promise(promise, messages, options);
  },

  /**
   * Dismiss a specific notification by ID
   * @param {string} toastId - The ID of the toast to dismiss
   */
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all notifications
   */
  dismissAll: () => {
    toast.dismiss();
  },

  /**
   * Update an existing notification
   * @param {string} toastId - The ID of the toast to update
   * @param {object} options - New options for the toast
   */
  update: (toastId, options) => {
    toast.success(options.message || '', { id: toastId, ...options });
  },

  /**
   * Show a notification based on notification type from backend
   * Uses notification config for styling, icons, and duration
   * @param {Object} notification - Notification object with type, title, message
   * @param {Object} options - Additional options
   */
  showNotification: (notification, options = {}) => {
    const config = getNotificationConfig(notification.type);
    const { title, message } = notification;
    const displayMessage = title ? `${title}\n${message}` : message;

    const toastOptions = {
      duration: config.duration || 4000,
      icon: config.icon || 'ℹ️',
      style: {
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '14px',
        maxWidth: '420px',
        border: `1px solid ${config.borderColor}`,
        backgroundColor: config.bgColor || '#fff',
        color: config.color || '#000',
      },
      ...options,
    };

    // Use appropriate toast method based on category
    switch (config.category) {
      case 'success':
        return toast.success(displayMessage, toastOptions);
      case 'error':
        return toast.error(displayMessage, toastOptions);
      case 'warning':
        return toast(displayMessage, {
          ...toastOptions,
          icon: config.icon || '⚠️',
        });
      default:
        return toast(displayMessage, toastOptions);
    }
  },
};
