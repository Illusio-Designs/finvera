import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { businessAPI } from '../../../lib/api';

export default function SubscribeScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchSubscription = useCallback(async () => {
    try {
      const response = await businessAPI.subscription.current();
      setSubscription(response.data || null);
    } catch (error) {
      console.error('Subscription fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load subscription details'
      });
      setSubscription(null);
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

  const handleCancelSubscription = async () => {
    try {
      await businessAPI.subscription.cancel();
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Subscription cancelled successfully'
      });
      setShowCancelModal(false);
      fetchSubscription();
    } catch (error) {
      console.error('Cancel subscription error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to cancel subscription'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': '#10b981',
      'cancelled': '#ef4444',
      'expired': '#f59e0b',
      'pending': '#3b82f6',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'active': 'checkmark-circle',
      'cancelled': 'close-circle',
      'expired': 'time',
      'pending': 'hourglass',
    };
    return icons[status?.toLowerCase()] || 'help-circle';
  };

  // Default subscription data if API doesn't return any
  const defaultSubscription = {
    id: 1,
    plan_name: 'Premium Plan',
    status: 'active',
    price: 1999,
    billing_cycle: 'monthly',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    features: [
      'Unlimited invoices',
      'Advanced GST features',
      'Priority support',
      'Multi-user access',
      'Advanced reports',
      'E-invoice & E-way bill',
      'Inventory management'
    ]
  };

  const displaySubscription = subscription || defaultSubscription;

  return (
    <View style={styles.container}>
      <TopBar 
        title="My Subscription" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.sectionTitle}>Subscription Details</Text>
          <Text style={styles.sectionSubtitle}>
            Manage your current subscription and billing
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <View style={styles.spinner} />
              <Text style={styles.loadingText}>Loading subscription details...</Text>
            </View>
          </View>
        ) : (
          <>
            {/* Subscription Overview */}
            <View style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <View style={[
                  styles.subscriptionIcon,
                  { backgroundColor: getStatusColor(displaySubscription.status) + '20' }
                ]}>
                  <Ionicons 
                    name={getStatusIcon(displaySubscription.status)} 
                    size={32} 
                    color={getStatusColor(displaySubscription.status)} 
                  />
                </View>
                <View style={styles.subscriptionInfo}>
                  <Text style={styles.subscriptionPlan}>{displaySubscription.plan_name}</Text>
                  <View style={[
                    styles.subscriptionStatus,
                    { backgroundColor: getStatusColor(displaySubscription.status) }
                  ]}>
                    <Text style={styles.subscriptionStatusText}>
                      {displaySubscription.status?.toUpperCase() || 'ACTIVE'}
                    </Text>
                  </View>
                </View>
                <View style={styles.subscriptionPricing}>
                  <Text style={styles.subscriptionPrice}>
                    {formatCurrency(displaySubscription.price)}
                  </Text>
                  <Text style={styles.subscriptionBilling}>
                    per {displaySubscription.billing_cycle}
                  </Text>
                </View>
              </View>

              <View style={styles.subscriptionDates}>
                <View style={styles.dateItem}>
                  <Ionicons name="calendar-outline" size={16} color="#64748b" />
                  <Text style={styles.dateLabel}>Started:</Text>
                  <Text style={styles.dateValue}>{formatDate(displaySubscription.start_date)}</Text>
                </View>
                <View style={styles.dateItem}>
                  <Ionicons name="calendar-outline" size={16} color="#64748b" />
                  <Text style={styles.dateLabel}>Next Billing:</Text>
                  <Text style={styles.dateValue}>{formatDate(displaySubscription.end_date)}</Text>
                </View>
              </View>
            </View>

            {/* Features Included */}
            <View style={styles.featuresCard}>
              <Text style={styles.featuresTitle}>Features Included</Text>
              <View style={styles.featuresList}>
                {displaySubscription.features?.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Usage Stats */}
            <View style={styles.usageCard}>
              <Text style={styles.usageTitle}>This Month's Usage</Text>
              <View style={styles.usageStats}>
                <View style={styles.usageStat}>
                  <View style={styles.usageStatIcon}>
                    <Ionicons name="document-text" size={24} color="#3e60ab" />
                  </View>
                  <View style={styles.usageStatInfo}>
                    <Text style={styles.usageStatValue}>247</Text>
                    <Text style={styles.usageStatLabel}>Invoices Created</Text>
                  </View>
                </View>

                <View style={styles.usageStat}>
                  <View style={styles.usageStatIcon}>
                    <Ionicons name="people" size={24} color="#10b981" />
                  </View>
                  <View style={styles.usageStatInfo}>
                    <Text style={styles.usageStatValue}>3</Text>
                    <Text style={styles.usageStatLabel}>Active Users</Text>
                  </View>
                </View>

                <View style={styles.usageStat}>
                  <View style={styles.usageStatIcon}>
                    <Ionicons name="cloud-download" size={24} color="#f59e0b" />
                  </View>
                  <View style={styles.usageStatInfo}>
                    <Text style={styles.usageStatValue}>89</Text>
                    <Text style={styles.usageStatLabel}>Reports Generated</Text>
                  </View>
                </View>

                <View style={styles.usageStat}>
                  <View style={styles.usageStatIcon}>
                    <Ionicons name="sync" size={24} color="#8b5cf6" />
                  </View>
                  <View style={styles.usageStatInfo}>
                    <Text style={styles.usageStatValue}>1.2GB</Text>
                    <Text style={styles.usageStatLabel}>Data Synced</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Billing History */}
            <View style={styles.billingCard}>
              <Text style={styles.billingTitle}>Recent Billing History</Text>
              <View style={styles.billingList}>
                <View style={styles.billingItem}>
                  <View style={styles.billingInfo}>
                    <Text style={styles.billingDate}>Jan 15, 2025</Text>
                    <Text style={styles.billingDescription}>Premium Plan - Monthly</Text>
                  </View>
                  <View style={styles.billingAmount}>
                    <Text style={styles.billingPrice}>{formatCurrency(1999)}</Text>
                    <View style={styles.billingStatus}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={styles.billingStatusText}>Paid</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.billingItem}>
                  <View style={styles.billingInfo}>
                    <Text style={styles.billingDate}>Dec 15, 2024</Text>
                    <Text style={styles.billingDescription}>Premium Plan - Monthly</Text>
                  </View>
                  <View style={styles.billingAmount}>
                    <Text style={styles.billingPrice}>{formatCurrency(1999)}</Text>
                    <View style={styles.billingStatus}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={styles.billingStatusText}>Paid</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.billingItem}>
                  <View style={styles.billingInfo}>
                    <Text style={styles.billingDate}>Nov 15, 2024</Text>
                    <Text style={styles.billingDescription}>Premium Plan - Monthly</Text>
                  </View>
                  <View style={styles.billingAmount}>
                    <Text style={styles.billingPrice}>{formatCurrency(1999)}</Text>
                    <View style={styles.billingStatus}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={styles.billingStatusText}>Paid</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsCard}>
              <TouchableOpacity style={styles.upgradeButton} activeOpacity={0.8}>
                <Ionicons name="arrow-up-circle" size={20} color="white" />
                <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.manageButton} activeOpacity={0.8}>
                <Ionicons name="card" size={20} color="#3e60ab" />
                <Text style={styles.manageButtonText}>Manage Payment</Text>
              </TouchableOpacity>

              {displaySubscription.status === 'active' && (
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowCancelModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                  <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Support Section */}
            <View style={styles.supportCard}>
              <View style={styles.supportHeader}>
                <Ionicons name="help-circle" size={24} color="#3e60ab" />
                <Text style={styles.supportTitle}>Need Help?</Text>
              </View>
              <Text style={styles.supportDescription}>
                Have questions about your subscription? Our support team is here to help.
              </Text>
              <TouchableOpacity style={styles.supportButton} activeOpacity={0.8}>
                <Ionicons name="chatbubble" size={16} color="#3e60ab" />
                <Text style={styles.supportButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Cancel Subscription Modal */}
      <Modal
        visible={showCancelModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIcon}>
                <Ionicons name="warning" size={20} color="#ef4444" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Cancel Subscription</Text>
                <Text style={styles.modalSubtitle}>Are you sure you want to cancel?</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setShowCancelModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.cancelWarning}>
              <Text style={styles.cancelWarningTitle}>What happens when you cancel?</Text>
              <View style={styles.cancelWarningList}>
                <View style={styles.cancelWarningItem}>
                  <Ionicons name="checkmark" size={16} color="#10b981" />
                  <Text style={styles.cancelWarningText}>
                    You'll keep access until {formatDate(displaySubscription.end_date)}
                  </Text>
                </View>
                <View style={styles.cancelWarningItem}>
                  <Ionicons name="close" size={16} color="#ef4444" />
                  <Text style={styles.cancelWarningText}>
                    No more automatic renewals
                  </Text>
                </View>
                <View style={styles.cancelWarningItem}>
                  <Ionicons name="close" size={16} color="#ef4444" />
                  <Text style={styles.cancelWarningText}>
                    Limited features after expiration
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.keepButton}
                onPress={() => setShowCancelModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.keepButtonText}>Keep Subscription</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmCancelButton}
                onPress={handleCancelSubscription}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmCancelButtonText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerSection: {
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    fontFamily: 'Agency',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingCard: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  spinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#e2e8f0',
    borderTopColor: '#3e60ab',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
  },
  subscriptionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  subscriptionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  subscriptionInfo: {
    flex: 1,
    paddingRight: 12,
  },
  subscriptionPlan: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 8,
  },
  subscriptionStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  subscriptionStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  subscriptionPricing: {
    alignItems: 'flex-end',
  },
  subscriptionPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3e60ab',
    fontFamily: 'Agency',
  },
  subscriptionBilling: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  subscriptionDates: {
    gap: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    minWidth: 80,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  featuresCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    flex: 1,
    lineHeight: 20,
  },
  usageCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 16,
  },
  usageStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  usageStat: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  usageStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  usageStatInfo: {
    flex: 1,
  },
  usageStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  usageStatLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  billingCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  billingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 16,
  },
  billingList: {
    gap: 16,
  },
  billingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  billingInfo: {
    flex: 1,
  },
  billingDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  billingDescription: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Agency',
  },
  billingAmount: {
    alignItems: 'flex-end',
  },
  billingPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3e60ab',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  billingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  billingStatusText: {
    fontSize: 12,
    color: '#10b981',
    fontFamily: 'Agency',
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3e60ab',
    fontFamily: 'Agency',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    fontFamily: 'Agency',
  },
  supportCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  supportDescription: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 20,
    marginBottom: 16,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3e60ab',
    fontFamily: 'Agency',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  cancelWarning: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cancelWarningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 16,
  },
  cancelWarningList: {
    gap: 12,
  },
  cancelWarningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelWarningText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    flex: 1,
    lineHeight: 20,
  },
  modalActions: {
    gap: 12,
  },
  keepButton: {
    backgroundColor: '#3e60ab',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  keepButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  confirmCancelButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  confirmCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    fontFamily: 'Agency',
  },
});