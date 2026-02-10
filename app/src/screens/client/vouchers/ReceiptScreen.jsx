import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../../utils/fonts';;
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { voucherAPI } from '../../../lib/api';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

export default function ReceiptScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await voucherAPI.list({ 
        voucher_type: 'receipt',
        search: searchQuery,
        status: filter === 'all' ? undefined : filter,
        limit: 50 
      });
      const data = response.data?.data || response.data || [];
      setReceipts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Receipts fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load receipt vouchers'
      });
      setReceipts([]);
    } finally {
      // Ensure skeleton shows for at least 3 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }, [searchQuery, filter, showNotification]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReceipts();
    setRefreshing(false);
  }, [fetchReceipts]);

  const handleReceiptPress = (receipt) => {
    setSelectedReceipt(receipt);
    setShowDetailModal(true);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getReceiptStatusColor = (status) => {
    const colors = {
      'received': '#10b981',
      'pending': '#f59e0b',
      'cancelled': '#ef4444',
      'draft': '#6b7280',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getReceiptStatusIcon = (status) => {
    const icons = {
      'received': 'checkmark-circle',
      'pending': 'time',
      'cancelled': 'close-circle',
      'draft': 'document-text',
    };
    return icons[status?.toLowerCase()] || 'document-text';
  };

  const filterOptions = [
    { key: 'all', label: 'All Receipts', icon: 'list-outline' },
    { key: 'received', label: 'Received', icon: 'checkmark-circle-outline' },
    { key: 'pending', label: 'Pending', icon: 'time-outline' },
    { key: 'draft', label: 'Draft', icon: 'document-text-outline' },
  ];

  return (
    <View style={styles.container}>
      <TopBar 
        title="Receipt Vouchers" 
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
          <Text style={styles.sectionTitle}>Receipt Vouchers</Text>
          <Text style={styles.sectionSubtitle}>
            Manage and track all receipt transactions
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search receipts by party or reference..."
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
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="receipt" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{receipts.length}</Text>
              <Text style={styles.statLabel}>Total Receipts</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {receipts.filter(r => r.status === 'received').length}
              </Text>
              <Text style={styles.statLabel}>Received</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="time" size={24} color="#f59e0b" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {receipts.filter(r => r.status === 'pending').length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Receipts List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        ) : receipts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Receipts Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? `No receipts found matching "${searchQuery}"`
                  : 'No receipt vouchers have been created yet'
                }
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.receiptsList}>
            {receipts.map((receipt, index) => (
              <TouchableOpacity
                key={receipt.id || index}
                style={styles.receiptCard}
                onPress={() => handleReceiptPress(receipt)}
                activeOpacity={0.95}
              >
                <View style={styles.receiptCardGradient}>
                  <View style={styles.receiptCardContent}>
                    <View style={styles.receiptCardHeader}>
                      <View style={[
                        styles.receiptIcon,
                        { backgroundColor: getReceiptStatusColor(receipt.status) + '20' }
                      ]}>
                        <Ionicons 
                          name={getReceiptStatusIcon(receipt.status)} 
                          size={24} 
                          color={getReceiptStatusColor(receipt.status)} 
                        />
                      </View>
                      <View style={styles.receiptInfo}>
                        <Text style={styles.receiptTitle}>
                          {receipt.party_name || 'Receipt Voucher'}
                        </Text>
                        <Text style={styles.receiptDate}>
                          {formatDate(receipt.voucher_date)}
                        </Text>
                      </View>
                      <View style={styles.receiptStatus}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getReceiptStatusColor(receipt.status) }
                        ]}>
                          <Text style={styles.statusText}>
                            {receipt.status?.toUpperCase() || 'DRAFT'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.receiptCardBody}>
                      <View style={styles.receiptDetail}>
                        <Ionicons name="document-text-outline" size={16} color="#64748b" />
                        <Text style={styles.receiptDetailText}>
                          Voucher No: {receipt.voucher_number || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.receiptDetail}>
                        <Ionicons name="person-outline" size={16} color="#64748b" />
                        <Text style={styles.receiptDetailText}>
                          From: {receipt.party_name || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.receiptDetail}>
                        <Ionicons name="card-outline" size={16} color="#64748b" />
                        <Text style={styles.receiptDetailText}>
                          Mode: {receipt.receipt_mode || 'Cash'}
                        </Text>
                      </View>
                      {receipt.reference_number && (
                        <View style={styles.receiptDetail}>
                          <Ionicons name="bookmark-outline" size={16} color="#64748b" />
                          <Text style={styles.receiptDetailText}>
                            Ref: {receipt.reference_number}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.receiptCardFooter}>
                      <View style={styles.receiptAmount}>
                        <Text style={styles.receiptAmountValue}>
                          {formatCurrency(receipt.total_amount)}
                        </Text>
                        <Text style={styles.receiptAmountLabel}>Amount Received</Text>
                      </View>
                      <TouchableOpacity style={styles.receiptAction}>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Decorative elements */}
                  <View style={[
                    styles.decorativeCircle, 
                    { backgroundColor: getReceiptStatusColor(receipt.status) + '20' }
                  ]} />
                  <View style={[
                    styles.decorativeLine, 
                    { backgroundColor: getReceiptStatusColor(receipt.status) }
                  ]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Receipt Detail Modal */}
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
                { backgroundColor: selectedReceipt ? getReceiptStatusColor(selectedReceipt.status) + '20' : '#d1fae5' }
              ]}>
                <Ionicons 
                  name={selectedReceipt ? getReceiptStatusIcon(selectedReceipt.status) : 'receipt'} 
                  size={20} 
                  color={selectedReceipt ? getReceiptStatusColor(selectedReceipt.status) : '#10b981'} 
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>Receipt Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedReceipt?.party_name || 'Receipt Voucher'}
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
          
          {selectedReceipt && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Voucher Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Voucher Number:</Text>
                  <Text style={styles.detailValue}>{selectedReceipt.voucher_number || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedReceipt.voucher_date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Received From:</Text>
                  <Text style={styles.detailValue}>{selectedReceipt.party_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getReceiptStatusColor(selectedReceipt.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedReceipt.status?.toUpperCase() || 'DRAFT'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Receipt Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Receipt Mode:</Text>
                  <Text style={styles.detailValue}>{selectedReceipt.receipt_mode || 'Cash'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedReceipt.total_amount)}</Text>
                </View>
                {selectedReceipt.reference_number && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reference Number:</Text>
                    <Text style={styles.detailValue}>{selectedReceipt.reference_number}</Text>
                  </View>
                )}
                {selectedReceipt.bank_name && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bank:</Text>
                    <Text style={styles.detailValue}>{selectedReceipt.bank_name}</Text>
                  </View>
                )}
              </View>

              {selectedReceipt.narration && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Narration</Text>
                  <Text style={styles.narrationText}>{selectedReceipt.narration}</Text>
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
    letterSpacing: -0.5
  },
  sectionSubtitle: {
    ...FONT_STYLES.h5,
    color: '#64748b',
    lineHeight: 24
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
    ...FONT_STYLES.h5,
    flex: 1,
    color: '#0f172a'
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
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
  },
  filterTabText: {
    ...FONT_STYLES.label,
    color: '#64748b'
  },
  filterTabTextActive: {
    color: 'white',
    fontWeight: '600',
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
    color: '#0f172a'
  },
  statLabel: {
    ...FONT_STYLES.caption,
    color: '#64748b',
    marginTop: 2
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
    borderTopColor: '#10b981',
    marginBottom: 12,
  },
  loadingText: {
    ...FONT_STYLES.h5,
    color: '#64748b'
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
    textAlign: 'center'
  },
  emptySubtitle: {
    ...FONT_STYLES.h5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24
  },
  receiptsList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  receiptCard: {
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
  receiptCardGradient: {
    position: 'relative',
    padding: 20,
  },
  receiptCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  receiptCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  receiptIcon: {
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
  receiptInfo: {
    flex: 1,
    paddingRight: 12,
  },
  receiptTitle: {
    ...FONT_STYLES.h5,
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.3,
    lineHeight: 22
  },
  receiptDate: {
    ...FONT_STYLES.label,
    color: '#64748b',
    lineHeight: 18
  },
  receiptStatus: {
    alignItems: 'flex-end',
    minWidth: 80,
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
    minWidth: 70,
    alignItems: 'center',
  },
  statusText: {
    ...FONT_STYLES.captionSmall,
    color: 'white'
  },
  receiptCardBody: {
    marginBottom: 16,
    gap: 8,
  },
  receiptDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  receiptDetailText: {
    ...FONT_STYLES.label,
    color: '#64748b',
    flex: 1,
    lineHeight: 18
  },
  receiptCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  receiptAmount: {
    flex: 1,
  },
  receiptAmountValue: {
    ...FONT_STYLES.h5,
    color: '#10b981'
  },
  receiptAmountLabel: {
    ...FONT_STYLES.caption,
    color: '#64748b',
    marginTop: 2
  },
  receiptAction: {
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
    ...FONT_STYLES.h5,
    color: '#0f172a'
  },
  modalSubtitle: {
    ...FONT_STYLES.label,
    color: '#64748b',
    marginTop: 2
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
    marginBottom: 16
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    ...FONT_STYLES.label,
    color: '#64748b',
    width: 120
  },
  detailValue: {
    ...FONT_STYLES.label,
    color: '#0f172a',
    flex: 1
  },
  narrationText: {
    ...FONT_STYLES.label,
    color: '#0f172a',
    lineHeight: 20
  },
});