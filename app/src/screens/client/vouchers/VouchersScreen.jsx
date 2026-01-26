import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { accountingAPI, voucherAPI } from '../../../lib/api';
import { formatCurrency } from '../../../utils/businessLogic';

const VOUCHER_TYPES = [
  { value: 'sales_invoice', label: 'Sales Invoice', icon: 'trending-up', color: '#10b981' },
  { value: 'purchase_invoice', label: 'Purchase Invoice', icon: 'trending-down', color: '#f59e0b' },
  { value: 'payment', label: 'Payment', icon: 'card', color: '#3b82f6' },
  { value: 'receipt', label: 'Receipt', icon: 'cash', color: '#10b981' },
  { value: 'journal', label: 'Journal', icon: 'document-text', color: '#6b7280' },
  { value: 'contra', label: 'Contra', icon: 'refresh', color: '#3b82f6' },
  { value: 'debit_note', label: 'Debit Note', icon: 'remove-circle', color: '#f59e0b' },
  { value: 'credit_note', label: 'Credit Note', icon: 'add-circle', color: '#10b981' },
  { value: 'gst_payment', label: 'GST Payment', icon: 'shield-checkmark', color: '#3e60ab' },
  { value: 'gst_utilization', label: 'GST Utilization', icon: 'shield', color: '#3e60ab' },
  { value: 'tds_payment', label: 'TDS Payment', icon: 'calculator', color: '#f59e0b' },
  { value: 'tds_settlement', label: 'TDS Settlement', icon: 'checkmark-circle', color: '#f59e0b' },
];

export default function VouchersScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchVouchers = useCallback(async () => {
    try {
      const response = await voucherAPI.list({ 
        limit: 100,
        search: searchQuery || undefined
      });
      const data = response.data?.data || response.data || [];
      setVouchers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Vouchers fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load vouchers'
      });
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, showNotification]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVouchers();
    setRefreshing(false);
  }, [fetchVouchers]);

  const handleVoucherPress = (voucher) => {
    setSelectedVoucher(voucher);
    setShowDetailModal(true);
  };

  const handleCreateVoucher = (voucherType) => {
    showNotification({
      type: 'info',
      title: 'Coming Soon',
      message: `Create ${voucherType.label} functionality will be available soon`
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'posted': return '#10b981';
      case 'draft': return '#6b7280';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getVoucherTypeColor = (type) => {
    const voucherType = VOUCHER_TYPES.find(vt => 
      vt.value === type || vt.label.toLowerCase() === type?.toLowerCase()
    );
    return voucherType?.color || '#6b7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const renderVoucherCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.voucherCard}
      onPress={() => handleVoucherPress(item)}
    >
      <View style={styles.voucherHeader}>
        <View style={styles.voucherInfo}>
          <Text style={styles.voucherNumber}>{item.voucher_number || 'N/A'}</Text>
          <View style={[styles.typeBadge, { backgroundColor: getVoucherTypeColor(item.voucher_type) }]}>
            <Text style={styles.typeBadgeText}>{item.voucher_type || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.voucherAmount}>
          <Text style={styles.amountText}>{formatCurrency(item.total_amount || 0)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status || 'Draft'}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.voucherDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{formatDate(item.voucher_date)}</Text>
        </View>
        {item.reference && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{item.reference}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderVoucherTypeCard = ({ item }) => (
    <TouchableOpacity 
      style={[styles.typeCard, { borderColor: item.color }]}
      onPress={() => handleCreateVoucher(item)}
    >
      <View style={[styles.typeIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={24} color="white" />
      </View>
      <Text style={styles.typeLabel}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TopBar 
        title="Vouchers" 
        onMenuPress={handleMenuPress}
        showSearch={true}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={fetchVouchers}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Voucher Type Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Voucher</Text>
          <FlatList
            data={VOUCHER_TYPES}
            renderItem={renderVoucherTypeCard}
            keyExtractor={(item) => item.value}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.typeGrid}
          />
        </View>

        {/* Vouchers List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Vouchers</Text>
            <TouchableOpacity onPress={fetchVouchers}>
              <Ionicons name="refresh" size={20} color="#3e60ab" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading vouchers...</Text>
            </View>
          ) : vouchers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No vouchers found</Text>
              <Text style={styles.emptySubtext}>Create your first voucher using the options above</Text>
            </View>
          ) : (
            <FlatList
              data={vouchers}
              renderItem={renderVoucherCard}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.vouchersList}
            />
          )}
        </View>
      </ScrollView>

      {/* Voucher Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Voucher Details</Text>
            <TouchableOpacity 
              onPress={() => setShowDetailModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          {selectedVoucher && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Basic Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Voucher Number:</Text>
                  <Text style={styles.detailValue}>{selectedVoucher.voucher_number || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <View style={[styles.typeBadge, { backgroundColor: getVoucherTypeColor(selectedVoucher.voucher_type) }]}>
                    <Text style={styles.typeBadgeText}>{selectedVoucher.voucher_type || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedVoucher.voucher_date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedVoucher.total_amount || 0)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedVoucher.status) }]}>
                    <Text style={styles.statusText}>{selectedVoucher.status || 'Draft'}</Text>
                  </View>
                </View>
                {selectedVoucher.reference && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reference:</Text>
                    <Text style={styles.detailValue}>{selectedVoucher.reference}</Text>
                  </View>
                )}
                {selectedVoucher.narration && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Narration:</Text>
                    <Text style={styles.detailValue}>{selectedVoucher.narration}</Text>
                  </View>
                )}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={() => {
                    showNotification({
                      type: 'info',
                      title: 'Coming Soon',
                      message: 'View full voucher details functionality will be available soon'
                    });
                  }}
                >
                  <Ionicons name="eye" size={20} color="white" />
                  <Text style={styles.actionButtonText}>View Details</Text>
                </TouchableOpacity>
                
                {selectedVoucher.status === 'draft' && (
                  <>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => {
                        showNotification({
                          type: 'info',
                          title: 'Coming Soon',
                          message: 'Edit voucher functionality will be available soon'
                        });
                      }}
                    >
                      <Ionicons name="create" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.postButton]}
                      onPress={() => {
                        showNotification({
                          type: 'info',
                          title: 'Coming Soon',
                          message: 'Post voucher functionality will be available soon'
                        });
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Post</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
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
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'Agency',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeGrid: {
    gap: 12,
  },
  typeCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    marginVertical: 6,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    fontFamily: 'Agency',
  },
  vouchersList: {
    gap: 12,
  },
  voucherCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  voucherAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3e60ab',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  voucherDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    fontFamily: 'Agency',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Agency',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Agency',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
    fontFamily: 'Agency',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Agency',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  viewButton: {
    backgroundColor: '#3e60ab',
  },
  editButton: {
    backgroundColor: '#f59e0b',
  },
  postButton: {
    backgroundColor: '#10b981',
  },
});