import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { accountingAPI } from '../../../lib/api';

export default function InventoryAdjustmentScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchAdjustments = useCallback(async () => {
    try {
      const response = await accountingAPI.stockAdjustments.list({ limit: 50 });
      const data = response.data?.data || response.data || [];
      setAdjustments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Stock adjustments fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load stock adjustments'
      });
      setAdjustments([]);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAdjustments();
    setRefreshing(false);
  }, [fetchAdjustments]);

  const handleAdjustmentPress = (adjustment) => {
    setSelectedAdjustment(adjustment);
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

  const getAdjustmentTypeColor = (type) => {
    const colors = {
      'increase': '#10b981',
      'decrease': '#ef4444',
      'damage': '#f59e0b',
      'loss': '#8b5cf6',
      'found': '#06b6d4',
    };
    return colors[type?.toLowerCase()] || '#6b7280';
  };

  const getAdjustmentTypeIcon = (type) => {
    const icons = {
      'increase': 'trending-up',
      'decrease': 'trending-down',
      'damage': 'warning',
      'loss': 'remove-circle',
      'found': 'add-circle',
    };
    return icons[type?.toLowerCase()] || 'swap-horizontal';
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Stock Adjustments" 
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
          <Text style={styles.sectionTitle}>Stock Adjustments</Text>
          <Text style={styles.sectionSubtitle}>
            Track and manage inventory adjustments and corrections
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="swap-horizontal" size={24} color="#3e60ab" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{adjustments.length}</Text>
              <Text style={styles.statLabel}>Total Adjustments</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="trending-up" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {adjustments.filter(adj => adj.adjustment_type === 'increase').length}
              </Text>
              <Text style={styles.statLabel}>Increases</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="trending-down" size={24} color="#ef4444" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {adjustments.filter(adj => adj.adjustment_type === 'decrease').length}
              </Text>
              <Text style={styles.statLabel}>Decreases</Text>
            </View>
          </View>
        </View>

        {/* Adjustments List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <View style={styles.spinner} />
              <Text style={styles.loadingText}>Loading adjustments...</Text>
            </View>
          </View>
        ) : adjustments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="swap-horizontal-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Adjustments Found</Text>
              <Text style={styles.emptySubtitle}>
                No stock adjustments have been recorded yet
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.adjustmentsList}>
            {adjustments.map((adjustment, index) => (
              <TouchableOpacity
                key={adjustment.id || index}
                style={styles.adjustmentCard}
                onPress={() => handleAdjustmentPress(adjustment)}
                activeOpacity={0.95}
              >
                <View style={styles.adjustmentCardGradient}>
                  <View style={styles.adjustmentCardContent}>
                    <View style={styles.adjustmentCardHeader}>
                      <View style={[
                        styles.adjustmentIcon,
                        { backgroundColor: getAdjustmentTypeColor(adjustment.adjustment_type) + '20' }
                      ]}>
                        <Ionicons 
                          name={getAdjustmentTypeIcon(adjustment.adjustment_type)} 
                          size={24} 
                          color={getAdjustmentTypeColor(adjustment.adjustment_type)} 
                        />
                      </View>
                      <View style={styles.adjustmentInfo}>
                        <Text style={styles.adjustmentTitle}>
                          {adjustment.item_name || 'Stock Adjustment'}
                        </Text>
                        <Text style={styles.adjustmentDate}>
                          {formatDate(adjustment.adjustment_date || adjustment.created_at)}
                        </Text>
                      </View>
                      <View style={styles.adjustmentStatus}>
                        <View style={[
                          styles.typeBadge,
                          { backgroundColor: getAdjustmentTypeColor(adjustment.adjustment_type) }
                        ]}>
                          <Text style={styles.typeText}>
                            {adjustment.adjustment_type?.toUpperCase() || 'ADJUSTMENT'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.adjustmentCardBody}>
                      <View style={styles.adjustmentDetail}>
                        <Ionicons name="cube-outline" size={16} color="#64748b" />
                        <Text style={styles.adjustmentDetailText}>
                          Item: {adjustment.item_code || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.adjustmentDetail}>
                        <Ionicons name="layers-outline" size={16} color="#64748b" />
                        <Text style={styles.adjustmentDetailText}>
                          Quantity: {adjustment.quantity_adjusted || 0} units
                        </Text>
                      </View>
                      <View style={styles.adjustmentDetail}>
                        <Ionicons name="storefront-outline" size={16} color="#64748b" />
                        <Text style={styles.adjustmentDetailText}>
                          Warehouse: {adjustment.warehouse_name || 'N/A'}
                        </Text>
                      </View>
                      {adjustment.reason && (
                        <View style={styles.adjustmentDetail}>
                          <Ionicons name="document-text-outline" size={16} color="#64748b" />
                          <Text style={styles.adjustmentDetailText} numberOfLines={1}>
                            Reason: {adjustment.reason}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.adjustmentCardFooter}>
                      <View style={styles.adjustmentMeta}>
                        <Text style={styles.adjustmentReference}>
                          Ref: {adjustment.reference_number || `ADJ-${adjustment.id}`}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.adjustmentAction}>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Decorative elements */}
                  <View style={[
                    styles.decorativeCircle, 
                    { backgroundColor: getAdjustmentTypeColor(adjustment.adjustment_type) + '20' }
                  ]} />
                  <View style={[
                    styles.decorativeLine, 
                    { backgroundColor: getAdjustmentTypeColor(adjustment.adjustment_type) }
                  ]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Adjustment Detail Modal */}
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
                { backgroundColor: selectedAdjustment ? getAdjustmentTypeColor(selectedAdjustment.adjustment_type) + '20' : '#dbeafe' }
              ]}>
                <Ionicons 
                  name={selectedAdjustment ? getAdjustmentTypeIcon(selectedAdjustment.adjustment_type) : 'swap-horizontal'} 
                  size={20} 
                  color={selectedAdjustment ? getAdjustmentTypeColor(selectedAdjustment.adjustment_type) : '#3e60ab'} 
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>Adjustment Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedAdjustment?.item_name || 'Stock Adjustment'}
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
          
          {selectedAdjustment && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Adjustment Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference:</Text>
                  <Text style={styles.detailValue}>
                    {selectedAdjustment.reference_number || `ADJ-${selectedAdjustment.id}`}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <View style={[
                    styles.typeBadge,
                    { backgroundColor: getAdjustmentTypeColor(selectedAdjustment.adjustment_type) }
                  ]}>
                    <Text style={styles.typeText}>
                      {selectedAdjustment.adjustment_type?.toUpperCase() || 'ADJUSTMENT'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedAdjustment.adjustment_date || selectedAdjustment.created_at)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Item Name:</Text>
                  <Text style={styles.detailValue}>{selectedAdjustment.item_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Item Code:</Text>
                  <Text style={styles.detailValue}>{selectedAdjustment.item_code || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Warehouse:</Text>
                  <Text style={styles.detailValue}>{selectedAdjustment.warehouse_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity Adjusted:</Text>
                  <Text style={styles.detailValue}>
                    {selectedAdjustment.quantity_adjusted || 0} units
                  </Text>
                </View>
                {selectedAdjustment.reason && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reason:</Text>
                    <Text style={styles.detailValue}>{selectedAdjustment.reason}</Text>
                  </View>
                )}
                {selectedAdjustment.notes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Notes:</Text>
                    <Text style={styles.detailValue}>{selectedAdjustment.notes}</Text>
                  </View>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Agency',
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
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
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
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
    textAlign: 'center',
    lineHeight: 24,
  },
  adjustmentsList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  adjustmentCard: {
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
  adjustmentCardGradient: {
    position: 'relative',
    padding: 20,
  },
  adjustmentCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  adjustmentCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  adjustmentIcon: {
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
  adjustmentInfo: {
    flex: 1,
    paddingRight: 12,
  },
  adjustmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  adjustmentDate: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 18,
  },
  adjustmentStatus: {
    alignItems: 'flex-end',
    minWidth: 90,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  adjustmentCardBody: {
    marginBottom: 16,
    gap: 8,
  },
  adjustmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  adjustmentDetailText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    flex: 1,
    lineHeight: 18,
  },
  adjustmentCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  adjustmentMeta: {
    flex: 1,
  },
  adjustmentReference: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3e60ab',
    fontFamily: 'Agency',
  },
  adjustmentAction: {
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
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    width: 120,
    fontFamily: 'Agency',
  },
  detailValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
    fontFamily: 'Agency',
  },
});