import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessAdminPortal, getDefaultRedirect, getRoleDisplayName } from '../../lib/roleConfig';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { FiLock, FiMail } from 'react-icons/fi';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
          toast.success(`Welcome ${getRoleDisplayName(role)}!`);
          const redirectPath = getDefaultRedirect(role, result.user.id);
          console.log('Redirecting to:', redirectPath);
          // Redirect after a short delay to show success message
          setTimeout(() => {
            router.replace(redirectPath);
          }, 500);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster />
      <Card className="max-w-md w-full shadow-xl border border-gray-200">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4">
            <FiLock className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the admin panel
          </p>
        </div>
        <form 
          className="space-y-6" 
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              autoComplete="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

