import { useState } from 'react';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import FormInput from '../../components/forms/FormInput';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { authAPI } from '../../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword({ email });
      
      if (response.data?.success || response.data?.message) {
        toast.success(response.data?.message || 'Password reset link sent to your email');
        setEmailSent(true);
      } else {
        toast.error(response.data?.error || 'Failed to send reset link');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to send password reset link. Please try again.';
      toast.error(errorMessage);
    } finally {
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
              Forgot Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {emailSent 
                ? 'Check your email for password reset instructions' 
                : 'Enter your email address and we\'ll send you a link to reset your password'}
            </p>
          </div>

          {!emailSent ? (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <FormInput
                  name="email"
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(name, value) => setEmail(value)}
                />
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full"
                  loading={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
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
          ) : (
            <div className="mt-8 space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  We&apos;ve sent a password reset link to <strong>{email}</strong>. 
                  Please check your email and follow the instructions to reset your password.
                </p>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Didn&apos;t receive the email? Check your spam folder or try again.
                </p>
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  className="w-full px-5 py-2.5 text-sm font-normal rounded-lg bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 hover:border-primary-700 hover:text-primary-700 transition-all"
                >
                  Try Again
                </button>
                <Link
                  href="/client/login"
                  className="block text-sm font-medium text-primary-600 hover:text-primary-500 mt-4"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Back to Home
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

