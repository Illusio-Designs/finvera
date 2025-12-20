import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import { authAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { getProfileImageUrl } from '../../lib/imageUtils';
import toast, { Toaster } from 'react-hot-toast';
import FormInput from '../../components/forms/FormInput';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FiUser, FiMail, FiPhone, FiCamera, FiSave, FiX } from 'react-icons/fi';

export default function ClientProfile() {
  const { user: authUser, updateUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    profile_image: null,
    last_login: null,
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      const userData = response.data?.data || response.data;
      
      setProfile({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role || '',
        profile_image: userData.profile_image || null,
        last_login: userData.last_login || null,
      });
      
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
      });

      // Set image preview if profile image exists
      if (userData.profile_image) {
        const imageUrl = getProfileImageUrl(userData.profile_image);
        setImagePreview(imageUrl);
        setImageError(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      // If API call fails, try to use data from AuthContext as fallback
      if (authUser) {
        setProfile({
          name: authUser.name || authUser.full_name || '',
          email: authUser.email || '',
          phone: authUser.phone || '',
          role: authUser.role || '',
          profile_image: authUser.profile_image || null,
          last_login: authUser.last_login || null,
        });
        
        setFormData({
          name: authUser.name || authUser.full_name || '',
          email: authUser.email || '',
          phone: authUser.phone || '',
        });

        if (authUser.profile_image) {
          const imageUrl = getProfileImageUrl(authUser.profile_image);
          setImagePreview(imageUrl);
          setImageError(false);
        }

        // Only show error for non-404 errors or if it's a critical error
        // For 404, silently use cached data (endpoint might not be implemented yet)
        if (error.response?.status !== 404) {
          if (error.response?.status === 401) {
            toast.error('Authentication required. Please log in again.');
          } else {
            console.warn('Failed to load profile from server. Using cached data.');
          }
        }
      } else {
        // No fallback data available - only show error if it's not a 404
        if (error.response?.status === 404) {
          // 404 is expected if endpoint doesn't exist - don't show error
          console.warn('Profile endpoint not found. Using default values.');
        } else if (error.response?.status === 401) {
          toast.error('Authentication required. Please log in again.');
        } else {
          toast.error('Failed to load profile');
        }
      }
    } finally {
      setLoading(false);
    }
  };

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setSelectedImage(file);
    setImageError(false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(profile.profile_image 
      ? getProfileImageUrl(profile.profile_image)
      : null);
  };

  const handleImageUpload = async () => {
    if (!selectedImage) {
      toast.error('Please select an image to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('profile_image', selectedImage);

      const response = await authAPI.uploadProfileImage(formData);
      const updatedUser = response.data?.data?.user || response.data?.user || response.data;

      // Update profile state
      setProfile(prev => ({
        ...prev,
        profile_image: updatedUser.profile_image,
      }));

      // Update auth context - store relative path, Header will construct full URL
      updateUser({
        profile_image: updatedUser.profile_image,
        name: updatedUser.name,
      });

      setSelectedImage(null);
      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Name is required';
    }

    if (!formData.email || formData.email.trim() === '') {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && formData.phone.length > 15) {
      newErrors.phone = 'Phone number must be 15 characters or less';
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
      setSaving(true);
      const response = await authAPI.updateProfile(formData);
      const updatedUser = response.data?.data?.user || response.data?.user || response.data;

      // Update profile state
      setProfile(prev => ({
        ...prev,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
      }));

      // Update auth context to reflect changes in header
      updateUser({
        name: updatedUser.name,
        email: updatedUser.email,
        full_name: updatedUser.name,
      });

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
      
      // Set specific field errors if provided
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <ProtectedRoute portalType="client">
        <ClientLayout title="Profile">
          <PageLayout
            title="Profile"
            breadcrumbs={[
              { label: 'Client', href: '/client/dashboard' },
              { label: 'Profile' },
            ]}
          >
          <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
          </div>
          </PageLayout>
        </ClientLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Profile">
        <Toaster />
        <PageLayout
          title="Profile"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Profile' },
          ]}
        >
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Profile Image */}
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {imagePreview && !imageError ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <FiUser className="h-16 w-16 text-primary-600" />
                  )}
                </div>
                <label
                  htmlFor="profile-image-upload"
                  className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition shadow-lg"
                >
                  <FiCamera className="h-4 w-4" />
                </label>
                <input
                  id="profile-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {profile.name || 'User'}
                </h1>
                <p className="text-gray-600 mb-2">{profile.email}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="capitalize bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                    {profile.role || 'User'}
                  </span>
                  <span>Last login: {formatDate(profile.last_login)}</span>
                </div>
              </div>
            </div>

            {/* Image Upload Actions */}
            {selectedImage && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  New image selected: {selectedImage.name}
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={handleRemoveImage}
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                  >
                    <FiX className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImageUpload}
                    size="sm"
                    disabled={uploading}
                  >
                    <FiCamera className="h-4 w-4 mr-1" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Profile Form */}
          <Card className="shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
            
            <div className="space-y-4">
              <FormInput
                name="name"
                label="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                error={errors.name}
                touched={true}
                required
                placeholder="Enter your full name"
              />

              <FormInput
                name="email"
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                touched={true}
                required
                placeholder="Enter your email address"
              />

              <FormInput
                name="phone"
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                error={errors.phone}
                touched={true}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
              >
                <FiSave className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
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


