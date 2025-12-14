import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessAdminPortal, getDefaultRedirect, getRoleDisplayName } from '../../lib/roleConfig';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginData, setLoginData] = useState(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return; // Prevent double submission
    
    setLoading(true);

    try {
      console.log('Admin login attempt:', { email });
      const result = await login(email, password, 'admin');
      console.log('Login result:', result);
      
      if (result.success && result.user) {
        const role = result.user?.role;
        console.log('User role:', role);
        console.log('Full user data:', result.user);
        console.log('Login successful! Check console for details.');
        
        // Check if role can access admin portal
        if (canAccessAdminPortal(role)) {
          toast.success(`Welcome ${getRoleDisplayName(role)}! Login successful - check console for details.`);
          setLoginSuccess(true);
          setLoginData({
            user: result.user,
            role: role,
            redirectPath: getDefaultRedirect(role, result.user.id)
          });
          // TEMPORARILY DISABLED AUTO-REDIRECT - Uncomment below to enable
          // const redirectPath = getDefaultRedirect(role, result.user.id);
          // console.log('Redirecting to:', redirectPath);
          // router.replace(redirectPath);
        } else {
          toast.error('Access denied. Please use the client portal.');
          setLoading(false);
        }
      } else {
        const errorMsg = result.message || 'Login failed. Please check your credentials.';
        console.error('Login failed:', errorMsg);
        console.error('Full error details:', result);
        toast.error(errorMsg);
        setLoading(false);
      }
    } catch (error) {
      console.error('Login exception:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      toast.error(error.message || 'An error occurred during login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster />
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the admin panel
          </p>
        </div>
        <form 
          className="mt-8 space-y-6" 
          onSubmit={handleSubmit}
        >
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {loginSuccess && loginData && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 font-medium mb-2">
                ✅ Login Successful! Check browser console for details.
              </p>
              <div className="text-xs text-green-700 mb-3 space-y-1">
                <p><strong>Role:</strong> {loginData.role}</p>
                <p><strong>Email:</strong> {loginData.user.email}</p>
                <p><strong>User ID:</strong> {loginData.user.id}</p>
                <p><strong>Will redirect to:</strong> {loginData.redirectPath}</p>
              </div>
              <button
                onClick={() => {
                  console.log('Manual redirect to:', loginData.redirectPath);
                  router.replace(loginData.redirectPath);
                }}
                className="w-full py-2 px-4 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition"
              >
                Continue to Dashboard
              </button>
            </div>
          )}

          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

