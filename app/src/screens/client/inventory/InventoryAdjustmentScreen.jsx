import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { inventoryAPI } from '../../../lib/api';
import { FONT_STYLES } from '../../../utils/fonts';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';
import CreateStockAdjustmentModal from '../../../components/modals/CreateStockAdjustmentModal';

export default function InventoryAdjustmentScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [filter, setFilter] = useState('all'); // all, increase, decrease, damage

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchAdjustments = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const params = { limit: 100 };
      
      // Apply filter
      if (filter !== 'all') {
        params.adjustment_type = filter;
      }
      
      const response = await inventoryAPI.adjustments.list(params);
      const data = response?.data?.data || response?.data || [];
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
      // Ensure skeleton shows for at least 3 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }, [filter, showNotification]);

  useEffect(() => {
    fetchAdjustments();
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAdjustments();
    setRefreshing(false);
  }, [fetchAdjustments]);

  const handleAdjustmentPress = (adjustment) => {
    setSelectedAdjustment(adjustment);
    setShowDetailModal(true);
  };

  const handleCreateAdjustment = () => {
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    showNotification({
      type: 'success',
      title: 'Success',
      message: 'Stock adjustment created successfully'
    });
    fetchAdjustments();
  };

  const handleEditAdjustment = (adjustment) => {
    showNotification({
      type: 'info',
      title: 'Coming Soon',
      message: 'Edit stock adjustment feature coming soon'
    });
  };

  const handleDeleteAdjustment = (adjustment) => {
    showNotification({
      type: 'info',
      title: 'Coming Soon',
      message: 'Delete stock adjustment feature coming soon'
    });
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
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateAdjustment}>
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.createButtonText}>New Adjustment</Text>
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
            style={[styles.filterTab, filter === 'increase' && styles.filterTabActive]}
            onPress={() => setFilter('increase')}
          >
            <Text style={[styles.filterTabText, filter === 'increase' && styles.filterTabTextActive]} numberOfLines={1}>
              Increase
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'decrease' && styles.filterTabActive]}
            onPress={() => setFilter('decrease')}
          >
            <Text style={[styles.filterTabText, filter === 'decrease' && styles.filterTabTextActive]} numberOfLines={1}>
              Decrease
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'damage' && styles.filterTabActive]}
            onPress={() => setFilter('damage')}
          >
            <Text style={[styles.filterTabText, filter === 'damage' && styles.filterTabTextActive]} numberOfLines={1}>
              Damage
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Adjustments List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        ) : adjustments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="swap-horizontal-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Adjustments Found</Text>
            <Text style={styles.emptySubtitle}>
              Click "New Adjustment" button above to create your first stock adjustment
            </Text>
          </View>
        ) : (
          <View style={styles.adjustmentsList}>
            {adjustments.map((adjustment, index) => (
              <TouchableOpacity
                key={adjustment.id || index}
                style={styles.adjustmentCard}
                onPress={() => handleAdjustmentPress(adjustment)}
              >
                <View style={styles.adjustmentCardHeader}>
                  <View style={styles.adjustmentMainInfo}>
                    <Text style={styles.adjustmentTitle}>
                      {adjustment.item_name || 'Stock Adjustment'}
                    </Text>
                    <Text style={styles.adjustmentDate}>
                      Date: {formatDate(adjustment.adjustment_date || adjustment.created_at)}
                    </Text>
                    <Text style={styles.adjustmentQuantity}>
                      Quantity: {adjustment.quantity_adjusted || 0} units
                    </Text>
                  </View>
                  <View style={styles.adjustmentAmount}>
                    <View style={[
                      styles.typeBadge,
                      { backgroundColor: getAdjustmentTypeColor(adjustment.adjustment_type) === '#10b981' ? '#ecfdf5' : 
                                        getAdjustmentTypeColor(adjustment.adjustment_type) === '#ef4444' ? '#fef2f2' : '#fef3c7' }
                    ]}>
                      <Text style={[
                        styles.typeText,
                        { color: getAdjustmentTypeColor(adjustment.adjustment_type) }
                      ]}>
                        {adjustment.adjustment_type?.toUpperCase() || 'ADJUSTMENT'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.adjustmentCardActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleAdjustmentPress(adjustment);
                    }}
                  >
                    <Ionicons name="eye-outline" size={16} color="#3e60ab" />
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditAdjustment(adjustment);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#059669" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteAdjustment(adjustment);
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

      {/* Adjustment Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedAdjustment?.item_name || 'Adjustment Details'}
            </Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedAdjustment && (
              <View style={styles.detailContainer}>
                {/* Adjustment Information */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Adjustment Information</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Reference</Text>
                      <Text style={styles.infoValue}>
                        {selectedAdjustment.reference_number || `ADJ-${selectedAdjustment.id}`}
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Date</Text>
                      <Text style={styles.infoValue}>
                        {formatDate(selectedAdjustment.adjustment_date || selectedAdjustment.created_at)}
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Type</Text>
                      <View style={[
                        styles.typeBadge,
                        { backgroundColor: getAdjustmentTypeColor(selectedAdjustment.adjustment_type) === '#10b981' ? '#ecfdf5' : 
                                          getAdjustmentTypeColor(selectedAdjustment.adjustment_type) === '#ef4444' ? '#fef2f2' : '#fef3c7' }
                      ]}>
                        <Text style={[
                          styles.typeText,
                          { color: getAdjustmentTypeColor(selectedAdjustment.adjustment_type) }
                        ]}>
                          {selectedAdjustment.adjustment_type?.toUpperCase() || 'ADJUSTMENT'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Item Name</Text>
                      <Text style={styles.infoValue}>{selectedAdjustment.item_name || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Item Code</Text>
                      <Text style={styles.infoValue}>{selectedAdjustment.item_code || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Warehouse</Text>
                      <Text style={styles.infoValue}>{selectedAdjustment.warehouse_name || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Quantity Adjusted</Text>
                      <Text style={styles.infoValue}>{selectedAdjustment.quantity_adjusted || 0} units</Text>
                    </View>
                    {selectedAdjustment.reason && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Reason</Text>
                        <Text style={styles.infoValue}>{selectedAdjustment.reason}</Text>
                      </View>
                    )}
                    {selectedAdjustment.notes && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Notes</Text>
                        <Text style={styles.infoValue}>{selectedAdjustment.notes}</Text>
                      </View>
                    )}
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

      {/* Create Stock Adjustment Modal */}
      <CreateStockAdjustmentModal
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
  adjustmentsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  adjustmentCard: {
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
  adjustmentCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  adjustmentMainInfo: {
    flex: 1,
  },
  adjustmentTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  adjustmentDate: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 2,
  },
  adjustmentQuantity: {
    ...FONT_STYLES.caption,
    color: '#9ca3af',
  },
  adjustmentAmount: {
    alignItems: 'flex-end',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    ...FONT_STYLES.captionSmall,
  },
  adjustmentCardActions: {
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