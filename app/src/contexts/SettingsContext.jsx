import React, { createContext, useContext, useState, useEffect } from 'react';
import SettingsService from '../services/invoice/SettingsService';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const companySettings = await SettingsService.getCompanySettings();
      setSettings(companySettings);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const companySettings = await SettingsService.refreshSettings();
      setSettings(companySettings);
      return companySettings;
    } catch (err) {
      console.error('Error refreshing settings:', err);
      setError(err.message || 'Failed to refresh settings');
      throw err;
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
