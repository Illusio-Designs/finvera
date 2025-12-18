import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import FormInput from '../../components/forms/FormInput';
import FormPasswordInput from '../../components/forms/FormPasswordInput';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function ClientRegister() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    company_name: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Backend expects: email, password, company_name
      const registerData = {
        email: formData.email,
        password: formData.password,
        company_name: formData.company_name,
        full_name: formData.full_name, // Optional, will be set on user
      };

      const result = await register(registerData);
      
      if (result.success) {
        toast.success('Registration successful!');
        router.push('/client/dashboard');
      } else {
        toast.error(result.message || 'Registration failed');
      }
    } catch (error) {
      toast.error('An error occurred during registration');
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
              Create Account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign up for your Finvera account
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <FormInput
                name="full_name"
                label="Full Name"
                type="text"
                required
                placeholder="John Doe"
                value={formData.full_name}
                onChange={handleChange}
              />

              <FormInput
                name="company_name"
                label="Company Name"
                type="text"
                required
                placeholder="ABC Company"
                value={formData.company_name}
                onChange={handleChange}
              />

              <FormInput
                name="email"
                label="Email Address"
                type="email"
                autoComplete="email"
                required
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
              />

              <FormPasswordInput
                name="password"
                label="Password"
                autoComplete="new-password"
                required
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                loading={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </div>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/client/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Sign in
                </Link>
              </span>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

