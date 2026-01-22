import { useRouter } from 'next/router';
import { useEffect } from 'react';

const ElectronClientRouter = ({ children }) => {
  const router = useRouter();

  useEffect(() => {
    // Check if we're in Electron environment
    const isElectron = typeof window !== 'undefined' && window.electronAPI;
    
    if (isElectron) {
      console.log('🔍 ElectronClientRouter - Current path:', router.pathname);
      
      // List of blocked paths
      const blockedPaths = [
        '/', '/index',
        '/admin', '/about', '/contact', '/features', '/pricing',
        '/plans', '/use-cases', '/help', '/docs', '/privacy', '/terms'
      ];
      
      // Check if current path is blocked
      const isBlocked = blockedPaths.some(blocked => 
        router.pathname === blocked || 
        (blocked !== '/' && router.pathname.startsWith(blocked))
      );
      
      // Redirect to client login if on blocked route
      if (isBlocked) {
        console.log('🚫 Blocked route detected, redirecting to client login');
        router.replace('/client/login');
        return;
      }
      
      // Redirect to client login if not on client route (except auth callback)
      if (!router.pathname.startsWith('/client') && router.pathname !== '/auth/callback') {
        console.log('🚫 Non-client route detected, redirecting to client login');
        router.replace('/client/login');
        return;
      }

      // Prevent navigation to blocked routes
      const handleRouteChange = (url) => {
        console.log('🔍 Route change attempt:', url);
        
        const isBlockedUrl = blockedPaths.some(blocked => 
          url === blocked || 
          (blocked !== '/' && url.startsWith(blocked))
        );
        
        // Block all non-client routes except auth callback
        if (isBlockedUrl || (!url.startsWith('/client') && url !== '/auth/callback')) {
          console.log('🚫 Blocking navigation to:', url);
          // Prevent the navigation
          throw new Error('Navigation blocked');
        }
      };

      // Handle route change errors (when we throw error above)
      const handleRouteChangeError = (err, url) => {
        if (err.message === 'Navigation blocked') {
          console.log('🔄 Redirecting blocked navigation to client login');
          router.replace('/client/login');
        }
      };

      router.events.on('routeChangeStart', handleRouteChange);
      router.events.on('routeChangeError', handleRouteChangeError);

      return () => {
        router.events.off('routeChangeStart', handleRouteChange);
        router.events.off('routeChangeError', handleRouteChangeError);
      };
    }
  }, [router]);

  return children;
};

export default ElectronClientRouter;