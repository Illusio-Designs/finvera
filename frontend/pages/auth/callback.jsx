import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessAdminPortal, canAccessClientPortal, getDefaultRedirect } from '../../lib/roleConfig';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { token, refreshToken, jti, error: errorParam, needsCompany } = router.query;

        if (errorParam) {
          setError(errorParam);
          toast.error('Authentication failed. Please try again.');
          setTimeout(() => {
            router.push('/');
          }, 2000);
          return;
        }

        if (!token) {
          setError('No token received');
          toast.error('Authentication failed. No token received.');
          setTimeout(() => {
            router.push('/');
          }, 2000);
          return;
        }

        // Store tokens in cookies
        const cookieOptions = { 
          expires: 7,
          sameSite: 'lax'
        };
        
        Cookies.set('token', token, cookieOptions);
        if (refreshToken) {
          Cookies.set('refreshToken', refreshToken, { ...cookieOptions, expires: 30 });
        }
        if (jti) {
          Cookies.set('jti', jti, cookieOptions);
        }

        // Fetch user profile to get full user data
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const profileData = await response.json();
            const userData = profileData.data || profileData;
            
            // Normalize user data
            const normalizedUser = {
              ...userData,
              name: userData.name || userData.full_name || userData.email?.split('@')[0] || 'User',
              full_name: userData.full_name || userData.name || userData.email?.split('@')[0] || 'User',
            };

            // Store user data in cookie
            Cookies.set('user', JSON.stringify(normalizedUser), cookieOptions);
            if (normalizedUser.company_id) {
              Cookies.set('companyId', normalizedUser.company_id, cookieOptions);
            }

            // Update auth context
            updateUser(normalizedUser);

            // Determine redirect based on role
            const role = normalizedUser.role;
            let redirectPath = '/';

            // Check if user needs to create a company
            if (needsCompany === 'true' || !normalizedUser.company_id) {
              toast.success('Welcome! Please create your company to continue.');
              
              // Check if we need to redirect to a different subdomain
              const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'finvera.solutions';
              const currentHost = window.location.hostname;
              const targetHost = `client.${mainDomain}`;
              
              setTimeout(() => {
                // If we're on the main domain and need to go to client subdomain
                if (currentHost === mainDomain && targetHost !== currentHost) {
                  // Redirect to client subdomain
                  window.location.href = `${window.location.protocol}//${targetHost}/client/companies`;
                } else {
                  // Stay on current domain
                  router.replace('/client/companies');
                }
              }, 500);
              return;
            }

            // Get target subdomain based on role
            const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'finvera.solutions';
            const currentHost = window.location.hostname;
            let targetHost = currentHost;
            
            if (canAccessAdminPortal(role)) {
              redirectPath = getDefaultRedirect(role, normalizedUser.id);
              targetHost = `admin.${mainDomain}`;
            } else if (canAccessClientPortal(role)) {
              redirectPath = getDefaultRedirect(role, normalizedUser.id);
              targetHost = `client.${mainDomain}`;
            }

            toast.success('Login successful!');
            setTimeout(() => {
              // If we need to redirect to a different subdomain
              if (targetHost !== currentHost && targetHost.includes('.')) {
                window.location.href = `${window.location.protocol}//${targetHost}${redirectPath}`;
              } else {
                router.replace(redirectPath);
              }
            }, 500);
          } else {
            throw new Error('Failed to fetch user profile');
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          // Even if profile fetch fails, we can still try to use token
          // User will be redirected and can retry
          toast.error('Login successful but profile fetch failed. Redirecting...');
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError(err.message);
        toast.error('Authentication failed. Please try again.');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router.isReady, router.query, updateUser, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-4">Authentication Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}
