/**
 * Unified Notification Service
 * 
 * Handles all notification operations:
 * - Global notifications (outside React components)
 * - Predefined notification messages
 * - Notification formatting and display
 * - Integration with NotificationContext
 */

// Global notification handler for use outside React components
let globalNotificationHandler = null;

/**
 * Set the global notification handler (typically from NotificationContext)
 * @param {Function} handler - Function to handle notifications
 */
export const setGlobalNotificationHandler = (handler) => {
  globalNotificationHandler = handler;
};

/**
 * Show a notification globally
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} options - Additional options (duration, actionText, onActionPress, etc.)
 */
export const showGlobalNotification = (type, title, message, options = {}) => {
  if (globalNotificationHandler) {
    globalNotificationHandler({
      type,
      title,
      message,
      ...options,
    });
  } else {
    // Fallback to console if no handler is set
    console.warn(`[${type.toUpperCase()}] ${title}: ${message}`);
  }
};

/**
 * Show an error notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} options - Additional options
 */
export const showGlobalError = (title, message, options = {}) => {
  showGlobalNotification('error', title, message, { duration: 5000, ...options });
};

/**
 * Show a success notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} options - Additional options
 */
export const showGlobalSuccess = (title, message, options = {}) => {
  showGlobalNotification('success', title, message, { duration: 4000, ...options });
};

/**
 * Show a warning notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} options - Additional options
 */
export const showGlobalWarning = (title, message, options = {}) => {
  showGlobalNotification('warning', title, message, { duration: 4500, ...options });
};

/**
 * Show an info notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} options - Additional options
 */
export const showGlobalInfo = (title, message, options = {}) => {
  showGlobalNotification('info', title, message, { duration: 4000, ...options });
};

/**
 * Show a notification with an action button
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} actionText - Action button text
 * @param {Function} onActionPress - Action button callback
 * @param {object} options - Additional options
 */
export const showNotificationWithAction = (type, title, message, actionText, onActionPress, options = {}) => {
  showGlobalNotification(type, title, message, {
    actionText,
    onActionPress,
    duration: 6000,
    ...options,
  });
};

/**
 * Show a persistent notification (no auto-hide)
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} options - Additional options
 */
export const showPersistentNotification = (type, title, message, options = {}) => {
  showGlobalNotification(type, title, message, { duration: 0, ...options });
};

/**
 * Predefined notification messages
 */
export const NOTIFICATION_MESSAGES = {
  // Success messages
  SUCCESS: {
    COMPANY_CREATED: {
      title: 'Success',
      message: 'Company created successfully!'
    },
    COMPANY_SWITCHED: {
      title: 'Success',
      message: 'Company switched successfully'
    },
    BRANCH_CREATED: {
      title: 'Success',
      message: 'Branch created successfully!'
    },
    PROFILE_UPDATED: {
      title: 'Success',
      message: 'Profile updated successfully'
    },
    DATA_SAVED: {
      title: 'Success',
      message: 'Data saved successfully'
    },
    INVOICE_CREATED: {
      title: 'Success',
      message: 'Invoice created successfully'
    },
    INVOICE_UPDATED: {
      title: 'Success',
      message: 'Invoice updated successfully'
    },
  },
  
  // Error messages
  ERROR: {
    NETWORK_ERROR: {
      title: 'Network Error',
      message: 'Please check your internet connection and try again'
    },
    VALIDATION_ERROR: {
      title: 'Validation Error',
      message: 'Please check the form and fix any errors'
    },
    COMPANY_SWITCH_FAILED: {
      title: 'Error',
      message: 'Failed to switch company'
    },
    COMPANY_CREATE_FAILED: {
      title: 'Error',
      message: 'Failed to create company'
    },
    BRANCH_CREATE_FAILED: {
      title: 'Error',
      message: 'Failed to create branch'
    },
    GENERIC_ERROR: {
      title: 'Error',
      message: 'Something went wrong. Please try again.'
    },
  },
  
  // Warning messages
  WARNING: {
    UNSAVED_CHANGES: {
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave?'
    },
    PLAN_LIMIT_REACHED: {
      title: 'Plan Limit Reached',
      message: 'You have reached your plan limit. Please upgrade to continue.'
    },
  },
  
  // Info messages
  INFO: {
    PAN_AUTO_FILLED: {
      title: 'PAN Auto-filled',
      message: 'PAN has been automatically extracted from GSTIN'
    },
    LOADING: {
      title: 'Loading',
      message: 'Please wait while we process your request'
    },
  },
};

/**
 * Show a predefined notification
 * @param {string} category - Category (SUCCESS, ERROR, WARNING, INFO)
 * @param {string} type - Message type within category
 * @param {object} options - Additional options to override defaults
 */
export const showPredefinedNotification = (category, type, options = {}) => {
  const message = NOTIFICATION_MESSAGES[category]?.[type];
  if (!message) {
    console.warn(`Notification message not found: ${category}.${type}`);
    return;
  }
  
  const notificationType = category.toLowerCase();
  showGlobalNotification(notificationType, message.title, message.message, options);
};

/**
 * Quick notification helpers for common use cases
 */
export const quickNotifications = {
  // Success notifications
  companySwitched: (options) => showPredefinedNotification('SUCCESS', 'COMPANY_SWITCHED', options),
  companyCreated: (options) => showPredefinedNotification('SUCCESS', 'COMPANY_CREATED', options),
  branchCreated: (options) => showPredefinedNotification('SUCCESS', 'BRANCH_CREATED', options),
  profileUpdated: (options) => showPredefinedNotification('SUCCESS', 'PROFILE_UPDATED', options),
  dataSaved: (options) => showPredefinedNotification('SUCCESS', 'DATA_SAVED', options),
  invoiceCreated: (options) => showPredefinedNotification('SUCCESS', 'INVOICE_CREATED', options),
  invoiceUpdated: (options) => showPredefinedNotification('SUCCESS', 'INVOICE_UPDATED', options),
  
  // Error notifications
  networkError: (options) => showPredefinedNotification('ERROR', 'NETWORK_ERROR', options),
  validationError: (options) => showPredefinedNotification('ERROR', 'VALIDATION_ERROR', options),
  companySwitchFailed: (options) => showPredefinedNotification('ERROR', 'COMPANY_SWITCH_FAILED', options),
  companyCreateFailed: (options) => showPredefinedNotification('ERROR', 'COMPANY_CREATE_FAILED', options),
  branchCreateFailed: (options) => showPredefinedNotification('ERROR', 'BRANCH_CREATE_FAILED', options),
  genericError: (options) => showPredefinedNotification('ERROR', 'GENERIC_ERROR', options),
  
  // Warning notifications
  unsavedChanges: (options) => showPredefinedNotification('WARNING', 'UNSAVED_CHANGES', options),
  planLimitReached: (options) => showPredefinedNotification('WARNING', 'PLAN_LIMIT_REACHED', options),
  
  // Info notifications
  panAutoFilled: (options) => showPredefinedNotification('INFO', 'PAN_AUTO_FILLED', options),
  loading: (options) => showPredefinedNotification('INFO', 'LOADING', options),
};

// Default export for backward compatibility
export default {
  setGlobalNotificationHandler,
  showGlobalNotification,
  showGlobalError,
  showGlobalSuccess,
  showGlobalWarning,
  showGlobalInfo,
  showNotificationWithAction,
  showPersistentNotification,
  showPredefinedNotification,
  quickNotifications,
  NOTIFICATION_MESSAGES,
};