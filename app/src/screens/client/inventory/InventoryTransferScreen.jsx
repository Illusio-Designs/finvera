import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { accountingAPI } from '../../../lib/api';
import { FONT_STYLES } from '../../../utils/fonts';

export default function InventoryTransferScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchTransfers = useCallback(async () => {
    try {
      const response = await accountingAPI.inventory.transfers.list({ limit: 50 }).catch(error => {
        console.error('Stock transfers API error:', error);
        return { data: { data: [] } };
      });
      
      // Enhanced error handling for API responses
      const data = response?.data?.data || response?.data?.transfers || response?.data || [];
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
      setLoading(false);
    }
  }, []); // Removed showNotification from dependencies

  useEffect(() => {
    fetchTransfers();
  }, []); // Changed to empty dependency array since there are no dynamic dependencies

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransfers();
    setRefreshing(false);
  }, [fetchTransfers]);

  const handleTransferPress = (transfer) => {
    setSelectedTransfer(transfer);
    setShowDetailModal(true);
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

  const getTransferStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'in_transit': '#3b82f6',
      'completed': '#10b981',
      'cancelled': '#ef4444',
      'rejected': '#8b5cf6',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getTransferStatusIcon = (status) => {
    const icons = {
      'pending': 'time',
      'in_transit': 'car',
      'completed': 'checkmark-circle',
      'cancelled': 'close-circle',
      'rejected': 'ban',
    };
    return icons[status?.toLowerCase()] || 'swap-horizontal';
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
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.sectionTitle}>Stock Transfers</Text>
          <Text style={styles.sectionSubtitle}>
            Track inventory movements between warehouses and locations
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="swap-horizontal" size={24} color="#3e60ab" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{transfers.length}</Text>
              <Text style={styles.statLabel}>Total Transfers</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="car" size={24} color="#3b82f6" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {transfers.filter(t => t.status === 'in_transit').length}
              </Text>
              <Text style={styles.statLabel}>In Transit</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {transfers.filter(t => t.status === 'completed').length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Transfers List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <View style={styles.spinner} />
              <Text style={styles.loadingText}>Loading transfers...</Text>
            </View>
          </View>
        ) : transfers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="swap-horizontal-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Transfers Found</Text>
              <Text style={styles.emptySubtitle}>
                No stock transfers have been recorded yet
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.transfersList}>
            {transfers.map((transfer, index) => (
              <TouchableOpacity
                key={transfer.id || index}
                style={styles.transferCard}
                onPress={() => handleTransferPress(transfer)}
                activeOpacity={0.95}
              >
                <View style={styles.transferCardGradient}>
                  <View style={styles.transferCardContent}>
                    <View style={styles.transferCardHeader}>
                      <View style={[
                        styles.transferIcon,
                        { backgroundColor: getTransferStatusColor(transfer.status) + '20' }
                      ]}>
                        <Ionicons 
                          name={getTransferStatusIcon(transfer.status)} 
                          size={24} 
                          color={getTransferStatusColor(transfer.status)} 
                        />
                      </View>
                      <View style={styles.transferInfo}>
                        <Text style={styles.transferTitle}>
                          {transfer.item_name || 'Stock Transfer'}
                        </Text>
                        <Text style={styles.transferDate}>
                          {formatDate(transfer.transfer_date || transfer.created_at)}
                        </Text>
                      </View>
                      <View style={styles.transferStatus}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getTransferStatusColor(transfer.status) }
                        ]}>
                          <Text style={styles.statusText}>
                            {transfer.status?.toUpperCase() || 'PENDING'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.transferCardBody}>
                      <View style={styles.transferDetail}>
                        <Ionicons name="cube-outline" size={16} color="#64748b" />
                        <Text style={styles.transferDetailText}>
                          Item: {transfer.item_code || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.transferDetail}>
                        <Ionicons name="layers-outline" size={16} color="#64748b" />
                        <Text style={styles.transferDetailText}>
                          Quantity: {transfer.quantity || 0} units
                        </Text>
                      </View>
                      <View style={styles.transferRoute}>
                        <View style={styles.routeItem}>
                          <Ionicons name="storefront-outline" size={14} color="#64748b" />
                          <Text style={styles.routeText}>
                            From: {transfer.from_warehouse_name || 'N/A'}
                          </Text>
                        </View>
                        <Ionicons name="arrow-forward" size={16} color="#94a3b8" />
                        <View style={styles.routeItem}>
                          <Ionicons name="storefront" size={14} color="#64748b" />
                          <Text style={styles.routeText}>
                            To: {transfer.to_warehouse_name || 'N/A'}
                          </Text>
                        </View>
                      </View>
                      {transfer.notes && (
                        <View style={styles.transferDetail}>
                          <Ionicons name="document-text-outline" size={16} color="#64748b" />
                          <Text style={styles.transferDetailText} numberOfLines={1}>
                            Notes: {transfer.notes}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.transferCardFooter}>
                      <View style={styles.transferMeta}>
                        <Text style={styles.transferReference}>
                          Ref: {transfer.reference_number || `TRF-${transfer.id}`}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.transferAction}>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Decorative elements */}
                  <View style={[
                    styles.decorativeCircle, 
                    { backgroundColor: getTransferStatusColor(transfer.status) + '20' }
                  ]} />
                  <View style={[
                    styles.decorativeLine, 
                    { backgroundColor: getTransferStatusColor(transfer.status) }
                  ]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Transfer Detail Modal */}
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
                { backgroundColor: selectedTransfer ? getTransferStatusColor(selectedTransfer.status) + '20' : '#dbeafe' }
              ]}>
                <Ionicons 
                  name={selectedTransfer ? getTransferStatusIcon(selectedTransfer.status) : 'swap-horizontal'} 
                  size={20} 
                  color={selectedTransfer ? getTransferStatusColor(selectedTransfer.status) : '#3e60ab'} 
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>Transfer Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedTransfer?.item_name || 'Stock Transfer'}
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
          
          {selectedTransfer && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Transfer Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference:</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransfer.reference_number || `TRF-${selectedTransfer.id}`}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getTransferStatusColor(selectedTransfer.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedTransfer.status?.toUpperCase() || 'PENDING'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedTransfer.transfer_date || selectedTransfer.created_at)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Item Name:</Text>
                  <Text style={styles.detailValue}>{selectedTransfer.item_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Item Code:</Text>
                  <Text style={styles.detailValue}>{selectedTransfer.item_code || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity:</Text>
                  <Text style={styles.detailValue}>{selectedTransfer.quantity || 0} units</Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Transfer Route</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>From Warehouse:</Text>
                  <Text style={styles.detailValue}>{selectedTransfer.from_warehouse_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>To Warehouse:</Text>
                  <Text style={styles.detailValue}>{selectedTransfer.to_warehouse_name || 'N/A'}</Text>
                </View>
                {selectedTransfer.expected_delivery_date && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Expected Delivery:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedTransfer.expected_delivery_date)}
                    </Text>
                  </View>
                )}
                {selectedTransfer.actual_delivery_date && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Actual Delivery:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedTransfer.actual_delivery_date)}
                    </Text>
                  </View>
                )}
              </View>

              {(selectedTransfer.notes || selectedTransfer.reason) && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Additional Information</Text>
                  {selectedTransfer.reason && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Reason:</Text>
                      <Text style={styles.detailValue}>{selectedTransfer.reason}</Text>
                    </View>
                  )}
                  {selectedTransfer.notes && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Notes:</Text>
                      <Text style={styles.detailValue}>{selectedTransfer.notes}</Text>
                    </View>
                  )}
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
  },
  sectionSubtitle: {
    ...FONT_STYLES.h5,
    color: '#64748b',
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
    ...FONT_STYLES.h5,
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
    ...FONT_STYLES.h3,
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...FONT_STYLES.h5,
    color: '#64748b',
    textAlign: 'center',
  },
  transfersList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  transferCard: {
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
  transferCardGradient: {
    position: 'relative',
    padding: 20,
  },
  transferCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  transferCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  transferIcon: {
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
  transferInfo: {
    flex: 1,
    paddingRight: 12,
  },
  transferTitle: {
    ...FONT_STYLES.h4,
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  transferDate: {
    ...FONT_STYLES.label,
    color: '#64748b',
    lineHeight: 18,
  },
  transferStatus: {
    alignItems: 'flex-end',
    minWidth: 85,
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
    minWidth: 75,
    alignItems: 'center',
  },
  statusText: {
    ...FONT_STYLES.captionSmall,
    fontWeight: '600',
    color: 'white',
  },
  transferCardBody: {
    marginBottom: 16,
    gap: 8,
  },
  transferDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  transferDetailText: {
    ...FONT_STYLES.label,
    color: '#64748b',
    flex: 1,
    lineHeight: 18,
  },
  transferRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginVertical: 4,
  },
  routeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeText: {
    ...FONT_STYLES.caption,
    color: '#64748b',
    flex: 1,
    lineHeight: 16,
  },
  transferCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  transferMeta: {
    flex: 1,
  },
  transferReference: {
    ...FONT_STYLES.caption,
    fontWeight: '600',
    color: '#3e60ab',
  },
  transferAction: {
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
    fontWeight: '600',
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
    fontWeight: '500',
    width: 120,
  },
  detailValue: {
    ...FONT_STYLES.label,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
  },
});