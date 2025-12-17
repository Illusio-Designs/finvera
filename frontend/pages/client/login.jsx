import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessClientPortal, getDefaultRedirect, getRoleDisplayName } from '../../lib/roleConfig';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

export default function ClientLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password, 'client', selectedCompanyId || null);
      console.log('Login result:', result);
      
      if (result.success) {
        const role = result.user?.role;
        console.log('User role:', role);
        console.log('Can access client portal?', canAccessClientPortal(role));
        
        // Check if role can access client portal
        if (canAccessClientPortal(role)) {
          toast.success(`Welcome ${getRoleDisplayName(role)}!`);
          const redirectPath = getDefaultRedirect(role, result.user.id);
          console.log('Redirecting to:', redirectPath);
          
          // Use replace instead of push to avoid back button issues
          setTimeout(() => {
            router.replace(redirectPath);
          }, 500);
        } else {
          console.error('Access denied for role:', role);
          toast.error('Access denied. Please use the admin portal.');
          setLoading(false);
          return;
        }
      } else if (result.requireCompany) {
        setCompanies(result.companies || []);
        toast.error('Please select a company to continue');
        setLoading(false);
        return;
      } else if (result.needsCompanyCreation) {
        toast.error('Please create a company first');
        setTimeout(() => router.replace('/client/company/new'), 500);
        setLoading(false);
        return;
      } else {
        console.error('Login failed:', result.message);
        toast.error(result.message || 'Login failed');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login exception:', error);
      toast.error('An error occurred during login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster />
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Client Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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

          {companies.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Company</label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Choose a company...
                </option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                You’ll only be logged into the selected company.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/client/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </Link>
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

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/client/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Register
              </Link>
            </span>
          </div>

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

