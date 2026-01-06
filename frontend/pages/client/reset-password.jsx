import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import FormInput from '../../components/forms/FormInput';
import FormPasswordInput from '../../components/forms/FormPasswordInput';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { authAPI } from '../../lib/api';

export default function ResetPassword() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const [passwordReset, setPasswordReset] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get token from URL query
    const { token: urlToken } = router.query;
    if (urlToken) {
      setToken(urlToken);
      verifyToken(urlToken);
    } else {
      setVerifying(false);
    }
  }, [router.query]);

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await authAPI.verifyResetToken(tokenToVerify);
      if (response.data?.success) {
        setTokenValid(true);
        setEmail(response.data?.data?.email || '');
      } else {
        setTokenValid(false);
        toast.error(response.data?.error || 'Invalid or expired reset token');
      }
    } catch (error) {
      setTokenValid(false);
      const errorMessage = error.response?.data?.error || 
                          'Invalid or expired reset token';
      toast.error(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword({ token, password });
      
      if (response.data?.success) {
        toast.success('Password reset successfully! Redirecting to login...');
        setPasswordReset(true);
        setTimeout(() => {
          router.push('/client/login');
        }, 2000);
      } else {
        toast.error(response.data?.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to reset password. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <Toaster />
        <Card className="p-6 max-h-[90vh] overflow-y-auto">
          <div className="text-center">
            <p className="text-gray-600">Verifying reset token...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <Toaster />
        <div className="max-w-md w-full">
          <Card className="p-6 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="mt-4 text-center text-2xl font-extrabold text-gray-900">
                Invalid Reset Link
              </h2>
              <p className="mt-1 text-center text-sm text-gray-600">
                This password reset link is invalid or has expired.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  The reset link may have expired (links expire after 1 hour) or may have already been used.
                </p>
              </div>

              <div className="text-center space-y-2">
                <Link
                  href="/client/forgot-password"
                  className="block"
                >
                  <Button className="w-full">
                    Request New Reset Link
                  </Button>
                </Link>
                <Link
                  href="/client/login"
                  className="block text-sm font-medium text-primary-600 hover:text-primary-500 mt-4"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <Toaster />
        <div className="max-w-md w-full">
          <Card className="p-6 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="mt-4 text-center text-2xl font-extrabold text-gray-900">
                Password Reset Successful
              </h2>
              <p className="mt-1 text-center text-sm text-gray-600">
                Your password has been reset successfully. Redirecting to login...
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <Toaster />
      <div className="max-w-md w-full">
        <Card className="p-6 max-h-[90vh] overflow-y-auto">
          <div>
            <h2 className="mt-4 text-center text-2xl font-extrabold text-gray-900">
              Reset Password
            </h2>
            <p className="mt-1 text-center text-sm text-gray-600">
              {email && `Enter a new password for ${email}`}
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <FormPasswordInput
                name="password"
                label="New Password"
                autoComplete="new-password"
                required
                placeholder="Enter your new password"
                value={password}
                onChange={(name, value) => setPassword(value)}
              />

              <FormPasswordInput
                name="confirmPassword"
                label="Confirm Password"
                autoComplete="new-password"
                required
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(name, value) => setConfirmPassword(value)}
              />

              <p className="text-xs text-gray-500">
                Password must be at least 8 characters long.
              </p>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full"
                loading={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>

            <div className="text-center">
              <Link
                href="/client/login"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

