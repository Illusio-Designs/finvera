import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const path = router.pathname;
      if (path.startsWith('/admin')) {
        router.push('/admin/login');
      } else if (path.startsWith('/client')) {
        router.push('/client/login');
      } else {
        router.push('/');
      }
    }

    if (!loading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      router.push('/');
    }
  }, [loading, isAuthenticated, user, router, requiredRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return children;
}

