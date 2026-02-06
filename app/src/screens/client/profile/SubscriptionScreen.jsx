import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { subscriptionAPI } from '../../../lib/api';
import { FONT_STYLES } from '../../../utils/fonts';

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const response = await subscriptionAPI.getCurrentSubscription();
      const subscriptionData = response.data?.subscription || response.data?.data;
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Subscription fetch error:', error);
      if (error.response?.status !== 404) {
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load subscription details'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSubscription();
    setRefreshing(false);
  }, [fetchSubscription]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount, currency = 'INR') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
      case 'expired':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'cancelled':
      case 'expired':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const handleUpgrade = () => {
    console.log('Upgrade button pressed'); // Debug log
    
    // Add alert for immediate feedback
    alert('Upgrade button pressed!');
    
    try {
      navigation.navigate('Plans');
    } catch (error) {
      console.error('Navigation error:', error);
      showNotification({
        type: 'error',
        title: 'Navigation Error',
        message: 'Unable to navigate to plans screen'
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar 
          title="Subscription" 
          onMenuPress={handleMenuPress}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading subscription...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar 
        title="Subscription" 
        onMenuPress={handleMenuPress}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {subscription ? (
          <>
            {/* Current Plan */}
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{subscription.plan_name || 'Current Plan'}</Text>
                  <View style={styles.statusContainer}>
                    <Ionicons 
                      name={getStatusIcon(subscription.status)} 
                      size={16} 
                      color={getStatusColor(subscription.status)} 
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(subscription.status) }]}>
                      {subscription.status?.toUpperCase() || 'UNKNOWN'}
                    </Text>
                  </View>
                </View>
                <View style={styles.planPrice}>
                  <Text style={styles.priceAmount}>
                    {formatAmount(subscription.amount, subscription.currency)}
                  </Text>
                  <Text style={styles.pricePeriod}>
                    /{subscription.billing_cycle || 'month'}
                  </Text>
                </View>
              </View>
              
              {subscription.description && (
                <Text style={styles.planDescription}>{subscription.description}</Text>
              )}
            </View>

            {/* Subscription Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subscription Details</Text>
              <View style={styles.sectionCard}>
                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Start Date</Text>
                    <Text style={styles.detailValue}>{formatDate(subscription.start_date)}</Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>End Date</Text>
                    <Text style={styles.detailValue}>{formatDate(subscription.end_date)}</Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="refresh-outline" size={20} color="#6b7280" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Billing Cycle</Text>
                    <Text style={styles.detailValue}>
                      {subscription.billing_cycle?.charAt(0).toUpperCase() + subscription.billing_cycle?.slice(1) || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="business-outline" size={20} color="#6b7280" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Plan Type</Text>
                    <Text style={styles.detailValue}>
                      {subscription.plan_type?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Standard'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Plan Features */}
            {subscription.features && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Plan Features</Text>
                <View style={styles.sectionCard}>
                  {subscription.max_users && (
                    <View style={styles.featureItem}>
                      <Ionicons name="people-outline" size={20} color="#3e60ab" />
                      <Text style={styles.featureText}>
                        Up to {subscription.max_users} users
                      </Text>
                    </View>
                  )}
                  
                  {subscription.max_companies && (
                    <View style={styles.featureItem}>
                      <Ionicons name="business-outline" size={20} color="#3e60ab" />
                      <Text style={styles.featureText}>
                        {subscription.max_companies} {subscription.max_companies === 1 ? 'company' : 'companies'}
                      </Text>
                    </View>
                  )}
                  
                  {subscription.max_branches && subscription.max_branches > 0 && (
                    <View style={styles.featureItem}>
                      <Ionicons name="git-branch-outline" size={20} color="#3e60ab" />
                      <Text style={styles.featureText}>
                        Up to {subscription.max_branches} branches
                      </Text>
                    </View>
                  )}
                  
                  {subscription.max_invoices_per_month && (
                    <View style={styles.featureItem}>
                      <Ionicons name="document-text-outline" size={20} color="#3e60ab" />
                      <Text style={styles.featureText}>
                        {subscription.max_invoices_per_month} invoices per month
                      </Text>
                    </View>
                  )}
                  
                  {subscription.storage_limit_gb && (
                    <View style={styles.featureItem}>
                      <Ionicons name="cloud-outline" size={20} color="#3e60ab" />
                      <Text style={styles.featureText}>
                        {subscription.storage_limit_gb} GB storage
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.upgradeButton} 
                onPress={handleUpgrade}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-up-circle" size={20} color="white" />
                <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.noSubscriptionContainer}>
            <View style={styles.noSubscriptionIcon}>
              <Ionicons name="diamond-outline" size={48} color="#9ca3af" />
            </View>
            <Text style={styles.noSubscriptionTitle}>No Active Subscription</Text>
            <Text style={styles.noSubscriptionText}>
              You don't have an active subscription. Choose a plan to get started.
            </Text>
            <TouchableOpacity 
              style={styles.choosePlanButton} 
              onPress={handleUpgrade}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="diamond" size={20} color="white" />
              <Text style={styles.choosePlanButtonText}>Choose Plan</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Bottom margin for better scrolling */}
        <View style={styles.bottomMargin} />
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
    paddingBottom: 100, // Increase bottom padding to avoid bottom tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    ...FONT_STYLES.captionSmall,
    fontWeight: '600',
    marginLeft: 4,
  },
  planPrice: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    ...FONT_STYLES.h2,
    color: '#3e60ab',
  },
  pricePeriod: {
    ...FONT_STYLES.label,
    color: '#6b7280',
  },
  planDescription: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginBottom: 12,
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
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    ...FONT_STYLES.label,
    fontWeight: '600',
    color: '#111827',
  },
  detailValue: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    marginTop: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  featureText: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginLeft: 12,
  },
  actionButtons: {
    marginTop: 8,
    marginBottom: 16,
    zIndex: 1, // Ensure it's above other elements
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    minHeight: 48, // Ensure minimum touch target
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  upgradeButtonText: {
    ...FONT_STYLES.button,
    color: 'white',
  },
  bottomMargin: {
    height: 60, // Increase bottom margin
  },
  noSubscriptionContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noSubscriptionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  noSubscriptionTitle: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginBottom: 8,
  },
  noSubscriptionText: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  choosePlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3e60ab',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  choosePlanButtonText: {
    ...FONT_STYLES.button,
    color: 'white',
  },
});