import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CompaniesScreen from './CompaniesScreen.jsx';
import { useAuth } from '../../../contexts/AuthContext';
import { companyAPI, branchAPI } from '../../../lib/api';

export default function CompanyBranchSelectionScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [needsSelection, setNeedsSelection] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSelectionNeeded();
    
    // Prevent back navigation during selection
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent back navigation
    });

    return () => backHandler.remove();
  }, []);

  const checkSelectionNeeded = async () => {
    try {
      // Check if user has multiple companies or branches
      const companiesRes = await companyAPI.list().catch(() => ({ data: { data: [] } }));
      const companies = companiesRes?.data?.data || companiesRes?.data || [];
      
      let branches = [];
      if (user?.company_id) {
        const branchesRes = await branchAPI.list(user.company_id).catch(() => ({ data: { data: [] } }));
        branches = branchesRes?.data?.data || branchesRes?.data || [];
      }

      // Show selection screen if multiple companies or branches exist
      const hasMultipleCompanies = companies.length > 1;
      const hasMultipleBranches = branches.length > 1;
      
      if (hasMultipleCompanies || hasMultipleBranches) {
        setNeedsSelection(true);
      } else {
        // No selection needed, navigate to dashboard
        navigation.replace('Dashboard');
      }
    } catch (error) {
      console.error('Error checking selection needed:', error);
      // On error, just navigate to dashboard
      navigation.replace('Dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionComplete = () => {
    // Navigate to dashboard after selection
    navigation.replace('Dashboard');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Checking your account...</Text>
      </View>
    );
  }

  if (!needsSelection) {
    return null; // Will navigate to dashboard
  }

  return (
    <CompaniesScreen 
      isPostLogin={true}
      onSelectionComplete={handleSelectionComplete}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
});