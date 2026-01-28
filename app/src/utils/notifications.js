// Notification utility functions for consistent usage across the app

/**
 * Show a success notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} options - Additional options
 */
export const showSuccess = (title, message, options = {}) => ({
  type: 'success',
  title,
  message,
  duration: 4000,
  ...options,
});

/**
 * Show an error notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} options - Additional options
 */
export const showError = (title, message, options = {}) => ({
  type: 'error',
  title,
  message,
  duration: 5000, // Longer duration for errors
  ...options,
});

/**
 * Show a warning notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} options - Additional options
 */
export const showWarning = (title, message, options = {}) => ({
  type: 'warning',
  title,
  message,
  duration: 4500,
  ...options,
});

/**
 * Show an info notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} options - Additional options
 */
export const showInfo = (title, message, options = {}) => ({
  type: 'info',
  title,
  message,
  duration: 4000,
  ...options,
});

/**
 * Common notification messages
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
 * Helper function to create notification with predefined messages
 * @param {string} category - Category (SUCCESS, ERROR, WARNING, INFO)
 * @param {string} type - Message type within category
 * @param {object} options - Additional options to override defaults
 */
export const createNotification = (category, type, options = {}) => {
  const message = NOTIFICATION_MESSAGES[category]?.[type];
  if (!message) {
    console.warn(`Notification message not found: ${category}.${type}`);
    return null;
  }
  
  const notificationType = category.toLowerCase();
  return {
    type: notificationType,
    ...message,
    ...options,
  };
};

/**
 * Quick notification helpers for common use cases
 */
export const quickNotifications = {
  // Success notifications
  companySwitched: () => createNotification('SUCCESS', 'COMPANY_SWITCHED'),
  companyCreated: () => createNotification('SUCCESS', 'COMPANY_CREATED'),
  branchCreated: () => createNotification('SUCCESS', 'BRANCH_CREATED'),
  profileUpdated: () => createNotification('SUCCESS', 'PROFILE_UPDATED'),
  dataSaved: () => createNotification('SUCCESS', 'DATA_SAVED'),
  
  // Error notifications
  networkError: () => createNotification('ERROR', 'NETWORK_ERROR'),
  validationError: () => createNotification('ERROR', 'VALIDATION_ERROR'),
  companySwitchFailed: () => createNotification('ERROR', 'COMPANY_SWITCH_FAILED'),
  companyCreateFailed: () => createNotification('ERROR', 'COMPANY_CREATE_FAILED'),
  branchCreateFailed: () => createNotification('ERROR', 'BRANCH_CREATE_FAILED'),
  genericError: () => createNotification('ERROR', 'GENERIC_ERROR'),
  
  // Warning notifications
  unsavedChanges: () => createNotification('WARNING', 'UNSAVED_CHANGES'),
  planLimitReached: () => createNotification('WARNING', 'PLAN_LIMIT_REACHED'),
  
  // Info notifications
  panAutoFilled: () => createNotification('INFO', 'PAN_AUTO_FILLED'),
  loading: () => createNotification('INFO', 'LOADING'),
};

/**
 * Notification with custom action button
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} actionText - Action button text
 * @param {function} onActionPress - Action button callback
 * @param {object} options - Additional options
 */
export const showNotificationWithAction = (type, title, message, actionText, onActionPress, options = {}) => ({
  type,
  title,
  message,
  actionText,
  onActionPress,
  duration: 6000, // Longer duration for actionable notifications
  ...options,
});

/**
 * Persistent notification (no auto-hide)
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} options - Additional options
 */
export const showPersistentNotification = (type, title, message, options = {}) => ({
  type,
  title,
  message,
  duration: 0, // No auto-hide
  ...options,
});