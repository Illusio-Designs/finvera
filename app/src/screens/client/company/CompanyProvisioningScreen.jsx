import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useNotification } from '../../../contexts/NotificationContext.jsx';
import { Ionicons } from '@expo/vector-icons';
import { companyAPI } from '../../../lib/api';

export default function CompanyProvisioningScreen() {
  const [provisioningStatus, setProvisioningStatus] = useState('provisioning');
  const [progress, setProgress] = useState(0);
  const navigation = useNavigation();
  const route = useRoute();
  const { companyId } = route.params || {};
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (companyId) {
      checkProvisioningStatus();
    }
  }, [companyId]);

  const checkProvisioningStatus = async () => {
    try {
      // Simulate provisioning progress
      const steps = [
        { message: 'Creating database...', progress: 20 },
        { message: 'Setting up user permissions...', progress: 40 },
        { message: 'Initializing company data...', progress: 60 },
        { message: 'Configuring accounting structure...', progress: 80 },
        { message: 'Finalizing setup...', progress: 100 },
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setProgress(steps[i].progress);
        
        if (i === steps.length - 1) {
          // Check actual provisioning status
          const response = await companyAPI.get(companyId);
          const company = response.data?.data || response.data;
          
          if (company?.db_provisioned) {
            setProvisioningStatus('completed');
            showSuccess(
              'Company Ready!', 
              'Your company has been successfully set up and is ready to use.',
              {
                duration: 3000,
                actionText: 'Go to Dashboard',
                onActionPress: () => navigation.replace('Dashboard')
              }
            );
            
            setTimeout(() => {
              navigation.replace('Dashboard');
            }, 3000);
          } else {
            setProvisioningStatus('failed');
            showError('Provisioning Failed', 'Failed to provision company database. Please try again.');
          }
        }
      }
    } catch (error) {
      console.error('Provisioning check error:', error);
      setProvisioningStatus('failed');
      showError('Error', 'Failed to check provisioning status.');
    }
  };

  const getStatusIcon = () => {
    switch (provisioningStatus) {
      case 'provisioning':
        return <ActivityIndicator size="large" color="#3e60ab" />;
      case 'completed':
        return <Ionicons name="checkmark-circle" size={64} color="#10b981" />;
      case 'failed':
        return <Ionicons name="close-circle" size={64} color="#ef4444" />;
      default:
        return <ActivityIndicator size="large" color="#3e60ab" />;
    }
  };

  const getStatusMessage = () => {
    switch (provisioningStatus) {
      case 'provisioning':
        return 'Setting up your company...';
      case 'completed':
        return 'Company setup completed!';
      case 'failed':
        return 'Setup failed. Please try again.';
      default:
        return 'Initializing...';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {getStatusIcon()}
        </View>
        
        <Text style={styles.title}>Company Provisioning</Text>
        <Text style={styles.message}>{getStatusMessage()}</Text>
        
        {provisioningStatus === 'provisioning' && (
          <>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
            
            <Text style={styles.description}>
              We're setting up your company database and configuring your accounting structure. 
              This usually takes 1-2 minutes.
            </Text>
          </>
        )}
        
        {provisioningStatus === 'completed' && (
          <Text style={styles.description}>
            Your company is now ready! You can start managing your business operations.
          </Text>
        )}
        
        {provisioningStatus === 'failed' && (
          <Text style={styles.description}>
            Something went wrong during setup. Please contact support or try creating the company again.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  message: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 32,
    fontFamily: 'Agency',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3e60ab',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Agency',
  },
});