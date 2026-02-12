import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import CreateInventoryItemModal from '../../../components/modals/CreateInventoryItemModal';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { inventoryAPI } from '../../../lib/api';
import { FONT_STYLES } from '../../../utils/fonts';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';
import { formatCurrency } from '../../../utils/businessLogic';

export default function InventoryItemsScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, inactive

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await inventoryAPI.items.list({ 
        is_active: filter === 'active' ? true : filter === 'inactive' ? false : undefined,
        limit: 100 
      });
      
      const itemsData = response?.data?.data || response?.data?.items || response?.data || [];
      setItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (error) {
      console.error('Inventory items fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load inventory items'
      });
      setItems([]);
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }, [filter, showNotification]);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleItemPress = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleCreateItem = () => {
    setShowCreateModal(true);
  };

  const handleItemCreated = (newItem) => {
    // Refresh the items list after creating a new item
    fetchData();
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleItemUpdated = () => {
    // Refresh the items list after updating an item
    fetchData();
    setShowDetailModal(false);
  };

  const handleDeleteItem = async (item) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.item_name}"?`,
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
              await inventoryAPI.items.delete(item.id);
              showNotification({
                type: 'success',
                title: 'Success',
                message: 'Item deleted successfully'
              });
              fetchData();
            } catch (error) {
              console.error('Delete item error:', error);
              showNotification({
                type: 'error',
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete item'
              });
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Inventory Items" 
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
          <TouchableOpacity style={styles.createButton} onPress={handleCreateItem}>
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.createButtonText}>New Item</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              All Items
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

        {/* Items List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Items Found</Text>
            <Text style={styles.emptySubtitle}>
              Click "New Item" button above to create your first inventory item
            </Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={item.id || index}
                style={styles.itemCard}
                onPress={() => handleItemPress(item)}
              >
                <View style={styles.itemCardHeader}>
                  <View style={styles.itemMainInfo}>
                    <Text style={styles.itemName}>
                      {item.item_name || 'Unnamed Item'}
                    </Text>
                    <Text style={styles.itemCode}>
                      Code: {item.item_code || 'N/A'}
                    </Text>
                    {item.hsn_sac_code && (
                      <Text style={styles.itemHSN}>
                        HSN: {item.hsn_sac_code}
                      </Text>
                    )}
                  </View>
                  <View style={styles.itemAmount}>
                    <Text style={styles.itemPrice}>
                      {formatCurrency(item.avg_cost || 0)}
                    </Text>
                    <View style={[
                      styles.stockBadge,
                      { backgroundColor: (item.actual_stock || item.quantity_on_hand || 0) > 0 ? '#ecfdf5' : '#fef2f2' }
                    ]}>
                      <Text style={[
                        styles.stockText,
                        { color: (item.actual_stock || item.quantity_on_hand || 0) > 0 ? '#059669' : '#dc2626' }
                      ]}>
                        Stock: {item.actual_stock || item.quantity_on_hand || 0} {item.uqc || ''}
                      </Text>
                    </View>
                    <Text style={styles.stockValueText}>
                      Value: {formatCurrency((item.actual_stock || item.quantity_on_hand || 0) * (item.avg_cost || 0))}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.itemCardActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleItemPress(item);
                    }}
                  >
                    <Ionicons name="eye-outline" size={16} color="#3e60ab" />
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditItem(item);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#059669" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item);
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
              {selectedItem?.item_name || 'Item Details'}
            </Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedItem && (
              <View style={styles.detailContainer}>
                {/* Price Cards */}
                <View style={styles.priceCards}>
                  <View style={styles.priceCard}>
                    <Text style={styles.priceCardLabel}>Average Cost</Text>
                    <Text style={styles.priceCardValue}>
                      {formatCurrency(selectedItem.avg_cost || 0)}
                    </Text>
                  </View>
                  
                  <View style={styles.priceCard}>
                    <Text style={styles.priceCardLabel}>Stock Value (COGS)</Text>
                    <Text style={styles.priceCardValue}>
                      {formatCurrency((selectedItem.actual_stock || selectedItem.quantity_on_hand || 0) * (selectedItem.avg_cost || 0))}
                    </Text>
                  </View>
                </View>

                {/* Stock Information */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Stock Information (COGS Method)</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Actual Stock</Text>
                      <Text style={styles.infoValue}>{selectedItem.actual_stock || selectedItem.quantity_on_hand || 0} {selectedItem.uqc || 'Units'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Average Cost (COGS)</Text>
                      <Text style={styles.infoValue}>{formatCurrency(selectedItem.avg_cost || 0)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Total Value</Text>
                      <Text style={styles.infoValue}>{formatCurrency((selectedItem.actual_stock || selectedItem.quantity_on_hand || 0) * (selectedItem.avg_cost || 0))}</Text>
                    </View>
                  </View>
                </View>

                {/* Item Information */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Item Information</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Item Code</Text>
                      <Text style={styles.infoValue}>{selectedItem.item_code || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>HSN/SAC Code</Text>
                      <Text style={styles.infoValue}>{selectedItem.hsn_sac_code || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Unit</Text>
                      <Text style={styles.infoValue}>{selectedItem.uqc || selectedItem.unit || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>GST Rate</Text>
                      <Text style={styles.infoValue}>{selectedItem.gst_rate || 0}%</Text>
                    </View>
                    {selectedItem.item_description && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Description</Text>
                        <Text style={styles.infoValue}>{selectedItem.item_description}</Text>
                      </View>
                    )}
                    {selectedItem.category && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Category</Text>
                        <Text style={styles.infoValue}>{selectedItem.category}</Text>
                      </View>
                    )}
                    {selectedItem.brand && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Brand</Text>
                        <Text style={styles.infoValue}>{selectedItem.brand}</Text>
                      </View>
                    )}
                    {selectedItem.barcode && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Barcode</Text>
                        <Text style={styles.infoValue}>{selectedItem.barcode}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.modalActionButton}
              onPress={() => {
                setShowDetailModal(false);
                handleEditItem(selectedItem);
              }}
            >
              <Ionicons name="create-outline" size={16} color="white" />
              <Text style={styles.modalActionText}>Edit</Text>
            </TouchableOpacity>
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

      {/* Create Inventory Item Modal */}
      <CreateInventoryItemModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onItemCreated={handleItemCreated}
      />

      {/* Edit Inventory Item Modal */}
      <CreateInventoryItemModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onItemCreated={handleItemUpdated}
        editData={selectedItem}
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
  emptyButton: {
    backgroundColor: '#3e60ab',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    ...FONT_STYLES.label,
    color: 'white',
  },
  itemsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemCard: {
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
  itemCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemMainInfo: {
    flex: 1,
  },
  itemName: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  itemCode: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 2,
  },
  itemHSN: {
    ...FONT_STYLES.caption,
    color: '#9ca3af',
  },
  itemAmount: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockText: {
    ...FONT_STYLES.captionSmall,
  },
  stockValueText: {
    ...FONT_STYLES.captionSmall,
    color: '#6b7280',
    marginTop: 2,
  },
  itemCardActions: {
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
  priceCards: {
    flexDirection: 'row',
    gap: 12,
  },
  priceCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  priceCardLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 8,
  },
  priceCardValue: {
    ...FONT_STYLES.h2,
    color: '#111827',
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
