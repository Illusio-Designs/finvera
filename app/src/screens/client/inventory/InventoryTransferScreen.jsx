import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { voucherAPI } from '../../../lib/api';
import { FONT_STYLES } from '../../../utils/fonts';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';
import { formatCurrency } from '../../../utils/businessLogic';
import CreateStockTransferModal from '../../../components/modals/CreateStockTransferModal';

export default function InventoryTransferScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, completed, cancelled

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      // Fetch stock transfer vouchers
      const params = { 
        voucher_type: 'stock_transfer',
        limit: 100 
      };
      
      // Apply status filter
      if (filter === 'pending') {
        params.status = 'draft';
      } else if (filter === 'completed') {
        params.status = 'posted';
      } else if (filter === 'cancelled') {
        params.status = 'cancelled';
      }
      
      const response = await voucherAPI.list(params);
      const data = response?.data?.data || response?.data || [];
      setTransfers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Stock transfers fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load stock transfers'
      });
      setTransfers([]);
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }, [filter, showNotification]);

  useEffect(() => {
    fetchTransfers();
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransfers();
    setRefreshing(false);
  }, [fetchTransfers]);

  const handleTransferPress = (transfer) => {
    setSelectedTransfer(transfer);
    setShowDetailModal(true);
  };

  const handleCreateTransfer = () => {
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    showNotification({
      type: 'success',
      title: 'Success',
      message: 'Stock transfer created successfully'
    });
    fetchTransfers();
  };

  const handleEditTransfer = (transfer) => {
    showNotification({
      type: 'info',
      title: 'Coming Soon',
      message: 'Edit stock transfer feature coming soon'
    });
  };

  const handleDeleteTransfer = (transfer) => {
    showNotification({
      type: 'info',
      title: 'Coming Soon',
      message: 'Delete stock transfer feature coming soon'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': '#f59e0b',
      'pending': '#f59e0b',
      'posted': '#059669',
      'completed': '#059669',
      'cancelled': '#dc2626',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'draft': 'Pending',
      'pending': 'Pending',
      'posted': 'Completed',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
    };
    return labels[status?.toLowerCase()] || status;
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Stock Transfers" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateTransfer}>
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.createButtonText}>New Transfer</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
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
            style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterTabText, filter === 'pending' && styles.filterTabTextActive]} numberOfLines={1}>
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
            onPress={() => setFilter('completed')}
          >
            <Text style={[styles.filterTabText, filter === 'completed' && styles.filterTabTextActive]} numberOfLines={1}>
              Completed
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

        {/* Transfers List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        ) : transfers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="swap-horizontal-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Transfers Found</Text>
            <Text style={styles.emptySubtitle}>
              Click "New Transfer" button above to create your first stock transfer
            </Text>
          </View>
        ) : (
          <View style={styles.transfersList}>
            {transfers.map((transfer, index) => (
              <TouchableOpacity
                key={transfer.id || index}
                style={styles.transferCard}
                onPress={() => handleTransferPress(transfer)}
              >
                <View style={styles.transferCardHeader}>
                  <View style={styles.transferMainInfo}>
                    <Text style={styles.transferNumber}>
                      {transfer.voucher_number || 'N/A'}
                    </Text>
                    <Text style={styles.transferDate}>
                      Date: {formatDate(transfer.voucher_date)}
                    </Text>
                    <Text style={styles.transferItems}>
                      Items: {transfer.items?.length || 0}
                    </Text>
                  </View>
                  <View style={styles.transferAmount}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(transfer.status) === '#059669' ? '#ecfdf5' : 
                                        getStatusColor(transfer.status) === '#f59e0b' ? '#fef3c7' : '#fef2f2' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(transfer.status) }
                      ]}>
                        {getStatusLabel(transfer.status)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.transferCardActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleTransferPress(transfer);
                    }}
                  >
                    <Ionicons name="eye-outline" size={16} color="#3e60ab" />
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditTransfer(transfer);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#059669" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteTransfer(transfer);
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

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedTransfer?.voucher_number || 'Transfer Details'}
            </Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedTransfer && (
              <View style={styles.detailContainer}>
                {/* Transfer Information */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Transfer Information</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Voucher Number</Text>
                      <Text style={styles.infoValue}>{selectedTransfer.voucher_number || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Date</Text>
                      <Text style={styles.infoValue}>{formatDate(selectedTransfer.voucher_date)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Status</Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(selectedTransfer.status) === '#059669' ? '#ecfdf5' : 
                                          getStatusColor(selectedTransfer.status) === '#f59e0b' ? '#fef3c7' : '#fef2f2' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: getStatusColor(selectedTransfer.status) }
                        ]}>
                          {getStatusLabel(selectedTransfer.status)}
                        </Text>
                      </View>
                    </View>
                    {selectedTransfer.narration && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Notes</Text>
                        <Text style={styles.infoValue}>{selectedTransfer.narration}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Items */}
                {selectedTransfer.items && selectedTransfer.items.length > 0 && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>Items</Text>
                    {selectedTransfer.items.map((item, index) => (
                      <View key={index} style={styles.itemCard}>
                        <Text style={styles.itemName}>{item.item_name || 'Item'}</Text>
                        <Text style={styles.itemDetails}>
                          Qty: {item.quantity || 0} {item.unit || ''}
                        </Text>
                        {item.rate && (
                          <Text style={styles.itemDetails}>
                            Rate: {formatCurrency(item.rate)}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
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

      {/* Create Stock Transfer Modal */}
      <CreateStockTransferModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
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
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3e60ab',
    minWidth: 200,
  },
  createButtonText: {
    ...FONT_STYLES.label,
    color: 'white',
    marginLeft: 8,
  },
  filterTabsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  filterTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  filterTabActive: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
  },
  filterTabText: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    whiteSpace: 'nowrap',
  },
  filterTabTextActive: {
    color: 'white',
  },
  loadingContainer: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  transfersList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  transferCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transferCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transferMainInfo: {
    flex: 1,
  },
  transferNumber: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  transferDate: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 2,
  },
  transferItems: {
    ...FONT_STYLES.caption,
    color: '#9ca3af',
  },
  transferAmount: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    ...FONT_STYLES.captionSmall,
  },
  transferCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  actionButtonText: {
    ...FONT_STYLES.captionSmall,
    marginLeft: 4,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailContainer: {
    gap: 20,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoSectionTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    marginBottom: 8,
  },
  infoLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    ...FONT_STYLES.label,
    color: '#111827',
  },
  itemCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemName: {
    ...FONT_STYLES.label,
    color: '#111827',
    marginBottom: 4,
  },
  itemDetails: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3e60ab',
  },
  modalActionButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  modalActionText: {
    ...FONT_STYLES.label,
    color: 'white',
    marginLeft: 8,
  },
});