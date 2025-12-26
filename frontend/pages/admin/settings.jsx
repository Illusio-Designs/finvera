import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminLayout from '../../components/layouts/AdminLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Stepper from '../../components/ui/Stepper';
import FormInput from '../../components/forms/FormInput';
import { authAPI, adminAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiSettings, FiUser, FiLock, FiSave, FiArrowLeft, FiArrowRight } from 'react-icons/fi';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  
  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout>
        <PageLayout
          title="Admin Settings"
          icon={<FiSettings className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Edit Profile Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowEditProfile(true)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <FiUser className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Update your name, email, and phone number
                      </p>
                    </div>
                  </div>
                  {authUser && (
                    <div className="mt-4 text-sm text-gray-700">
                      <div className="font-medium">{authUser.name || authUser.full_name || 'Admin User'}</div>
                      <div className="text-gray-500">{authUser.email}</div>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <FiArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </Card>

            {/* Change Password Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowChangePassword(true)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FiLock className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Update your account password for better security
                      </p>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <FiArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Edit Profile Modal */}
          <EditProfileModal
            isOpen={showEditProfile}
            onClose={() => setShowEditProfile(false)}
            user={authUser}
            onSuccess={() => {
              setShowEditProfile(false);
              // Refresh will be handled by auth context update
            }}
          />

          {/* Change Password Modal */}
          <ChangePasswordModal
            isOpen={showChangePassword}
            onClose={() => setShowChangePassword(false)}
          />
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

// Edit Profile Modal with Stepper
function EditProfileModal({ isOpen, onClose, user, onSuccess }) {
  const { updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = [
    { label: 'Personal Info', description: 'Name and contact details' },
    { label: 'Email', description: 'Email address' },
  ];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setCurrentStep(0);
      setErrors({});
    }
  }, [user, isOpen]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 0) {
      if (!formData.name?.trim()) newErrors.name = 'Name is required';
      if (formData.phone && formData.phone.length > 15) {
        newErrors.phone = 'Phone number must be 15 characters or less';
      }
    }
    
    if (step === 1) {
      if (!formData.email?.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const response = await authAPI.updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
      });

      const updatedUser = response.data?.data?.user || response.data?.user || response.data;
      
      // Update auth context
      updateUser({
        name: updatedUser.name,
        email: updatedUser.email,
        full_name: updatedUser.name,
        phone: updatedUser.phone,
      });

      toast.success('Profile updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
      
      // Set specific field errors if provided
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="lg" closeOnClickOutside={false}>
      <div className="space-y-6">
        <Stepper steps={steps} currentStep={currentStep} />

        {/* Step 1: Personal Info */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <FormInput
              name="name"
              label="Full Name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
              placeholder="Enter your full name"
            />
            <FormInput
              name="phone"
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder="Enter your phone number"
            />
          </div>
        )}

        {/* Step 2: Email */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <FormInput
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              placeholder="Enter your email address"
            />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Your email address is used for login and notifications. Make sure it&apos;s valid and accessible.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? onClose : handlePrevious}
            disabled={loading}
          >
            <FiArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? 'Cancel' : 'Previous'}
          </Button>
          <div className="flex gap-3">
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} disabled={loading}>
                Next
                <FiArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                <FiSave className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Change Password Modal
function ChangePasswordModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword?.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword?.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword?.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Update password via auth API (supports current_password verification)
      await authAPI.updateProfile({
        password: formData.newPassword,
        current_password: formData.currentPassword,
      });

      toast.success('Password changed successfully. Please log in again.');
      onClose();
      
      // Logout user after password change for security
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 2000);
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password" size="md" closeOnClickOutside={false}>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            For security, please enter your current password and choose a strong new password.
          </p>
        </div>

        <FormInput
          name="currentPassword"
          label="Current Password"
          type="password"
          value={formData.currentPassword}
          onChange={handleChange}
          error={errors.currentPassword}
          required
          placeholder="Enter your current password"
        />

        <FormInput
          name="newPassword"
          label="New Password"
          type="password"
          value={formData.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          required
          placeholder="Enter new password (min 8 characters)"
          helperText="Password must be at least 8 characters long"
        />

        <FormInput
          name="confirmPassword"
          label="Confirm New Password"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
          placeholder="Confirm your new password"
        />

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <FiSave className="h-4 w-4 mr-2" />
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
