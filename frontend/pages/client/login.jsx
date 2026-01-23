import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessClientPortal, getDefaultRedirect, getRoleDisplayName } from '../../lib/roleConfig';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import Cookies from 'js-cookie';
import FormInput from '../../components/forms/FormInput';
import FormPasswordInput from '../../components/forms/FormPasswordInput';
import FormSelect from '../../components/forms/FormSelect';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ElectronWindowControls from '../../components/electron/ElectronWindowControls';

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
          // Check if user has a company - if not, redirect to company creation
          if (!result.user?.company_id) {
            console.log('User does not have company_id, redirecting to company creation');
            console.log('User data:', result.user);
            console.log('Token stored:', !!Cookies.get('token'));
            setLoading(false);
            // Wait 2 seconds to see logs, then redirect
            toast.success('Login successful! Redirecting to company creation...');
            setTimeout(() => {
              window.location.href = '/client/companies';
            }, 2000);
            return;
          }
          
          toast.success(`Welcome ${getRoleDisplayName(role)}!`);
          const redirectPath = getDefaultRedirect(role, result.user.id);
          console.log('Redirecting to:', redirectPath);
          console.log('User data:', result.user);
          console.log('Token stored:', !!Cookies.get('token'));
          
          // Wait 2 seconds to see logs, then redirect
          setTimeout(() => {
            router.replace(redirectPath);
          }, 2000);
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
        // Redirect to company creation after showing logs
        console.log('=== COMPANY CREATION NEEDED ===');
        console.log('Backend indicates company creation needed');
        console.log('Result object:', result);
        console.log('User data from result:', result.user);
        console.log('Token stored:', !!Cookies.get('token'));
        console.log('User cookie:', Cookies.get('user'));
        
        // If user data is provided in the result, it means tokens were set
        if (result.user) {
          console.log('User authenticated successfully, tokens stored');
        }
        
        setLoading(false);
        // Wait 2 seconds to see logs, then redirect
        toast.success('Login successful! Redirecting to company creation...');
        setTimeout(() => {
          console.log('Redirecting to company creation page now...');
          window.location.href = '/client/companies';
        }, 2000);
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
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Electron Window Controls */}
      <ElectronWindowControls className="fixed top-4 right-4 z-50" />
      
      <Toaster />
      <div className="max-w-md w-full">
        <Card className="p-6 max-h-[90vh] overflow-y-auto">
        <div>
          <h2 className="mt-4 text-center text-2xl font-extrabold text-gray-900">
            Client Login
          </h2>
          <p className="mt-1 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <FormInput
              name="email"
              label="Email address"
              type="email"
              autoComplete="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(name, value) => setEmail(value)}
            />

            <FormPasswordInput
              name="password"
              label="Password"
              autoComplete="current-password"
              required
              placeholder="Password"
              value={password}
              onChange={(name, value) => setPassword(value)}
            />
          </div>

          {companies.length > 0 && (
            <div>
              <FormSelect
                name="company"
                label="Select Company"
                value={selectedCompanyId}
                onChange={(name, value) => setSelectedCompanyId(value)}
                options={companies.map((c) => ({ value: c.id, label: c.company_name }))}
                placeholder="Choose a company..."
                required
              />
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
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              loading={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                window.location.href = `${apiUrl}/auth/google`;
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
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
        </Card>
      </div>
    </div>
  );
}

