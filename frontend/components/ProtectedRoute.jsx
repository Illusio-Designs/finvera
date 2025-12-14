import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { canAccessAdminPortal, canAccessClientPortal } from '../lib/roleConfig';

export default function ProtectedRoute({ children, portalType = null }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Prevent running multiple times
    if (loading || hasChecked) {
      return;
    }

    const currentPath = router.pathname;
    
    // Skip check for login and register pages - allow viewing even when authenticated
    // This allows users to see login success messages and console logs
    if (currentPath.includes('/login') || currentPath.includes('/register')) {
      setHasChecked(true);
      return;
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
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
    }

    setHasChecked(true);
  }, [loading, isAuthenticated, user, router.pathname, portalType, hasChecked]);

  // Show loading spinner while checking
  if (loading || !hasChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
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

