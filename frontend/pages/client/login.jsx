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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster />
      <div className="max-w-md w-full space-y-8">
        <Card className="p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Client Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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

