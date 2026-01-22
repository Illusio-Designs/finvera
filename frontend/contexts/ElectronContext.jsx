import { createContext, useContext, useState, useEffect } from 'react';

const ElectronContext = createContext();

export const useElectron = () => {
  const context = useContext(ElectronContext);
  if (!context) {
    throw new Error('useElectron must be used within an ElectronProvider');
  }
  return context;
};

export const ElectronProvider = ({ children }) => {
  const [isElectron, setIsElectron] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [isOnline, setIsOnline] = useState(true);
  const [windowState, setWindowState] = useState({
    isMaximized: false,
    isMinimized: false,
    isFocused: true
  });

  useEffect(() => {
    // Detect Electron environment
    const electronDetected = typeof window !== 'undefined' && window.electronAPI;
    setIsElectron(electronDetected);

    if (electronDetected) {
      // Get app version
      if (window.electronAPI.getVersion) {
        window.electronAPI.getVersion().then(setAppVersion);
      }

      // Monitor online/offline status
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Monitor window focus
      const handleFocus = () => setWindowState(prev => ({ ...prev, isFocused: true }));
      const handleBlur = () => setWindowState(prev => ({ ...prev, isFocused: false }));
      
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
      };
    }
  }, []);

  const electronAPI = {
    // Window controls
    minimize: () => window.electronAPI?.minimize?.(),
    maximize: () => window.electronAPI?.maximize?.(),
    close: () => window.electronAPI?.close?.(),
    
    // Navigation
    navigateTo: (path) => window.electronAPI?.navigateTo?.(path),
    
    // File operations
    selectFile: () => window.electronAPI?.selectFile?.(),
    
    // Notifications
    showNotification: (title, body) => window.electronAPI?.showNotification?.(title, body),
    
    // App info
    getVersion: () => window.electronAPI?.getVersion?.(),
  };

  const value = {
    isElectron,
    appVersion,
    isOnline,
    windowState,
    electronAPI,
    
    // Utility functions
    isDesktop: () => isElectron,
    canUseNativeFeatures: () => isElectron,
    
    // Settings
    preferences: {
      theme: 'light', // Could be extended to support themes
      notifications: true,
      autoSave: true,
    }
  };

  return (
    <ElectronContext.Provider value={value}>
      {children}
    </ElectronContext.Provider>
  );
};