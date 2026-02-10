import React, { createContext, useContext, useState } from 'react';
import CustomConfirmation from '../components/ui/CustomConfirmation';

const ConfirmationContext = createContext();

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

export const ConfirmationProvider = ({ children }) => {
  const [confirmation, setConfirmation] = useState({
    visible: false,
    type: 'warning',
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null,
  });

  const showConfirmation = ({
    type = 'warning',
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
  }) => {
    return new Promise((resolve) => {
      setConfirmation({
        visible: true,
        type,
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => {
          hideConfirmation();
          if (onConfirm) onConfirm();
          resolve(true);
        },
        onCancel: () => {
          hideConfirmation();
          if (onCancel) onCancel();
          resolve(false);
        },
      });
    });
  };

  const hideConfirmation = () => {
    setConfirmation(prev => ({
      ...prev,
      visible: false,
    }));
  };

  // Convenience methods for different confirmation types
  const showDangerConfirmation = (title, message, options = {}) => {
    return showConfirmation({
      type: 'danger',
      title,
      message,
      confirmText: 'Delete',
      ...options,
    });
  };

  const showWarningConfirmation = (title, message, options = {}) => {
    return showConfirmation({
      type: 'warning',
      title,
      message,
      ...options,
    });
  };

  const showInfoConfirmation = (title, message, options = {}) => {
    return showConfirmation({
      type: 'info',
      title,
      message,
      ...options,
    });
  };

  const value = {
    showConfirmation,
    showDangerConfirmation,
    showWarningConfirmation,
    showInfoConfirmation,
  };

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      <CustomConfirmation
        visible={confirmation.visible}
        type={confirmation.type}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        onConfirm={confirmation.onConfirm}
        onCancel={confirmation.onCancel}
      />
    </ConfirmationContext.Provider>
  );
};
