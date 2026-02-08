import React, { createContext, useContext, useState, useEffect } from 'react';
import SettingsService from '../services/invoice/SettingsService';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // Load settings only when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('✅ User authenticated, loading company settings...');
      loadSettings();
    } else {
      // Clear settings when user logs out
      console.log('🔓 User logged out, clearing settings...');
      setSettings(null);
      setError(null);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    if (!isAuthenticated) {
      // Skip loading if not authenticated
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const companySettings = await SettingsService.getCompanySettings();
      setSettings(companySettings);
    } catch (err) {
      const errorMessage = err.message || 'Failed to load company settings';
      console.error('Settings load error:', errorMessage);
      setError(errorMessage);
      // Don't throw - allow app to continue without settings
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = async () => {
    if (!isAuthenticated) {
      console.warn('Cannot refresh settings: User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const companySettings = await SettingsService.refreshSettings();
      setSettings(companySettings);
      return companySettings;
    } catch (err) {
      const errorMessage = err.message || 'Failed to refresh company settings';
      console.error('Settings refresh error:', errorMessage);
      setError(errorMessage);
      // Don't throw - allow app to continue
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Convenience getters for feature flags
  const eInvoiceEnabled = settings?.eInvoiceEnabled || false;
  const eWayBillEnabled = settings?.eWayBillEnabled || false;
  const tdsEnabled = settings?.tdsEnabled || false;

  const value = {
    settings,
    loading,
    error,
    refreshSettings,
    // Feature flags
    eInvoiceEnabled,
    eWayBillEnabled,
    tdsEnabled,
    // Settings properties
    eInvoiceThreshold: settings?.eInvoiceThreshold || 0,
    eWayBillThreshold: settings?.eWayBillThreshold || 50000,
    autoGenerateEInvoice: settings?.autoGenerateEInvoice || false,
    autoGenerateEWayBill: settings?.autoGenerateEWayBill || false,
    defaultTDSSection: settings?.defaultTDSSection || null,
    companyId: settings?.companyId || null,
    companyName: settings?.companyName || '',
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
