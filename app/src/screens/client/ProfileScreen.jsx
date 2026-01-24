import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../components/navigation/TopBar';
import { useAuth } from '../../contexts/AuthContext';
import { useDrawer } from '../../contexts/DrawerContext.jsx';
import { profileAPI } from '../../lib/api';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const { openDrawer } = useDrawer();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleMenuPress = () => {
    openDrawer();
  };

  const handleSearchPress = () => {
    console.log('Search pressed');
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.get();
      setProfile(response.data?.data || response.data);
    } catch (error) {
      console.error('Profile fetch error:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const profileSections = [
    {
      title: 'Personal Information',
      items: [
        { label: 'Name', value: profile?.name || user?.name || 'Not provided', icon: 'person-outline' },
        { label: 'Email', value: profile?.email || user?.email || 'Not provided', icon: 'mail-outline' },
        { label: 'Phone', value: profile?.phone || 'Not provided', icon: 'call-outline' },
        { label: 'Role', value: profile?.role || user?.role || 'Client', icon: 'shield-outline' },
      ]
    },
    {
      title: 'Company Information',
      items: [
        { label: 'Company', value: profile?.company_name || 'Not provided', icon: 'business-outline' },
        { label: 'GSTIN', value: profile?.gstin || 'Not provided', icon: 'document-text-outline' },
        { label: 'PAN', value: profile?.pan || 'Not provided', icon: 'card-outline' },
        { label: 'Address', value: profile?.address || 'Not provided', icon: 'location-outline' },
      ]
    },
    {
      title: 'Account Settings',
      items: [
        { label: 'Change Password', value: '', icon: 'lock-closed-outline', action: 'changePassword' },
        { label: 'Notification Preferences', value: '', icon: 'notifications-outline', action: 'notifications' },
        { label: 'Privacy Settings', value: '', icon: 'shield-checkmark-outline', action: 'privacy' },
      ]
    }
  ];

  const handleItemPress = (item) => {
    if (item.action === 'changePassword') {
      Alert.alert('Change Password', 'This feature will be available soon');
    } else if (item.action === 'notifications') {
      navigation.navigate('NotificationPreferences');
    } else if (item.action === 'privacy') {
      Alert.alert('Privacy Settings', 'This feature will be available soon');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar 
          title="Profile" 
          onMenuPress={handleMenuPress}
          onSearchPress={handleSearchPress}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar 
        title="Profile" 
        onMenuPress={handleMenuPress}
        onSearchPress={handleSearchPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>
              {(profile?.name || user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{profile?.name || user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{profile?.email || user?.email || 'user@example.com'}</Text>
          <TouchableOpacity style={styles.editButton}>
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
                      {item.value && <Text style={styles.profileItemValue}>{item.value}</Text>}
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

        {/* Account Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Active Companies</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>156</Text>
              <Text style={styles.statLabel}>Total Vouchers</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>GST Returns</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Reports Generated</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 100, // Extra padding for bottom tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  profileHeader: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3e60ab',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Agency',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginBottom: 16,
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
    fontSize: 14,
    color: '#3e60ab',
    fontFamily: 'Agency',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Agency',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
  },
  profileItemValue: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3e60ab',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    textAlign: 'center',
  },
});