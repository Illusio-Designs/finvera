import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { useConfirmation } from '../../../contexts/ConfirmationContext';
import { voucherAPI } from '../../../lib/api';
import { FONT_STYLES } from '../../../utils/fonts';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';
import { formatCurrency } from '../../../utils/businessLogic';
import CreatePaymentModal from '../../../components/modals/CreatePaymentModal';

export default function PaymentScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const { showDangerConfirmation } = useConfirmation();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const params = { 
        voucher_type: 'payment',
        limit: 100 
      };
      
      if (filter === 'draft') {
        params.status = 'draft';
      } else if (filter === 'posted') {
        params.status = 'posted';
      } else if (filter === 'cancelled') {
        params.status = 'cancelled';
      }
      
      const response = await voucherAPI.list(params);
      const data = response?.data?.data || response?.data || [];
      setVouchers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Payment vouchers fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load payment vouchers'
      });
      setVouchers([]);
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      setTimeout(() => setLoading(false), remainingTime);
    }
  }, [filter, showNotification]);

  useEffect(() => {
    fetchVouchers();
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVouchers();
    setRefreshing(false);
  }, [fetchVouchers]);

  const handleVoucherPress = (voucher) => {
    setSelectedVoucher(voucher);
    setShowDetailModal(true);
  };

  const handleCreatePayment = () => {
    setShowCreateModal(true);
  };

  const handlePaymentCreated = () => {
    fetchVouchers();
    setEditingVoucher(null);
  };

  const handleEditVoucher = (voucher) => {
    setEditingVoucher(voucher);
    setShowCreateModal(true);
  };

  const handleDeleteVoucher = async (voucher) => {
    const confirmed = await showDangerConfirmation(
      'Delete Payment',
      `Are you sure you want to delete payment ${voucher.voucher_number}? This action cannot be undone.`,
      {
        confirmText: 'Delete',
        cancelText: 'Cancel',
      }
    );

    if (confirmed) {
      try {
        await voucherAPI.delete(voucher.id);
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Payment deleted successfully'
        });
        fetchVouchers();
      } catch (error) {
        console.error('Delete voucher error:', error);
        showNotification({
          type: 'error',
          title: 'Error',
          message: error.response?.data?.message || 'Failed to delete payment'
        });
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': '#f59e0b',
      'posted': '#059669',
      'cancelled': '#dc2626',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'draft': 'Draft',
      'posted': 'Posted',
      'cancelled': 'Cancelled',
    };
    return labels[status?.toLowerCase()] || status;
  };

  return (
    <View style={styles.container}>
      <TopBar title="Payment Vouchers" onMenuPress={handleMenuPress} />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreatePayment}>
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.createButtonText}>New Payment</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterTabsContainer}
          contentContainerStyle={styles.filterTabs}
        >
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]} numberOfLines={1}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'draft' && styles.filterTabActive]}
            onPress={() => setFilter('draft')}
          >
            <Text style={[styles.filterTabText, filter === 'draft' && styles.filterTabTextActive]} numberOfLines={1}>
              Draft
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'posted' && styles.filterTabActive]}
            onPress={() => setFilter('posted')}
          >
            <Text style={[styles.filterTabText, filter === 'posted' && styles.filterTabTextActive]} numberOfLines={1}>
              Posted
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'cancelled' && styles.filterTabActive]}
            onPress={() => setFilter('cancelled')}
          >
            <Text style={[styles.filterTabText, filter === 'cancelled' && styles.filterTabTextActive]} numberOfLines={1}>
              Cancelled
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        ) : vouchers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Payments Found</Text>
            <Text style={styles.emptySubtitle}>
              Click "New Payment" button above to create your first payment voucher
            </Text>
          </View>
        ) : (
          <View style={styles.vouchersList}>
            {vouchers.map((voucher, index) => (
              <TouchableOpacity
                key={voucher.id || index}
                style={styles.voucherCard}
                onPress={() => handleVoucherPress(voucher)}
              >
                <View style={styles.voucherCardHeader}>
                  <View style={styles.voucherMainInfo}>
                    <Text style={styles.voucherNumber}>
                      {voucher.voucher_number || 'N/A'}
                    </Text>
                    <Text style={styles.voucherDate}>
                      Date: {formatDate(voucher.voucher_date)}
                    </Text>
                    <Text style={styles.voucherParty}>
                      {voucher.partyLedger?.ledger_name || voucher.party_name || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.voucherAmount}>
                    <Text style={styles.voucherTotal}>
                      {formatCurrency(voucher.total_amount || voucher.amount || 0)}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(voucher.status) === '#059669' ? '#ecfdf5' : 
                                        getStatusColor(voucher.status) === '#f59e0b' ? '#fef3c7' : '#fef2f2' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(voucher.status) }
                      ]}>
                        {getStatusLabel(voucher.status)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.voucherCardActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleVoucherPress(voucher);
                    }}
                  >
                    <Ionicons name="eye-outline" size={16} color="#3e60ab" />
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditVoucher(voucher);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#059669" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteVoucher(voucher);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedVoucher?.voucher_number || 'Payment Details'}
            </Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedVoucher && (
              <View style={styles.detailContainer}>
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Payment Information</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Voucher Number</Text>
                      <Text style={styles.infoValue}>{selectedVoucher.voucher_number || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Date</Text>
                      <Text style={styles.infoValue}>{formatDate(selectedVoucher.voucher_date)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Party</Text>
                      <Text style={styles.infoValue}>{selectedVoucher.partyLedger?.ledger_name || selectedVoucher.party_name || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Status</Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(selectedVoucher.status) === '#059669' ? '#ecfdf5' : 
                                          getStatusColor(selectedVoucher.status) === '#f59e0b' ? '#fef3c7' : '#fef2f2' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: getStatusColor(selectedVoucher.status) }
                        ]}>
                          {getStatusLabel(selectedVoucher.status)}
                        </Text>
                      </View>
                    </View>
                    {selectedVoucher.narration && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Narration</Text>
                        <Text style={styles.infoValue}>{selectedVoucher.narration}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Amount</Text>
                  <View style={styles.totalsGrid}>
                    <View style={[styles.totalRow, styles.grandTotalRow]}>
                      <Text style={styles.grandTotalLabel}>Total Amount:</Text>
                      <Text style={styles.grandTotalValue}>{formatCurrency(selectedVoucher.total_amount || selectedVoucher.amount || 0)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalActionButton, styles.modalActionButtonSecondary]}
              onPress={() => setShowDetailModal(false)}
            >
              <Ionicons name="close" size={16} color="#3e60ab" />
              <Text style={[styles.modalActionText, { color: '#3e60ab' }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CreatePaymentModal
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingVoucher(null);
        }}
        onPaymentCreated={handlePaymentCreated}
        editData={editingVoucher}
        isEdit={!!editingVoucher}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  headerActions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3e60ab', minWidth: 200 },
  createButtonText: { ...FONT_STYLES.label, color: 'white', marginLeft: 8 },
  filterTabsContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  filterTabs: { flexDirection: 'row', gap: 8, paddingRight: 16 },
  filterTab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', minWidth: 90 },
  filterTabActive: { backgroundColor: '#3e60ab', borderColor: '#3e60ab' },
  filterTabText: { ...FONT_STYLES.label, color: '#6b7280' },
  filterTabTextActive: { color: 'white' },
  loadingContainer: { paddingHorizontal: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { ...FONT_STYLES.h3, color: '#111827', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { ...FONT_STYLES.body, color: '#6b7280', textAlign: 'center' },
  vouchersList: { paddingHorizontal: 16, paddingBottom: 16 },
  voucherCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  voucherCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  voucherMainInfo: { flex: 1 },
  voucherNumber: { ...FONT_STYLES.h5, color: '#111827', marginBottom: 4 },
  voucherDate: { ...FONT_STYLES.caption, color: '#6b7280', marginBottom: 2 },
  voucherParty: { ...FONT_STYLES.caption, color: '#9ca3af' },
  voucherAmount: { alignItems: 'flex-end' },
  voucherTotal: { ...FONT_STYLES.h5, color: '#111827', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { ...FONT_STYLES.captionSmall },
  voucherCardActions: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f9fafb' },
  actionButtonText: { ...FONT_STYLES.captionSmall, marginLeft: 4 },
  modalContainer: { flex: 1, backgroundColor: '#f9fafb' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { ...FONT_STYLES.h4, color: '#111827', flex: 1 },
  modalContent: { flex: 1, paddingHorizontal: 20, paddingVertical: 16 },
  detailContainer: { gap: 20 },
  infoSection: { backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  infoSectionTitle: { ...FONT_STYLES.h5, color: '#111827', marginBottom: 16 },
  infoGrid: { gap: 12 },
  infoItem: { marginBottom: 8 },
  infoLabel: { ...FONT_STYLES.caption, color: '#6b7280', marginBottom: 4 },
  infoValue: { ...FONT_STYLES.label, color: '#111827' },
  totalsGrid: { gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  grandTotalRow: { borderTopWidth: 2, borderTopColor: '#10b981', paddingTop: 8, marginTop: 4 },
  grandTotalLabel: { ...FONT_STYLES.h5, color: '#111827' },
  grandTotalValue: { ...FONT_STYLES.h5, color: '#10b981' },
  modalActions: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 12 },
  modalActionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: '#3e60ab' },
  modalActionButtonSecondary: { backgroundColor: 'white', borderWidth: 1, borderColor: '#3e60ab' },
  modalActionText: { ...FONT_STYLES.label, color: 'white', marginLeft: 8 },
});
