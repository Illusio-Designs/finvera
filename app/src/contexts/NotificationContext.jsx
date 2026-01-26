import React, { createContext, useContext, useState, useEffect } from 'react';
import CustomNotification from '../components/ui/CustomNotification';
import { setGlobalNotificationHandler } from '../services/globalNotificationService';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    duration: 4000,
    actionText: null,
    onActionPress: null,
  });

  const showNotification = ({
    type = 'info',
    title,
    message,
    duration = 4000,
    actionText = null,
    onActionPress = null,
  }) => {
    setNotification({
      visible: true,
      type,
      title,
      message,
      duration,
      actionText,
      onActionPress,
    });
  };

  // Register global notification handler
  useEffect(() => {
    setGlobalNotificationHandler(showNotification);
    return () => setGlobalNotificationHandler(null);
  }, []);

  const hideNotification = () => {
    setNotification(prev => ({
      ...prev,
      visible: false,
    }));
  };

  // Convenience methods for different notification types
  const showSuccess = (title, message, options = {}) => {
    showNotification({
      type: 'success',
      title,
      message,
      ...options,
    });
  };

  const showError = (title, message, options = {}) => {
    showNotification({
      type: 'error',
      title,
      message,
      ...options,
    });
  };

  const showWarning = (title, message, options = {}) => {
    showNotification({
      type: 'warning',
      title,
      message,
      ...options,
    });
  };

  const showInfo = (title, message, options = {}) => {
    showNotification({
      type: 'info',
      title,
      message,
      ...options,
    });
  };

  const value = {
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <CustomNotification
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        duration={notification.duration}
        actionText={notification.actionText}
        onActionPress={notification.onActionPress}
        onHide={hideNotification}
      />
    </NotificationContext.Provider>
  );
};