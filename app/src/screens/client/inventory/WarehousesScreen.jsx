import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import CreateWarehouseModal from '../../../components/modals/CreateWarehouseModal';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { inventoryAPI } from '../../../lib/api';
import { FONT_STYLES } from '../../../utils/fonts';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

export default function WarehousesScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, inactive

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await inventoryAPI.warehouses.list({ limit: 50 });
      const data = response.data?.data || response.data || [];
      let warehousesList = Array.isArray(data) ? data : [];
      
      // Apply filter
      if (filter === 'active') {
        warehousesList = warehousesList.filter(wh => wh.is_active);
      } else if (filter === 'inactive') {
        warehousesList = warehousesList.filter(wh => !wh.is_active);
      }
      
      setWarehouses(warehousesList);
    } catch (error) {
      console.error('Warehouses fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load warehouses'
      });
      setWarehouses([]);
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
    fetchWarehouses();
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWarehouses();
    setRefreshing(false);
  }, [fetchWarehouses]);

  const handleWarehousePress = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowDetailModal(true);
  };

  const handleCreateWarehouse = () => {
    setShowCreateModal(true);
  };

  const handleEditWarehouse = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowEditModal(true);
  };

  const handleDeleteWarehouse = async (warehouse) => {
    Alert.alert(
      'Delete Warehouse',
      `Are you sure you want to delete "${warehouse.warehouse_name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await inventoryAPI.warehouses.delete(warehouse.id);
              showNotification({
                type: 'success',
                title: 'Success',
                message: 'Warehouse deleted successfully'
              });
              fetchWarehouses();
            } catch (error) {
              console.error('Delete warehouse error:', error);
              showNotification({
                type: 'error',
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete warehouse'
              });
            }
          }
        }
      ]
    );
  };

  const handleWarehouseCreated = () => {
    fetchWarehouses();
  };

  const handleWarehouseUpdated = () => {
    fetchWarehouses();
    setShowDetailModal(false);
  };

  const getWarehouseTypeColor = (type) => {
    const colors = {
      'main': '#3e60ab',
      'branch': '#10b981',
      'transit': '#f59e0b',
      'damaged': '#ef4444',
      'virtual': '#8b5cf6',
    };
    return colors[type?.toLowerCase()] || '#6b7280';
  };

  const getWarehouseTypeIcon = (type) => {
    const icons = {
      'main': 'business',
      'branch': 'storefront',
      'transit': 'car',
      'damaged': 'warning',
      'virtual': 'cloud',
    };
    return icons[type?.toLowerCase()] || 'storefront';
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Warehouses" 
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
          <TouchableOpacity style={styles.createButton} onPress={handleCreateWarehouse}>
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.createButtonText}>New Warehouse</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterTabText, filter === 'active' && styles.filterTabTextActive]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'inactive' && styles.filterTabActive]}
            onPress={() => setFilter('inactive')}
          >
            <Text style={[styles.filterTabText, filter === 'inactive' && styles.filterTabTextActive]}>
              Inactive
            </Text>
          </TouchableOpacity>
        </View>

        {/* Warehouses List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        ) : warehouses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Warehouses Found</Text>
            <Text style={styles.emptySubtitle}>
              Click "New Warehouse" button above to create your first warehouse
            </Text>
          </View>
        ) : (
          <View style={styles.warehousesList}>
            {warehouses.map((warehouse, index) => (
              <TouchableOpacity
                key={warehouse.id || index}
                style={styles.warehouseCard}
                onPress={() => handleWarehousePress(warehouse)}
              >
                <View style={styles.warehouseCardHeader}>
                  <View style={styles.warehouseMainInfo}>
                    <Text style={styles.warehouseName}>
                      {warehouse.warehouse_name || 'Unnamed Warehouse'}
                    </Text>
                    <Text style={styles.warehouseCode}>
                      Code: {warehouse.warehouse_code || 'N/A'}
                    </Text>
                    <Text style={styles.warehouseType}>
                      Type: {warehouse.warehouse_type?.toUpperCase() || 'GENERAL'}
                    </Text>
                  </View>
                  <View style={styles.warehouseAmount}>
                    {warehouse.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: warehouse.is_active ? '#ecfdf5' : '#fef2f2' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: warehouse.is_active ? '#059669' : '#dc2626' }
                      ]}>
                        {warehouse.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.warehouseCardActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleWarehousePress(warehouse);
                    }}
                  >
                    <Ionicons name="eye-outline" size={16} color="#3e60ab" />
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditWarehouse(warehouse);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#059669" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteWarehouse(warehouse);
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

      {/* Warehouse Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Text style={styles.modalTitle}>
                {selectedWarehouse?.warehouse_name || 'Warehouse Details'}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowDetailModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          {selectedWarehouse && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Basic Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedWarehouse.warehouse_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Code:</Text>
                  <Text style={styles.detailValue}>{selectedWarehouse.warehouse_code || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>
                    {selectedWarehouse.warehouse_type?.toUpperCase() || 'GENERAL'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: selectedWarehouse.is_active ? '#10b981' : '#ef4444' }
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedWarehouse.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Default:</Text>
                  <Text style={styles.detailValue}>
                    {selectedWarehouse.is_default ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Location & Contact</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address:</Text>
                  <Text style={styles.detailValue}>
                    {selectedWarehouse.address || 'No address provided'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>City:</Text>
                  <Text style={styles.detailValue}>{selectedWarehouse.city || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>State:</Text>
                  <Text style={styles.detailValue}>{selectedWarehouse.state || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pincode:</Text>
                  <Text style={styles.detailValue}>{selectedWarehouse.pincode || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact:</Text>
                  <Text style={styles.detailValue}>{selectedWarehouse.contact_number || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedWarehouse.email || 'N/A'}</Text>
                </View>
              </View>

              {(selectedWarehouse.manager_name || selectedWarehouse.capacity) && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Additional Information</Text>
                  {selectedWarehouse.manager_name && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Manager:</Text>
                      <Text style={styles.detailValue}>{selectedWarehouse.manager_name}</Text>
                    </View>
                  )}
                  {selectedWarehouse.capacity && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Capacity:</Text>
                      <Text style={styles.detailValue}>{selectedWarehouse.capacity}</Text>
                    </View>
                  )}
                  {selectedWarehouse.description && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Description:</Text>
                      <Text style={styles.detailValue}>{selectedWarehouse.description}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Create Warehouse Modal */}
      <CreateWarehouseModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onWarehouseCreated={handleWarehouseCreated}
      />

      {/* Edit Warehouse Modal */}
      <CreateWarehouseModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onWarehouseCreated={handleWarehouseUpdated}
        editData={selectedWarehouse}
        isEdit={true}
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
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
  },
  filterTabText: {
    ...FONT_STYLES.label,
    color: '#6b7280',
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
  warehousesList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  warehouseCard: {
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
  warehouseCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  warehouseMainInfo: {
    flex: 1,
  },
  warehouseName: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  warehouseCode: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 2,
  },
  warehouseType: {
    ...FONT_STYLES.caption,
    color: '#9ca3af',
  },
  warehouseAmount: {
    alignItems: 'flex-end',
    gap: 4,
  },
  defaultBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    ...FONT_STYLES.captionSmall,
    color: 'white',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    ...FONT_STYLES.captionSmall,
  },
  warehouseCardActions: {
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
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
  },
  modalSubtitle: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    width: 100,
  },
  detailValue: {
    ...FONT_STYLES.label,
    color: '#111827',
    flex: 1,
  },
});