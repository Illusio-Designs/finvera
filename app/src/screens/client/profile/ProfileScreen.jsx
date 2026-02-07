import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../../utils/fonts';;
import { useNavigation } from '@react-navigation/native';
import TopBar from '../../../components/navigation/TopBar';
import ProfileImagePicker from '../../../components/ui/ProfileImagePicker';
import PhoneInput from '../../../components/ui/PhoneInput';
import { useAuth } from '../../../contexts/AuthContext';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { authAPI, companyAPI, subscriptionAPI } from '../../../lib/api';
import { buildUploadUrl } from '../../../config/env';
import FormSkeleton from '../../../components/ui/skeletons/FormSkeleton';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch profile data
      const profileResponse = await authAPI.getProfile();
      const userData = profileResponse.data?.data || profileResponse.data;
      
      // Debug logging for profile response
      if (__DEV__) {
        console.log('📥 Profile API Response:', {
          fullResponse: profileResponse.data,
          userData: userData,
          profileImage: userData?.profile_image
        });
      }
      
      setProfile({
        id: userData.id || '',
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role || '',
        profile_image: userData.profile_image || null,
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        last_login: userData.last_login || null,
      });
      
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
      });

      // Fetch company data separately
      try {
        const companyResponse = await companyAPI.list();
        const companies = companyResponse.data?.data || companyResponse.data || [];
        if (companies.length > 0) {
          // Use the first company or the one matching user's company_id
          const userCompany = user?.company_id 
            ? companies.find(c => c.id === user.company_id) || companies[0]
            : companies[0];
          setCompany(userCompany);
        }
      } catch (companyError) {
        console.error('Error fetching company:', companyError);
        // Don't show error for company fetch failure
      }

      // Fetch subscription data separately
      try {
        const subscriptionResponse = await subscriptionAPI.getCurrentSubscription();
        const subscriptionData = subscriptionResponse.data?.data || subscriptionResponse.data;
        setSubscription(subscriptionData);
      } catch (subscriptionError) {
        console.error('Error fetching subscription:', subscriptionError);
        // Don't show error for subscription fetch failure
      }
      
    } catch (error) {
      console.error('Profile fetch error:', error);
      
      // Fallback to user data from AuthContext
      if (user) {
        setProfile({
          id: user.id || '',
          name: user.name || user.full_name || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || '',
          profile_image: user.profile_image || null,
          is_active: user.is_active !== undefined ? user.is_active : true,
          last_login: user.last_login || null,
        });
        
        setFormData({
          name: user.name || user.full_name || '',
          email: user.email || '',
          phone: user.phone || '',
        });
      }
      
      if (error.response?.status !== 404) {
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load profile'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const handleEditProfile = () => {
    setFormData({
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
    });
    setErrors({});
    setShowEditModal(true);
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

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Please fix the errors in the form'
      });
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

      // Update auth context
      updateUser({
        name: updatedUser.name,
        email: updatedUser.email,
        full_name: updatedUser.name,
      });

      setShowEditModal(false);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update profile'
      });
      
      // Set specific field errors if provided
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImageChange = (newImageUri) => {
    // Debug logging
    if (__DEV__) {
      console.log('🖼️ Profile Image Change:', {
        newImageUri,
        isFullUrl: newImageUri?.startsWith('http'),
        builtUrl: buildUploadUrl(newImageUri)
      });
    }
    
    // Update local profile state
    setProfile(prev => ({
      ...prev,
      profile_image: newImageUri
    }));
    
    // Update user context
    updateUser({
      profile_image: newImageUri
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const profileSections = [
    {
      title: 'Personal Information',
      items: [
        { label: 'Name', value: profile?.name || 'Not provided', icon: 'person-outline' },
        { label: 'Email', value: profile?.email || 'Not provided', icon: 'mail-outline' },
        { label: 'Phone', value: profile?.phone || 'Not provided', icon: 'call-outline' },
        { label: 'Role', value: profile?.role || 'Client', icon: 'shield-outline' },
        { label: 'Account Status', value: profile?.is_active ? 'Active' : 'Inactive', icon: 'checkmark-circle-outline' },
        { label: 'Last Login', value: formatDate(profile?.last_login), icon: 'time-outline' },
      ]
    },
    {
      title: 'Company Information',
      items: [
        { label: 'Company Name', value: company?.company_name || 'Not provided', icon: 'business-outline' },
        { label: 'GSTIN', value: company?.gstin || 'Not provided', icon: 'document-text-outline' },
        { label: 'PAN', value: company?.pan || 'Not provided', icon: 'card-outline' },
        { label: 'TAN', value: company?.tan || 'Not provided', icon: 'receipt-outline' },
        { label: 'Address', value: company?.address || 'Not provided', icon: 'location-outline' },
        { label: 'City', value: company?.city || 'Not provided', icon: 'location-outline' },
        { label: 'State', value: company?.state || 'Not provided', icon: 'map-outline' },
        { label: 'Pincode', value: company?.pincode || 'Not provided', icon: 'pin-outline' },
      ]
    },
    {
      title: 'Subscription Information',
      items: [
        { label: 'Plan', value: subscription?.plan_name || 'Not provided', icon: 'diamond-outline' },
        { label: 'Account Type', value: subscription?.is_trial ? 'Trial' : 'Paid', icon: 'star-outline' },
        { label: 'Trial Ends', value: subscription?.is_trial ? formatDate(subscription?.trial_ends_at) : 'N/A', icon: 'calendar-outline' },
        { label: 'Status', value: subscription?.status || 'Unknown', icon: 'checkmark-circle-outline' },
      ]
    },
    {
      title: 'Account Settings',
      items: [
        { label: 'Change Password', value: '', icon: 'lock-closed-outline', action: 'changePassword' },
        { label: 'Notification Preferences', value: '', icon: 'notifications-outline', action: 'notifications' },
        { label: 'Subscription & Plans', value: '', icon: 'diamond-outline', action: 'subscription' },
      ]
    }
  ];

  const handleItemPress = (item) => {
    if (item.action === 'changePassword') {
      navigation.navigate('ChangePassword');
    } else if (item.action === 'notifications') {
      navigation.navigate('NotificationPreferences');
    } else if (item.action === 'subscription') {
      navigation.navigate('Subscription');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar 
          title="Profile" 
          onMenuPress={handleMenuPress}
        />
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <FormSkeleton fieldCount={8} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar 
        title="Profile" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Debug logging for profile image */}
          {__DEV__ && console.log('🖼️ Profile Image Debug:', {
            profileImage: profile?.profile_image,
            userImage: user?.profile_image,
            builtUrl: buildUploadUrl(profile?.profile_image) || buildUploadUrl(user?.profile_image)
          })}
          <ProfileImagePicker
            imageUri={buildUploadUrl(profile?.profile_image) || buildUploadUrl(user?.profile_image)}
            onImageChange={handleProfileImageChange}
            size={80}
            showEditButton={true}
          />
          <Text style={styles.profileName}>{profile?.name || user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{profile?.email || user?.email || 'user@example.com'}</Text>
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>{profile?.role || 'Client'}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={16} color="#3e60ab" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Sections */}
        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.profileItem, index < section.items.length - 1 && styles.profileItemBorder]}
                  onPress={() => handleItemPress(item)}
                  disabled={!item.action}
                >
                  <View style={styles.profileItemLeft}>
                    <View style={styles.profileItemIcon}>
                      <Ionicons name={item.icon} size={20} color="#6b7280" />
                    </View>
                    <View style={styles.profileItemContent}>
                      <Text style={styles.profileItemLabel}>{item.label}</Text>
                      {item.value && <Text style={styles.profileItemValue} numberOfLines={2}>{item.value}</Text>}
                    </View>
                  </View>
                  {item.action && (
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity 
              onPress={() => setShowEditModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                placeholder="Enter your email address"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <PhoneInput
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                placeholder="Enter your phone number"
                error={errors.phone}
                defaultCountry="IN"
              />
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                <Ionicons name="save" size={20} color="white" />
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONT_STYLES.h5,
    color: '#6b7280'
  },
  profileHeader: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  profileName: {
    ...FONT_STYLES.h2,
    color: '#111827',
    marginBottom: 4,
    marginTop: 12
  },
  profileEmail: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
    marginBottom: 8
  },
  profileBadge: {
    backgroundColor: '#3e60ab',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  profileBadgeText: {
    ...FONT_STYLES.caption,
    color: 'white',
    textTransform: 'capitalize'
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  editButtonText: {
    ...FONT_STYLES.label,
    color: '#3e60ab',
    marginLeft: 4
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 12
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  profileItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileItemContent: {
    flex: 1,
  },
  profileItemLabel: {
    ...FONT_STYLES.label,
    color: '#111827'
  },
  profileItemValue: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    marginTop: 2
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    ...FONT_STYLES.h5,
    color: '#111827'
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginBottom: 8
  },
  input: {
    ...FONT_STYLES.h5,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111827',
    backgroundColor: 'white'
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    ...FONT_STYLES.caption,
    color: '#ef4444',
    marginTop: 4
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    ...FONT_STYLES.h5,
    color: '#6b7280'
  },
  saveButton: {
    backgroundColor: '#3e60ab',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    ...FONT_STYLES.h5,
    color: 'white'
  },
});