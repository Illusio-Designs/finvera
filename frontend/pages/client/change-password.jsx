import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import { authAPI } from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import FormPasswordInput from '../../components/forms/FormPasswordInput';
import Button from '../../components/ui/Button';
import { FiLock, FiSave, FiArrowLeft } from 'react-icons/fi';

export default function ChangePassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.current_password) {
      newErrors.current_password = 'Current password is required';
    }

    if (!formData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = 'New password must be at least 6 characters long';
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your new password';
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (formData.current_password === formData.new_password) {
      newErrors.new_password = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      await authAPI.changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
      });

      toast.success('Password changed successfully');
      
      // Clear form
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });

      // Redirect to profile after a short delay
      setTimeout(() => {
        router.push('/client/profile');
      }, 2000);
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
      
      // Set specific field errors if provided
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Change Password">
        <Toaster />
        <PageLayout
          title="Change Password"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Profile', href: '/client/profile' },
            { label: 'Change Password' },
          ]}
        >
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FiLock className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
                  <p className="text-gray-600">Update your account password</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <FormPasswordInput
                  name="current_password"
                  label="Current Password"
                  value={formData.current_password}
                  onChange={handleInputChange}
                  error={errors.current_password}
                  touched={true}
                  required
                  placeholder="Enter your current password"
                />

                <FormPasswordInput
                  name="new_password"
                  label="New Password"
                  value={formData.new_password}
                  onChange={handleInputChange}
                  error={errors.new_password}
                  touched={true}
                  required
                  placeholder="Enter your new password"
                  showStrengthIndicator={true}
                />

                <FormPasswordInput
                  name="confirm_password"
                  label="Confirm New Password"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  error={errors.confirm_password}
                  touched={true}
                  required
                  placeholder="Confirm your new password"
                />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• At least 6 characters long</li>
                    <li>• Different from your current password</li>
                    <li>• Use a combination of letters, numbers, and symbols for better security</li>
                  </ul>
                </div>

                <div className="flex justify-between gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    <FiArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                  >
                    <FiSave className="h-4 w-4 mr-2" />
                    {loading ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}