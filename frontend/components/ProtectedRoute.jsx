import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { canAccessAdminPortal, canAccessClientPortal } from '../lib/roleConfig';
import Cookies from 'js-cookie';

export default function ProtectedRoute({ children, portalType = null }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [hasUserCookie, setHasUserCookie] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  // Set mounted state on client side only
  useEffect(() => {
    setMounted(true);
    // Check cookies only on client side
    if (typeof window !== 'undefined') {
      setHasToken(!!Cookies.get('token'));
      setHasUserCookie(!!Cookies.get('user'));
    }
  }, []);

  // Check subscription status for client portal users
  useEffect(() => {
    if (!mounted || !isAuthenticated || !user || portalType !== 'client') {
      // For non-client portal or unauthenticated users, mark subscription as checked
      if (mounted && portalType !== 'client') {
        setSubscriptionChecked(true);
      }
      return;
    }

    const checkSubscription = async () => {
      try {
        const { subscriptionAPI } = require('../lib/api');
        const response = await subscriptionAPI.getCurrent();
        const subscription = response.data?.subscription;
        
        // Check if subscription is active
        const isActive = subscription && ['active', 'authenticated', 'pending'].includes(subscription.status);
        setHasActiveSubscription(isActive);
        setSubscriptionChecked(true);
      } catch (error) {
        console.error('Error checking subscription:', error);
        // On error, assume no subscription (fail closed for subscription check)
        setHasActiveSubscription(false);
        setSubscriptionChecked(true);
      }
    };

    checkSubscription();
  }, [mounted, isAuthenticated, user, portalType]);

  useEffect(() => {
    // Don't run until mounted to avoid hydration mismatch
    if (!mounted) return;
    
    const currentPath = router.pathname;
    
    // Skip check for login and register pages - allow viewing even when authenticated
    // This allows users to see login success messages and console logs
    if (currentPath.includes('/login') || currentPath.includes('/register')) {
      if (!hasChecked) setHasChecked(true);
      return;
    }

    const isCompanyCreationPage = currentPath === '/client/companies';
    const isPricingPage = currentPath === '/pricing';
    const isPlansPage = currentPath === '/client/plans';
    const isSubscribePage = currentPath === '/client/subscribe';
    
    // If we have a token but auth is still loading, wait
    if (loading && hasToken) {
      return; // Wait for auth to finish loading
    }

    // Prevent running multiple times after loading is complete
    if (hasChecked && !loading) {
      return;
    }

    // Special handling for company creation page after login
    // If user has token in cookies but isAuthenticated is false (state not updated yet), allow access
    if (isCompanyCreationPage && hasToken && hasUserCookie) {
      // User just logged in, cookies are set, but state might not be updated yet
      // Allow access and mark as checked
      if (!hasChecked) {
        setHasChecked(true);
      }
      return;
    }

    // Not authenticated and no token - redirect to login
    if (!isAuthenticated && !hasToken) {
      if (currentPath.startsWith('/admin')) {
        router.replace('/admin/login');
      } else if (currentPath.startsWith('/client')) {
        router.replace('/client/login');
      } else {
        router.replace('/');
      }
      setHasChecked(true);
      return;
    }

    // Authenticated - check portal access
    if (isAuthenticated && user) {
      const userRole = user.role;
      
      // Check admin portal access
      if (portalType === 'admin' && !canAccessAdminPortal(userRole)) {
        console.error('Access denied: User role cannot access admin portal');
        const { getDefaultRedirect } = require('../lib/roleConfig');
        const redirectPath = getDefaultRedirect(userRole, user.id);
        router.replace(redirectPath);
        setHasChecked(true);
        return;
      }

      // Check client portal access
      if (portalType === 'client' && !canAccessClientPortal(userRole)) {
        console.error('Access denied: User role cannot access client portal');
        const { getDefaultRedirect } = require('../lib/roleConfig');
        const redirectPath = getDefaultRedirect(userRole, user.id);
        router.replace(redirectPath);
        setHasChecked(true);
        return;
      }

      // For client portal users, check subscription and company status
      if (portalType === 'client' && canAccessClientPortal(userRole)) {
        // Wait for subscription check to complete
        if (!subscriptionChecked) {
          return; // Wait for subscription check
        }

        const hasCompany = !!user.company_id;
        
        // Priority 1: Check subscription status (except on plans/subscribe pages)
        if (!hasActiveSubscription && !isPlansPage && !isSubscribePage) {
          console.log('User does not have active subscription, redirecting to plans page');
          router.replace('/client/plans');
          setHasChecked(true);
          return;
        }
        
        // Priority 2: If has subscription but no company, redirect to company creation
        if (hasActiveSubscription && !hasCompany && !isCompanyCreationPage) {
          console.log('User has subscription but no company, redirecting to company creation');
          router.replace('/client/companies');
          setHasChecked(true);
          return;
        }
      }
    }

    setHasChecked(true);
  }, [loading, isAuthenticated, user, router, portalType, hasChecked, mounted, hasToken, hasUserCookie, subscriptionChecked, hasActiveSubscription]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isCompanyCreationPage = router.pathname === '/client/companies';

  // Show loading spinner while checking
  if (loading || !hasChecked || (portalType === 'client' && isAuthenticated && !subscriptionChecked)) {
    // For company creation page, allow rendering if we have token and user cookie
    // This handles the case where user just logged in and is being redirected
    if (isCompanyCreationPage && hasToken && hasUserCookie) {
      return children;
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Not authenticated - but allow company creation page if token exists (just logged in)
  if (!isAuthenticated && !hasToken) {
    return null;
  }
  
  // Allow company creation page even if isAuthenticated is false but token exists
  // This handles the redirect from login page where state hasn't updated yet
  if (isCompanyCreationPage && hasToken && hasUserCookie && !isAuthenticated) {
    return children;
  }

  // Check portal access
  if (portalType === 'admin' && !canAccessAdminPortal(user?.role)) {
    return null;
  }

  if (portalType === 'client' && !canAccessClientPortal(user?.role)) {
    return null;
  }

  return children;
}

