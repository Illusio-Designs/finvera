import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { initializeEssentialPermissions } from '../../utils/permissions';
import { useNotificationPermissions } from '../../hooks/usePermissions';

const PermissionsContext = createContext({});

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider');
  }
  return context;
};

export default function PermissionsProvider({ children }) {
  const [permissionsInitialized, setPermissionsInitialized] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const { requestNotificationAccess } = useNotificationPermissions();

  // Initialize essential permissions on app start
  useEffect(() => {
    const initializePermissions = async () => {
      try {
        console.log('Initializing app permissions...');
        
        // Initialize essential permissions
        const results = await initializeEssentialPermissions();
        
        console.log('Permission initialization results:', results);
        
        // Request notification permission specifically for better UX
        await requestNotificationAccess(false); // Don't show rationale for notifications
        
        setPermissionsInitialized(true);
      } catch (error) {
        console.error('Error initializing permissions:', error);
        setPermissionsInitialized(true); // Still mark as initialized to prevent blocking
      }
    };

    initializePermissions();
  }, [requestNotificationAccess]);

  // Handle app state changes to re-check permissions
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground - could re-check critical permissions here
        console.log('App has come to the foreground');
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [appState]);

  const contextValue = {
    permissionsInitialized,
    appState,
  };

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
}