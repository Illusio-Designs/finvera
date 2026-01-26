// Global notification service for use outside React components
let globalNotificationHandler = null;

export const setGlobalNotificationHandler = (handler) => {
  globalNotificationHandler = handler;
};

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

export const showGlobalError = (title, message, options = {}) => {
  showGlobalNotification('error', title, message, options);
};

export const showGlobalSuccess = (title, message, options = {}) => {
  showGlobalNotification('success', title, message, options);
};

export const showGlobalWarning = (title, message, options = {}) => {
  showGlobalNotification('warning', title, message, options);
};

export const showGlobalInfo = (title, message, options = {}) => {
  showGlobalNotification('info', title, message, options);
};