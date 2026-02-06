import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { voucherAPI } from '../../../lib/api';
import { FONT_STYLES } from '../../../utils/fonts';

export default function PaymentScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchPayments = useCallback(async () => {
    try {
      const response = await voucherAPI.list({ 
        voucher_type: 'payment',
        search: searchQuery,
        status: filter === 'all' ? undefined : filter,
        limit: 50 
      });
      const data = response.data?.data || response.data || [];
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Payments fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load payment vouchers'
      });
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filter, showNotification]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  }, [fetchPayments]);

  const handlePaymentPress = (payment) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
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

  const getPaymentStatusColor = (status) => {
    const colors = {
      'paid': '#10b981',
      'pending': '#f59e0b',
      'cancelled': '#ef4444',
      'draft': '#6b7280',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getPaymentStatusIcon = (status) => {
    const icons = {
      'paid': 'checkmark-circle',
      'pending': 'time',
      'cancelled': 'close-circle',
      'draft': 'document-text',
    };
    return icons[status?.toLowerCase()] || 'document-text';
  };

  const filterOptions = [
    { key: 'all', label: 'All Payments', icon: 'list-outline' },
    { key: 'paid', label: 'Paid', icon: 'checkmark-circle-outline' },
    { key: 'pending', label: 'Pending', icon: 'time-outline' },
    { key: 'draft', label: 'Draft', icon: 'document-text-outline' },
  ];

  return (
    <View style={styles.container}>
      <TopBar 
        title="Payment Vouchers" 
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
          <Text style={styles.sectionTitle}>Payment Vouchers</Text>
          <Text style={styles.sectionSubtitle}>
            Manage and track all payment transactions
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search payments by party or reference..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#9ca3af"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterTab,
                filter === option.key && styles.filterTabActive
              ]}
              onPress={() => setFilter(option.key)}
            >
              <Ionicons 
                name={option.icon} 
                size={16} 
                color={filter === option.key ? 'white' : '#64748b'} 
              />
              <Text style={[
                styles.filterTabText,
                filter === option.key && styles.filterTabTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="card" size={24} color="#3e60ab" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{payments.length}</Text>
              <Text style={styles.statLabel}>Total Payments</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {payments.filter(p => p.status === 'paid').length}
              </Text>
              <Text style={styles.statLabel}>Paid</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="time" size={24} color="#f59e0b" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {payments.filter(p => p.status === 'pending').length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Payments List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <View style={styles.spinner} />
              <Text style={styles.loadingText}>Loading payments...</Text>
            </View>
          </View>
        ) : payments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="card-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Payments Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? `No payments found matching "${searchQuery}"`
                  : 'No payment vouchers have been created yet'
                }
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.paymentsList}>
            {payments.map((payment, index) => (
              <TouchableOpacity
                key={payment.id || index}
                style={styles.paymentCard}
                onPress={() => handlePaymentPress(payment)}
                activeOpacity={0.95}
              >
                <View style={styles.paymentCardGradient}>
                  <View style={styles.paymentCardContent}>
                    <View style={styles.paymentCardHeader}>
                      <View style={[
                        styles.paymentIcon,
                        { backgroundColor: getPaymentStatusColor(payment.status) + '20' }
                      ]}>
                        <Ionicons 
                          name={getPaymentStatusIcon(payment.status)} 
                          size={24} 
                          color={getPaymentStatusColor(payment.status)} 
                        />
                      </View>
                      <View style={styles.paymentInfo}>
                        <Text style={styles.paymentTitle}>
                          {payment.party_name || 'Payment Voucher'}
                        </Text>
                        <Text style={styles.paymentDate}>
                          {formatDate(payment.voucher_date)}
                        </Text>
                      </View>
                      <View style={styles.paymentStatus}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getPaymentStatusColor(payment.status) }
                        ]}>
                          <Text style={styles.statusText}>
                            {payment.status?.toUpperCase() || 'DRAFT'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.paymentCardBody}>
                      <View style={styles.paymentDetail}>
                        <Ionicons name="document-text-outline" size={16} color="#64748b" />
                        <Text style={styles.paymentDetailText}>
                          Voucher No: {payment.voucher_number || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.paymentDetail}>
                        <Ionicons name="person-outline" size={16} color="#64748b" />
                        <Text style={styles.paymentDetailText}>
                          Party: {payment.party_name || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.paymentDetail}>
                        <Ionicons name="card-outline" size={16} color="#64748b" />
                        <Text style={styles.paymentDetailText}>
                          Mode: {payment.payment_mode || 'Cash'}
                        </Text>
                      </View>
                      {payment.reference_number && (
                        <View style={styles.paymentDetail}>
                          <Ionicons name="bookmark-outline" size={16} color="#64748b" />
                          <Text style={styles.paymentDetailText}>
                            Ref: {payment.reference_number}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.paymentCardFooter}>
                      <View style={styles.paymentAmount}>
                        <Text style={styles.paymentAmountValue}>
                          {formatCurrency(payment.total_amount)}
                        </Text>
                        <Text style={styles.paymentAmountLabel}>Amount Paid</Text>
                      </View>
                      <TouchableOpacity style={styles.paymentAction}>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Decorative elements */}
                  <View style={[
                    styles.decorativeCircle, 
                    { backgroundColor: getPaymentStatusColor(payment.status) + '20' }
                  ]} />
                  <View style={[
                    styles.decorativeLine, 
                    { backgroundColor: getPaymentStatusColor(payment.status) }
                  ]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Payment Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={[
                styles.modalIcon,
                { backgroundColor: selectedPayment ? getPaymentStatusColor(selectedPayment.status) + '20' : '#dbeafe' }
              ]}>
                <Ionicons 
                  name={selectedPayment ? getPaymentStatusIcon(selectedPayment.status) : 'card'} 
                  size={20} 
                  color={selectedPayment ? getPaymentStatusColor(selectedPayment.status) : '#3e60ab'} 
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>Payment Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedPayment?.party_name || 'Payment Voucher'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setShowDetailModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          {selectedPayment && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Voucher Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Voucher Number:</Text>
                  <Text style={styles.detailValue}>{selectedPayment.voucher_number || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedPayment.voucher_date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Party Name:</Text>
                  <Text style={styles.detailValue}>{selectedPayment.party_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getPaymentStatusColor(selectedPayment.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedPayment.status?.toUpperCase() || 'DRAFT'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Payment Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Mode:</Text>
                  <Text style={styles.detailValue}>{selectedPayment.payment_mode || 'Cash'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedPayment.total_amount)}</Text>
                </View>
                {selectedPayment.reference_number && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reference Number:</Text>
                    <Text style={styles.detailValue}>{selectedPayment.reference_number}</Text>
                  </View>
                )}
                {selectedPayment.bank_name && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bank:</Text>
                    <Text style={styles.detailValue}>{selectedPayment.bank_name}</Text>
                  </View>
                )}
              </View>

              {selectedPayment.narration && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Narration</Text>
                  <Text style={styles.narrationText}>{selectedPayment.narration}</Text>
                </View>
              )}
            </ScrollView>
          )}
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
    ...FONT_STYLES.h1,
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    ...FONT_STYLES.body,
    color: '#64748b',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    ...FONT_STYLES.body,
    color: '#0f172a',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
    shadowColor: '#3e60ab',
    shadowOpacity: 0.3,
  },
  filterTabText: {
    ...FONT_STYLES.label,
    color: '#64748b',
  },
  filterTabTextActive: {
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    ...FONT_STYLES.h3,
    color: '#0f172a',
  },
  statLabel: {
    ...FONT_STYLES.caption,
    color: '#64748b',
    marginTop: 2,
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
    ...FONT_STYLES.body,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    width: '100%',
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    ...FONT_STYLES.h2,
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...FONT_STYLES.body,
    color: '#64748b',
    textAlign: 'center',
  },
  paymentsList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  paymentCardGradient: {
    position: 'relative',
    padding: 20,
  },
  paymentCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  paymentIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentInfo: {
    flex: 1,
    paddingRight: 12,
  },
  paymentTitle: {
    ...FONT_STYLES.h4,
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  paymentDate: {
    ...FONT_STYLES.label,
    color: '#64748b',
  },
  paymentStatus: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 60,
    alignItems: 'center',
  },
  statusText: {
    ...FONT_STYLES.captionSmall,
    color: 'white',
  },
  paymentCardBody: {
    marginBottom: 16,
    gap: 8,
  },
  paymentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  paymentDetailText: {
    ...FONT_STYLES.label,
    color: '#64748b',
    flex: 1,
  },
  paymentCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  paymentAmount: {
    flex: 1,
  },
  paymentAmountValue: {
    ...FONT_STYLES.h4,
    color: '#3e60ab',
  },
  paymentAmountLabel: {
    ...FONT_STYLES.caption,
    color: '#64748b',
    marginTop: 2,
  },
  paymentAction: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorativeCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.1,
    zIndex: 1,
  },
  decorativeLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    opacity: 0.3,
    zIndex: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...FONT_STYLES.h4,
    color: '#0f172a',
  },
  modalSubtitle: {
    ...FONT_STYLES.label,
    color: '#64748b',
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
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailCardTitle: {
    ...FONT_STYLES.h5,
    color: '#0f172a',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    ...FONT_STYLES.label,
    color: '#64748b',
    width: 120,
  },
  detailValue: {
    ...FONT_STYLES.label,
    color: '#0f172a',
    flex: 1,
  },
  narrationText: {
    ...FONT_STYLES.label,
    color: '#0f172a',
  },
});