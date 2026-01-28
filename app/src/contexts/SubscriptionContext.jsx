import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscriptionAPI } from '../lib/api';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  const fetchSubscription = async () => {
    if (!isAuthenticated || !user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await subscriptionAPI.getCurrentSubscription();
      setSubscription(response.data.subscription);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      setError(err.message);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [isAuthenticated, user]);

  // Helper functions to check subscription features
  const hasMultiCompanyAccess = () => {
    if (!subscription) return false;
    return subscription.plan_type === 'multi-company' && subscription.max_companies > 1;
  };

  const hasMultiBranchAccess = () => {
    if (!subscription) return false;
    return subscription.plan_type === 'multi-branch' && subscription.max_branches > 1;
  };

  const canCreateCompany = () => {
    if (!subscription) return false;
    return hasMultiCompanyAccess();
  };

  const canCreateBranch = () => {
    if (!subscription) return false;
    return hasMultiBranchAccess();
  };

  const getMaxCompanies = () => {
    return subscription?.max_companies || 1;
  };

  const getMaxBranches = () => {
    return subscription?.max_branches || 1;
  };

  const getPlanType = () => {
    return subscription?.plan_type || 'multi-company';
  };

  const getPlanName = () => {
    return subscription?.plan_name || 'Basic Plan';
  };

  const isActive = () => {
    return subscription?.status === 'active';
  };

  const value = {
    subscription,
    loading,
    error,
    fetchSubscription,
    hasMultiCompanyAccess,
    hasMultiBranchAccess,
    canCreateCompany,
    canCreateBranch,
    getMaxCompanies,
    getMaxBranches,
    getPlanType,
    getPlanName,
    isActive,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};